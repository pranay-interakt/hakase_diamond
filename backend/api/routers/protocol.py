"""
protocol.py — Protocol Hub routes.

Extraction pipeline:
1. Section-aware PDF parsing (PyMuPDF block layout)
2. Each field is extracted from its correct section — not a flat regex scan
3. If NCT ID is found in the document, fields are cross-validated against ClinicalTrials.gov
4. ClinicalTrials.gov data fills any missing/low-confidence fields
5. Response includes per-field confidence scores and source excerpts
"""
from __future__ import annotations
from fastapi import APIRouter, UploadFile, File, HTTPException, Query
from pydantic import BaseModel
from typing import Optional
from ..services.compliance_rules import check_protocol_compliance, calculate_compliance_score
from ..services import ctgov, analysis
from ..services.protocol_extractor import (
    extract_from_pdf_bytes,
    extract_sections_from_pdf_bytes,
    extract_protocol_fields,
    flatten_extracted,
    extraction_report,
)
import re

router = APIRouter(prefix="/protocol", tags=["protocol"])

CONFIDENCE_THRESHOLD = 0.6  # below this, prefer ClinicalTrials.gov data if available


# ─────────────────────────────────────────────────────────
# PDF Upload and Analysis
# ─────────────────────────────────────────────────────────

@router.post("/analyze-upload")
async def analyze_protocol_upload(file: UploadFile = File(...)):
    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are accepted")

    content = await file.read()
    if len(content) > 50 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File too large (max 50 MB)")

    # ── Step 1: PageIndex extraction (structural + regex, no LLM) ──
    try:
        fields, flat = extract_from_pdf_bytes(content)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Could not parse PDF: {exc}")

    if not fields:
        raise HTTPException(status_code=400, detail="Could not parse PDF — no readable text blocks found")

    report = extraction_report(fields)

    # ── Step 2: Cross-validate with ClinicalTrials.gov if NCT ID found ──
    nct_field = fields.get("nctId", {})
    nct_id = nct_field.get("value") if isinstance(nct_field, dict) else None
    ctgov_data = None
    ctgov_core = None

    if nct_id:
        try:
            ctgov_data = await ctgov.get_study(nct_id)
            ctgov_core = ctgov.extract_core(ctgov_data)
            # Fill in any missing/low-confidence fields from ClinicalTrials.gov
            flat = _merge_with_ctgov(flat, fields, ctgov_core)
        except Exception:
            ctgov_core = None

    # ── Step 3: Search similar trials (condition + phase from extracted/merged data) ──
    search_condition = (flat.get("conditions") or [""])[0] or ""
    phase_list = flat.get("phase") or []
    similar_studies: list[dict] = []

    if search_condition:
        try:
            sim_data = await ctgov.search_studies(
                condition=search_condition,
                phase=phase_list or None,
                status=["COMPLETED", "TERMINATED", "WITHDRAWN", "ACTIVE_NOT_RECRUITING"],
                page_size=30,
            )
            similar_studies = [ctgov.extract_core(s) for s in sim_data.get("studies", [])]
        except Exception:
            pass

    # ── Step 4: Compliance check and success probability ──
    issues = check_protocol_compliance(flat)
    score = calculate_compliance_score(issues)
    success_prob = analysis.compute_success_probability(flat, similar_studies)
    enroll_stats = analysis.compute_enrollment_stats(similar_studies)

    return {
        "parsed": {
            **flat,
            "__extractionMeta": fields.get("__meta__"),
        },
        "extractionReport": report,
        "ctgovValidated": ctgov_core is not None,
        "ctgovNctId": nct_id,
        "compliance": {
            "score": score,
            "issues": [_format_issue(i) for i in issues],
        },
        "successProbability": success_prob,
        "enrollmentBenchmark": enroll_stats,
        "similarTrials": similar_studies[:10],
    }


# ─────────────────────────────────────────────────────────
# Plain Text Analysis
# ─────────────────────────────────────────────────────────

class ProtocolTextInput(BaseModel):
    text: str
    condition: Optional[str] = None
    phase: Optional[list[str]] = None


