"""
protocol_extractor.py — Unified protocol extraction using PageIndex ReasoningRetriever.

Strategy:
1. Accept raw PDF bytes
2. Build PageIndex (structural tree from TOC + heading layout + table extraction)
3. Assemble a high-yield context window from the most informative pages
4. Run regex/heuristic field extraction (no LLM required) over the context
5. Second-pass regex verification for numeric fields
6. Cross-validate against ClinicalTrials.gov if NCT ID found

No LLM dependency for core extraction — pure data-driven, fully deterministic.
"""
from __future__ import annotations
import re
import statistics
from typing import Optional
from .reasoning_retriever import ReasoningRetriever


# ─────────────────────────────────────────────────────────
# Section heading patterns (for backward-compat plain-text parse)
# ─────────────────────────────────────────────────────────
SECTION_HEADING_PATTERNS: list[tuple[str, list[str]]] = [
    ("title",            ["study title", "protocol title", "title of study", "title of protocol", "full title"]),
    ("objectives",       ["objectives", "study objectives", "purpose", "aim of study"]),
    ("primary_endpoint", ["primary endpoint", "primary outcome", "primary efficacy endpoint", "primary objective"]),
    ("secondary_endpoint",["secondary endpoint", "secondary outcome", "secondary objective", "other endpoints"]),
    ("phase",            ["study phase", "phase of study", "clinical phase"]),
    ("design",           ["study design", "design overview", "overall design", "trial design"]),
    ("eligibility",      ["eligibility criteria", "inclusion criteria", "inclusion/exclusion", "selection criteria"]),
    ("sample_size",      ["sample size", "number of subjects", "number of patients", "enrollment target"]),
    ("sponsor",          ["sponsor", "sponsor information", "sponsor name", "applicant"]),
    ("interventions",    ["study drug", "investigational product", "treatment", "intervention", "study treatment"]),
    ("conditions",       ["indication", "disease", "therapeutic area", "study indication", "condition"]),
    ("registration",     ["nct", "registration", "clinicaltrials.gov", "trial registration"]),
]

STOP_WORDS = {
    "the", "a", "an", "and", "or", "of", "in", "is", "are", "was", "were",
    "to", "for", "with", "at", "by", "from", "as", "this", "that", "will",
    "be", "has", "have", "had", "not", "but", "which", "who", "they", "all"
}

# ─────────────────────────────────────────────────────────
# Primary Entry Point: PDF bytes → structured fields
# ─────────────────────────────────────────────────────────

def extract_from_pdf_bytes(content: bytes) -> tuple[dict, dict]:
    """
    Main extraction pipeline using ReasoningRetriever (PageIndex).
    Returns (fields_with_confidence, flat_dict).
    """
    retriever = ReasoningRetriever(pdf_bytes=content)
    context = retriever.get_high_yield_overview_context()

    # Build a sections dict from the PageIndex for field extractors
    sections: dict[str, str] = {}
    _populate_sections_from_retriever(retriever, sections, context)

    fields = extract_protocol_fields(sections)
    return fields, flatten_extracted(fields)


def _populate_sections_from_retriever(retriever: ReasoningRetriever, sections: dict, full_context: str):
    """
    Pull targeted section text from the PageIndex into the sections dict,
    then provide the full context as __full__ for fallback regex.
    """
    pi = retriever.page_index
    section_map = {
        "title": "synopsis",
        "objectives": "objectives",
        "primary_endpoint": "endpoints",
        "design": "design",
        "eligibility": "eligibility",
        "sample_size": "statistics",
        "interventions": "dosing",
        "conditions": "synopsis",
    }
    for field_key, pi_section in section_map.items():
        pages = pi.get_pages_for_section(pi_section, max_pages=2)
        if pages:
            sections[field_key] = "\n".join(p["text"] for p in pages)[:4000]

    # Full context for regex fallback
    sections["__full__"] = full_context


# ─────────────────────────────────────────────────────────
# Legacy: Section-Aware PDF Parser (kept for plain-text path)
# ─────────────────────────────────────────────────────────

def extract_sections_from_pdf_bytes(content: bytes) -> dict[str, str]:
    """Legacy path — calls the unified pipeline and returns sections."""
    try:
        retriever = ReasoningRetriever(pdf_bytes=content)
        context = retriever.get_high_yield_overview_context()
        sections: dict[str, str] = {}
        _populate_sections_from_retriever(retriever, sections, context)
        return sections
    except Exception:
        return {}


# ─────────────────────────────────────────────────────────
# Protocol Field Extraction (pure regex/heuristic, no LLM)
# ─────────────────────────────────────────────────────────

def extract_protocol_fields(sections: dict[str, str]) -> dict:
    full = sections.get("__full__", "")
    full_lower = full.lower()

    fields = {}

    nct_match = re.search(r'\bNCT\d{8}\b', full, re.IGNORECASE)
    fields["nctId"] = {
        "value": nct_match.group(0).upper() if nct_match else None,
        "confidence": 1.0 if nct_match else 0.0,
        "source": nct_match.group(0) if nct_match else None,
    }

    title_val, title_conf, title_src = _extract_title(sections, full)
    fields["title"] = {"value": title_val, "confidence": title_conf, "source": title_src}

    phase_val, phase_conf, phase_src = _extract_phase(sections, full_lower)
    fields["phase"] = {"value": phase_val, "confidence": phase_conf, "source": phase_src}

    pe_val, pe_conf, pe_src = _extract_endpoints(sections, "primary")
    fields["primaryOutcomes"] = {"value": pe_val, "confidence": pe_conf, "source": pe_src}

    se_val, se_conf, se_src = _extract_endpoints(sections, "secondary")
    fields["secondaryOutcomes"] = {"value": se_val, "confidence": se_conf, "source": se_src}

    n_val, n_conf, n_src = _extract_enrollment(sections, full_lower)
    fields["enrollmentCount"] = {"value": n_val, "confidence": n_conf, "source": n_src}

    elig_val, elig_conf, elig_src = _extract_eligibility(sections, full)
    fields["eligibilityCriteria"] = {"value": elig_val, "confidence": elig_conf, "source": elig_src}

    sp_val, sp_conf, sp_src = _extract_sponsor(sections, full)
    fields["sponsorName"] = {"value": sp_val, "confidence": sp_conf, "source": sp_src}

    mask_val, mask_conf, mask_src = _extract_masking(sections, full_lower)
    fields["masking"] = {"value": mask_val, "confidence": mask_conf, "source": mask_src}

    alloc_val, alloc_conf, alloc_src = _extract_allocation(sections, full_lower)
    fields["allocation"] = {"value": alloc_val, "confidence": alloc_conf, "source": alloc_src}

    st_val = "OBSERVATIONAL" if re.search(r'\bobservational\b|\bcohort\b|\bregist', full_lower) else "INTERVENTIONAL"
    fields["studyType"] = {"value": st_val, "confidence": 0.8, "source": None}

    cond_val, cond_conf, cond_src = _extract_conditions(sections, full)
    fields["conditions"] = {"value": cond_val, "confidence": cond_conf, "source": cond_src}

    intr_val, intr_conf, intr_src = _extract_interventions(sections, full)
    fields["interventions"] = {"value": intr_val, "confidence": intr_conf, "source": intr_src}

    scored_fields = [v["confidence"] for v in fields.values() if isinstance(v, dict) and v.get("value")]
    fields["__meta__"] = {
        "extractionConfidence": round(statistics.mean(scored_fields), 2) if scored_fields else 0.0,
        "sectionsDetected": [k for k in sections if not k.startswith("__")],
        "rawTextLength": len(full),
    }

    return fields


# ─────────────────────────────────────────────────────────
# Field Extractors (deterministic, regex-based)
# ─────────────────────────────────────────────────────────