@router.post("/analyze-text")
async def analyze_protocol_text(body: ProtocolTextInput):
    # For plain text: use the section extractor with a synthetic single-section map
    sections = {"__full__": body.text}

    # Try to detect sub-sections from text headings
    _detect_text_sections(body.text, sections)

    fields = extract_protocol_fields(sections)
    report = extraction_report(fields)
    flat = flatten_extracted(fields)

    # Override with user-provided values
    if body.condition:
        flat["conditions"] = [body.condition]
    if body.phase:
        flat["phase"] = body.phase

    # NCT ID cross-validation
    nct_field = fields.get("nctId", {})
    nct_id = nct_field.get("value") if isinstance(nct_field, dict) else None
    ctgov_core = None
    if nct_id:
        try:
            ctgov_data = await ctgov.get_study(nct_id)
            ctgov_core = ctgov.extract_core(ctgov_data)
            flat = _merge_with_ctgov(flat, fields, ctgov_core)
        except Exception:
            pass

    search_condition = (flat.get("conditions") or [""])[0] or body.condition or ""
    phase_list = flat.get("phase") or []
    similar_studies: list[dict] = []

    if search_condition:
        try:
            sim_data = await ctgov.search_studies(
                condition=search_condition,
                phase=phase_list or None,
                status=["COMPLETED", "TERMINATED", "WITHDRAWN", "ACTIVE_NOT_RECRUITING"],
                page_size=30,
            )
            similar_studies = [ctgov.extract_core(s) for s in sim_data.get("studies", [])]
        except Exception:
            pass

    issues = check_protocol_compliance(flat)
    score = calculate_compliance_score(issues)
    success_prob = analysis.compute_success_probability(flat, similar_studies)

    return {
        "parsed": {**flat, "__extractionMeta": fields.get("__meta__")},
        "extractionReport": report,
        "ctgovValidated": ctgov_core is not None,
        "compliance": {
            "score": score,
            "issues": [_format_issue(i) for i in issues],
        },
        "successProbability": success_prob,
        "similarTrials": similar_studies[:10],
    }


# ─────────────────────────────────────────────────────────
# Outcome Strategies
# ─────────────────────────────────────────────────────────

@router.get("/strategies")
async def get_outcome_strategies(
    condition: str = Query(...),
    phase: Optional[str] = Query(default=None),
    limit: int = Query(default=30, le=50),
):
    """
    Returns real outcome strategies used in ClinicalTrials.gov trials for this condition.
    Includes endpoint frequency analysis, masking/allocation patterns, enrollment benchmarks.
    """
    phases = [p.strip().upper() for p in phase.split(",")] if phase else None
    data = await ctgov.search_studies(
        condition=condition,
        phase=phases,
        status=["COMPLETED", "ACTIVE_NOT_RECRUITING"],
        page_size=min(limit * 2, 50),
    )
    studies = data.get("studies", [])

    strategies = []
    primary_endpoint_freq: dict[str, int] = {}
    masking_freq: dict[str, int] = {}
    allocation_freq: dict[str, int] = {}
    endpoint_keywords: dict[str, int] = {}
    intervention_model_freq: dict[str, int] = {}
    enrollment_values: list[int] = []

    for raw in studies:
        core = ctgov.extract_core(raw)
        proto = raw.get("protocolSection", {})
        outcomes_mod = proto.get("outcomesModule", {})
        design_mod = proto.get("designModule", {})
        design_info = design_mod.get("designInfo", {})

        primary = [o.get("measure", "") for o in outcomes_mod.get("primaryOutcomes", [])]
        secondary = [o.get("measure", "") for o in outcomes_mod.get("secondaryOutcomes", [])]
        masking = design_info.get("maskingInfo", {}).get("masking", "")
        allocation = design_info.get("allocation", "")
        intr_model = design_info.get("interventionModel", "")
        enroll = core.get("enrollmentCount")

        if masking:
            masking_freq[masking] = masking_freq.get(masking, 0) + 1
        if allocation:
            allocation_freq[allocation] = allocation_freq.get(allocation, 0) + 1
        if intr_model:
            intervention_model_freq[intr_model] = intervention_model_freq.get(intr_model, 0) + 1
        if enroll and enroll > 0:
            enrollment_values.append(enroll)

        for ep in primary:
            if ep:
                primary_endpoint_freq[ep] = primary_endpoint_freq.get(ep, 0) + 1
                for word in ep.lower().split():
                    if len(word) > 4 and word not in {
                        "change", "from", "baseline", "weeks", "months", "rates",
                        "score", "based", "using", "after", "between", "least",
                        "least", "three", "total", "study", "which"
                    }:
                        endpoint_keywords[word] = endpoint_keywords.get(word, 0) + 1

        strategies.append({
            "nctId": core.get("nctId"),
            "title": core.get("title", "")[:100],
            "phase": core.get("phase"),
            "status": core.get("status"),
            "enrollment": enroll,
            "primaryOutcomes": primary[:3],
            "secondaryOutcomes": secondary[:5],
            "masking": masking,
            "allocation": allocation,
            "interventionModel": intr_model,
        })

    sorted_eps = sorted(primary_endpoint_freq.items(), key=lambda x: x[1], reverse=True)
    sorted_kw = sorted(endpoint_keywords.items(), key=lambda x: x[1], reverse=True)

    enroll_summary = {}
    if enrollment_values:
        import statistics as _stats
        enroll_summary = {
            "median": _stats.median(enrollment_values),
            "mean": round(_stats.mean(enrollment_values), 0),
            "min": min(enrollment_values),
            "max": max(enrollment_values),
            "p25": _percentile(enrollment_values, 25),
            "p75": _percentile(enrollment_values, 75),
            "sampleSize": len(enrollment_values),
        }

    return {
        "condition": condition,
        "totalTrials": len(strategies),
        "strategies": strategies[:limit],
        "topPrimaryEndpoints": [{"endpoint": ep, "count": cnt} for ep, cnt in sorted_eps[:10]],
        "endpointKeywords": [{"keyword": kw, "count": cnt} for kw, cnt in sorted_kw[:15]],
        "maskingDistribution": [{"masking": k, "count": v} for k, v in sorted(masking_freq.items(), key=lambda x: x[1], reverse=True)],
        "allocationDistribution": [{"allocation": k, "count": v} for k, v in sorted(allocation_freq.items(), key=lambda x: x[1], reverse=True)],
        "interventionModelDistribution": [{"model": k, "count": v} for k, v in sorted(intervention_model_freq.items(), key=lambda x: x[1], reverse=True)],
        "enrollmentBenchmark": enroll_summary,
    }