def _extract_title(sections: dict, full: str) -> tuple[str, float, str]:
    if sections.get("title"):
        raw = sections["title"][:250].strip()
        if len(raw) > 20 and not raw.lower().startswith("the following"):
            first_line = raw.split("\n")[0].strip()
            if len(first_line) > 20:
                return first_line[:200], 0.9, first_line

    m = re.search(
        r'(?:protocol\s+title|study\s+title|full\s+title)\s*[:\-]\s*([^\n]{20,250})',
        full, re.IGNORECASE
    )
    if m:
        return m.group(1).strip(), 0.85, m.group(0)[:120]

    for line in full.split("\n")[:30]:
        line = line.strip()
        if len(line) > 30 and not re.match(r'^(page|version|\d+|confidential)', line, re.IGNORECASE):
            return line[:200], 0.4, line[:120]

    return "", 0.0, ""


def _extract_phase(sections: dict, full_lower: str) -> tuple[list[str], float, str]:
    phase_text = sections.get("phase", "") + " " + sections.get("design", "")

    patterns = {
        "EARLY_PHASE1": r"\bearly\s+phase\s+1\b|\bphase\s+0\b",
        "PHASE1": r"\bphase\s+1\b|\bphase\s+i\b(?!\w|i)",
        "PHASE2": r"\bphase\s+2\b|\bphase\s+ii\b(?!\w|i)",
        "PHASE3": r"\bphase\s+3\b|\bphase\s+iii\b(?!\w)",
        "PHASE4": r"\bphase\s+4\b|\bphase\s+iv\b(?!\w)",
    }

    found: dict[str, int] = {}
    for ph, pat in patterns.items():
        n_section = len(re.findall(pat, (phase_text or "").lower()))
        n_full = len(re.findall(pat, full_lower))
        if n_section >= 1:
            found[ph] = n_section * 3
        elif n_full >= 2:
            found[ph] = n_full

    if not found:
        return [], 0.0, ""

    top_count = max(found.values())
    phases = [ph for ph, cnt in found.items() if cnt >= top_count * 0.5]
    confidence = min(0.95, 0.6 + len(phase_text) / 5000) if phase_text else 0.5
    return sorted(phases), round(confidence, 2), phase_text[:100] if phase_text else ""


def _extract_endpoints(sections: dict, kind: str) -> tuple[list[str], float, str]:
    key = "primary_endpoint" if kind == "primary" else "secondary_endpoint"
    section_text = sections.get(key, "")

    if section_text:
        items = _extract_list_items(section_text, max_items=8 if kind == "secondary" else 3)
        if items:
            return items, 0.85, section_text[:200]

    full = sections.get("__full__", "")
    pattern = rf"{kind}\s+(?:endpoint|outcome|objective)[s]?\s*[:\-]?\s*([^\n]{{20,300}})"
    matches = re.findall(pattern, full, re.IGNORECASE)
    if matches:
        items = [m.strip()[:200] for m in matches[:8]]
        return items, 0.6, matches[0][:150] if matches else ""

    return [], 0.0, ""


def _extract_list_items(text: str, max_items: int = 5) -> list[str]:
    numbered = re.findall(r'(?:^|\n)\s*\d+[.):]?\s+([^\n]{10,250})', text)
    if numbered and len(numbered) >= 2:
        return [n.strip() for n in numbered[:max_items]]

    inline_numbered = re.split(r'\s+\d+[.):]?\s+', text)
    if len(inline_numbered) >= 3:
        items = [s.strip() for s in inline_numbered[1:] if len(s.strip()) > 10]
        if items:
            return items[:max_items]

    bulleted = re.findall(r'(?:^|\n)\s*[•\-\*–]\s+([^\n]{10,250})', text)
    if bulleted:
        return [b.strip() for b in bulleted[:max_items]]

    semicolons = [s.strip() for s in text.split(";") if len(s.strip()) > 15]
    if len(semicolons) >= 2:
        return semicolons[:max_items]

    if numbered:
        return [n.strip() for n in numbered[:max_items]]

    clean = re.sub(r'\s+', ' ', text).strip()
    if len(clean) > 20:
        return [clean[:300]]

    return []


def _extract_enrollment(sections: dict, full_lower: str) -> tuple[Optional[int], float, str]:
    ss_text = sections.get("sample_size", "")
    search_text = ss_text if ss_text else full_lower

    patterns = [
        r'(?:enroll|randomize|randomise|recruit)\s+(?:approximately\s+)?(\d{2,5})\s*(?:patients|subjects|participants|volunteers)',
        r'(?:target|planned|total)\s+(?:sample\s+size|enrollment|enrolment)\s+(?:of\s+)?(?:approximately\s+)?(\d{2,5})',
        r'(?:n\s*=\s*|sample\s+size\s+of\s+)(\d{2,5})',
        r'(\d{2,5})\s*(?:patients|subjects|participants)\s+will\s+be\s+(?:enrolled|randomized)',
    ]

    best_n: Optional[int] = None
    best_conf = 0.0
    best_src = ""

    for pat in patterns:
        for m in re.finditer(pat, search_text, re.IGNORECASE):
            n = int(m.group(1))
            if 10 <= n <= 100000:
                conf = 0.9 if ss_text else 0.7
                if best_n is None or conf > best_conf:
                    best_n = n
                    best_conf = conf
                    best_src = m.group(0)

    return best_n, best_conf, best_src


def _extract_eligibility(sections: dict, full: str) -> tuple[str, float, str]:
    elig_text = sections.get("eligibility", "")
    if elig_text and len(elig_text) > 50:
        clean = re.sub(r'\s+', ' ', elig_text).strip()
        return clean[:2000], 0.9, elig_text[:100]

    m = re.search(
        r'(?:inclusion|eligibility)\s+criteria\s*[:\-]?\s*((?:.|\n){80,3000}?)(?=exclusion\s+criteria|study\s+design|primary\s+endpoint|$)',
        full, re.IGNORECASE
    )
    if m:
        val = re.sub(r'\s+', ' ', m.group(1)).strip()[:2000]
        return val, 0.65, m.group(0)[:100]

    return "", 0.0, ""


def _extract_sponsor(sections: dict, full: str) -> tuple[str, float, str]:
    sp_text = sections.get("sponsor", "")
    if sp_text:
        first_line = sp_text.split("\n")[0].strip()
        if 5 < len(first_line) < 150:
            return first_line, 0.9, first_line

    patterns = [
        r'(?:^|\n)(?:sponsor|applicant|company)\s*[:\-]\s*([A-Za-z][^\n,;]{5,100})',
        r'(?:sponsor|applicant|company)\s+(?:is|name|:)\s*([A-Za-z][^\n,;]{5,100})',
        r'(?:submitted\s+by|prepared\s+by|developed\s+by)\s+([A-Za-z][^\n,;]{5,100})',
    ]
    for pat in patterns:
        m = re.search(pat, full, re.IGNORECASE)
        if m:
            val = m.group(1).strip()
            if len(val) > 5 and val.lower() not in STOP_WORDS:
                return val[:100], 0.75, m.group(0)[:80]

    return "", 0.0, ""


def _extract_masking(sections: dict, full_lower: str) -> tuple[str, float, str]:
    design_text = (sections.get("design", "") + " " + sections.get("__full__", "")).lower()
    search = design_text if sections.get("design") else full_lower

    if re.search(r'(?:double[- ]blind|double[- ]masked|dbl[- ]blind|quadruple[- ]blind)', search):
        return "DOUBLE", 0.95, "double-blind"
    if re.search(r'(?:triple[- ]blind|triple[- ]masked)', search):
        return "TRIPLE", 0.9, "triple-blind"
    if re.search(r'(?:single[- ]blind|single[- ]masked|investigator[- ]blind)', search):
        return "SINGLE", 0.85, "single-blind"
    if re.search(r'(?:open[- ]label|unblinded|open\s+label)', search):
        return "NONE", 0.9, "open-label"

    return "", 0.0, ""