# ─────────────────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────────────────

def _merge_with_ctgov(flat: dict, fields: dict, ctgov_core: dict) -> dict:
    """
    For each field, prefer ClinicalTrials.gov data over extracted data
    when extraction confidence is below threshold or value is missing.
    """
    mapping = {
        "title": "title",
        "phase": "phase",
        "primaryOutcomes": "primaryOutcomes",
        "secondaryOutcomes": "secondaryOutcomes",
        "enrollmentCount": "enrollmentCount",
        "eligibilityCriteria": "eligibilityCriteria",
        "sponsorName": "sponsorName",
        "masking": "masking",
        "allocation": "allocation",
        "studyType": "studyType",
        "conditions": "conditions",
        "interventions": "interventions",
    }
    for field_key, ctgov_key in mapping.items():
        extracted_conf = 0.0
        if isinstance(fields.get(field_key), dict):
            extracted_conf = fields[field_key].get("confidence", 0)
        ctgov_val = ctgov_core.get(ctgov_key)
        if ctgov_val and (extracted_conf < CONFIDENCE_THRESHOLD or not flat.get(field_key)):
            flat[field_key] = ctgov_val
    return flat


def _detect_text_sections(text: str, sections: dict) -> None:
    """Simple heading detection for plain text input."""
    from ..services.protocol_extractor import SECTION_HEADING_PATTERNS
    lines = text.split("\n")
    current_key = None
    current_lines: list[str] = []

    for line in lines:
        stripped = line.strip()
        if not stripped:
            continue
        is_heading = (
            len(stripped) < 80
            and (stripped == stripped.upper()
                 or (stripped.endswith(":") and len(stripped) < 60))
        )
        if is_heading:
            matched = None
            for key, patterns in SECTION_HEADING_PATTERNS:
                for pat in patterns:
                    if pat in stripped.lower():
                        matched = key
                        break
                if matched:
                    break
            if matched:
                if current_key and current_lines:
                    # Preserve newlines so list items stay parseable
                    sections[current_key] = "\n".join(current_lines)
                current_key = matched
                current_lines = []
                continue
        if current_key:
            current_lines.append(stripped)

    if current_key and current_lines:
        sections[current_key] = "\n".join(current_lines)


def _format_issue(i) -> dict:
    return {
        "id": i.id, "category": i.category, "severity": i.severity,
        "rule": i.rule, "description": i.description,
        "recommendation": i.recommendation,
        "section": i.section, "reference": i.reference,
    }


def _percentile(data: list, p: int) -> float:
    s = sorted(data)
    n = len(s)
    idx = (p / 100) * (n - 1)
    lo = int(idx)
    hi = min(lo + 1, n - 1)
    return round(s[lo] + (idx - lo) * (s[hi] - s[lo]), 0)