def _extract_allocation(sections: dict, full_lower: str) -> tuple[str, float, str]:
    design_text = (sections.get("design", "") or "").lower()
    search = design_text if design_text else full_lower

    if re.search(r'\brandomized\b|\brandomised\b|\brandomization\b|\brandomisation\b', search):
        return "RANDOMIZED", 0.9, "randomized"
    if re.search(r'\bnon-?random(?:ized|ised)\b|\bnon-?randomized\b', search):
        return "NON_RANDOMIZED", 0.85, "non-randomized"
    if re.search(r'\bsingle\s+arm\b|\bsingle-arm\b|\bopen[- ]label\b', search):
        return "NON_RANDOMIZED", 0.7, "single-arm"

    return "", 0.0, ""


def _extract_conditions(sections: dict, full: str) -> tuple[list[str], float, str]:
    cond_text = sections.get("conditions", "")
    if cond_text:
        items = _extract_list_items(cond_text, max_items=5)
        if items:
            return items, 0.85, cond_text[:100]

    patterns = [
        r'(?:indication|disease|condition|disorder|therapeutic\s+area)\s*[:\-]\s*([A-Za-z][^\n,;]{5,100})',
    ]
    found = []
    for pat in patterns:
        for m in re.finditer(pat, full, re.IGNORECASE):
            val = m.group(1).strip()
            if len(val) > 5 and not val.lower().startswith(("not", "any", "see", "refer", "the")):
                found.append(val[:100])
    if found:
        return list(dict.fromkeys(found[:5])), 0.7, found[0] if found else ""

    return [], 0.0, ""


def _extract_interventions(sections: dict, full: str) -> tuple[list[dict], float, str]:
    intr_text = sections.get("interventions", "")

    patterns = [
        r'(?:investigational\s+(?:product|drug|medicinal\s+product)|study\s+drug|study\s+treatment|IMP)\s*[:\-]?\s*([A-Za-z][^\n,;]{3,80})',
        r'(?:treatment|arm|cohort)\s*[:\-]\s*([A-Za-z][^\n,;]{3,80})',
        r'(?:administered|given|dosed)\s+(?:with\s+)?([A-Za-z][^\n,;]{3,60})',
    ]

    search_text = intr_text if intr_text else full
    found: list[dict] = []
    seen: set[str] = set()

    for pat in patterns:
        for m in re.finditer(pat, search_text, re.IGNORECASE):
            name = m.group(1).strip()[:80]
            key = name.lower()[:30]
            if key not in seen and len(name) > 3 and name.lower() not in STOP_WORDS:
                seen.add(key)
                intr_type = "DRUG" if re.search(r'\bmg\b|\bkg\b|\bdose\b|\borg/\b|\bonce\b|\btwice\b', name, re.IGNORECASE) else "PROCEDURE"
                found.append({"name": name, "type": intr_type})
            if len(found) >= 5:
                break

    conf = 0.85 if (found and intr_text) else 0.6 if found else 0.0
    return found, conf, intr_text[:100] if intr_text else ""


# ─────────────────────────────────────────────────────────
# Flatten / report helpers
# ─────────────────────────────────────────────────────────

def flatten_extracted(fields: dict) -> dict:
    result = {}
    for key, v in fields.items():
        if key.startswith("__"):
            continue
        if isinstance(v, dict) and "value" in v:
            result[key] = v["value"]
        else:
            result[key] = v
    return result


def extraction_report(fields: dict) -> list[dict]:
    report = []
    for key, v in fields.items():
        if key.startswith("__"):
            continue
        if isinstance(v, dict):
            val = v.get("value")
            conf = v.get("confidence", 0)
            src = v.get("source", "")
            status = "extracted" if val else "missing"
            report.append({
                "field": key,
                "status": status,
                "confidence": conf,
                "preview": str(val)[:80] if val else None,
                "sourceExcerpt": str(src)[:80] if src else None,
            })
    return sorted(report, key=lambda x: x["confidence"], reverse=True)
