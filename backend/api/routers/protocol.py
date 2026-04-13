from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Query
from pydantic import BaseModel
from typing import Optional
from ..services.compliance_rules import check_protocol_compliance, calculate_compliance_score
from ..services import ctgov, analysis
import io
import re

router = APIRouter(prefix="/protocol", tags=["protocol"])


def extract_text_from_pdf(content: bytes) -> str:
    try:
        import fitz
        doc = fitz.open(stream=content, filetype="pdf")
        text = "\n".join(page.get_text("text") for page in doc)
        doc.close()
        text = re.sub(r'\s+', ' ', text)
        return text.strip()
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Could not parse PDF: {str(e)}")


def parse_protocol_text(text: str) -> dict:
    text_lower = text.lower()

    phase_patterns = {
        "PHASE1": r"phase\s+1\b|phase\s+i\b",
        "PHASE2": r"phase\s+2\b|phase\s+ii\b",
        "PHASE3": r"phase\s+3\b|phase\s+iii\b",
        "PHASE4": r"phase\s+4\b|phase\s+iv\b",
    }
    phases = []
    for ph, pat in phase_patterns.items():
        if re.search(pat, text_lower):
            phases.append(ph)

    primary_match = re.search(
        r"primary\s+(endpoint|objective|outcome)[s]?\s*[:\-]?\s*([^\n]{20,200})",
        text, re.IGNORECASE
    )
    primary_outcomes = [primary_match.group(2).strip()] if primary_match else []

    secondary_matches = re.findall(
        r"secondary\s+(endpoint|objective|outcome)[s]?\s*[:\-]?\s*([^\n]{20,200})",
        text, re.IGNORECASE
    )
    secondary_outcomes = [m[1].strip() for m in secondary_matches[:5]]

    enrollment_match = re.search(
        r"(?:approximately|total|enroll|sample)\s+(\d{2,5})\s*(?:patients|subjects|participants|volunteers)",
        text_lower
    )
    enrollment = int(enrollment_match.group(1)) if enrollment_match else None

    elig_match = re.search(
        r"(?:inclusion|eligibility)\s*criteria[:\-]?\s*((?:(?!exclusion|protocol|study design).){50,2000})",
        text, re.IGNORECASE | re.DOTALL
    )
    eligibility = re.sub(r'\s+', ' ', elig_match.group(1)).strip()[:1000] if elig_match else ""

    sponsor_match = re.search(r"(?:sponsor|applicant|company)[:\s]+([A-Z][^\n]{5,60})", text)
    sponsor = sponsor_match.group(1).strip() if sponsor_match else ""

    masking = ""
    if re.search(r"double[- ]blind|double[- ]masked", text_lower):
        masking = "DOUBLE"
    elif re.search(r"single[- ]blind|single[- ]masked", text_lower):
        masking = "SINGLE"
    elif re.search(r"open[- ]label|unblinded", text_lower):
        masking = "NONE"

    allocation = ""
    if re.search(r"\brandom(?:ized|ised|ization)\b", text_lower):
        allocation = "RANDOMIZED"
    elif re.search(r"\bnon-random|\bobservational\b", text_lower):
        allocation = "NON_RANDOMIZED"

    study_type = "INTERVENTIONAL"
    if re.search(r"\bobservational\b|\bcohort\b|\bregistr\b", text_lower):
        study_type = "OBSERVATIONAL"

    conditions = []
    condition_patterns = [
        r"indication[:\s]+([A-Z][^\n]{5,60})",
        r"disease[:\s]+([A-Z][^\n]{5,60})",
        r"condition[:\s]+([A-Z][^\n]{5,60})",
    ]
    for pat in condition_patterns:
        m = re.search(pat, text, re.IGNORECASE)
        if m:
            conditions.append(m.group(1).strip())

    interventions = []
    drug_matches = re.findall(r"(?:drug|investigational product|IMP|treatment)[:\s]+([A-Z][^\n,]{5,60})", text)
    for dm in drug_matches[:3]:
        interventions.append({"name": dm.strip(), "type": "DRUG"})

    title_match = re.search(r"(?:title|protocol title)[:\s]+([^\n]{20,200})", text, re.IGNORECASE)
    title = title_match.group(1).strip() if title_match else text[:100].strip()

    return {
        "title": title,
        "phase": phases,
        "primaryOutcomes": primary_outcomes,
        "secondaryOutcomes": secondary_outcomes,
        "enrollmentCount": enrollment,
        "eligibilityCriteria": eligibility,
        "sponsorName": sponsor,
        "masking": masking,
        "allocation": allocation,
        "studyType": study_type,
        "conditions": conditions,
        "interventions": interventions,
        "rawTextLength": len(text),
    }


@router.post("/analyze-upload")
async def analyze_protocol_upload(file: UploadFile = File(...)):
    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are accepted")

    content = await file.read()
    if len(content) > 50 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File too large (max 50 MB)")

    text = extract_text_from_pdf(content)
    parsed = parse_protocol_text(text)

    issues = check_protocol_compliance(parsed)
    score = calculate_compliance_score(issues)

    search_condition = parsed.get("conditions", [""])[0] if parsed.get("conditions") else ""
    similar_data = {"studies": []}
    if search_condition:
        try:
            similar_data = await ctgov.search_studies(
                condition=search_condition,
                phase=parsed.get("phase") or None,
                page_size=20,
            )
        except Exception:
            pass

    similar_studies = [ctgov.extract_core(s) for s in similar_data.get("studies", [])]
    success_prob = analysis.compute_success_probability(parsed, similar_studies)
    enroll_stats = analysis.compute_enrollment_stats(similar_studies)

    return {
        "parsed": parsed,
        "compliance": {
            "score": score,
            "issues": [
                {
                    "id": i.id, "category": i.category, "severity": i.severity,
                    "rule": i.rule, "description": i.description,
                    "recommendation": i.recommendation,
                    "section": i.section, "reference": i.reference,
                }
                for i in issues
            ],
        },
        "successProbability": success_prob,
        "enrollmentBenchmark": enroll_stats,
        "similarTrials": similar_studies[:10],
    }


@router.get("/strategies")
async def get_outcome_strategies(
    condition: str = Query(...),
    phase: str | None = Query(default=None),
    limit: int = Query(default=30, le=50),
):
    """
    Returns real outcome strategies used in similar ClinicalTrials.gov trials:
    primary endpoints, masking/allocation patterns, enrollment benchmarks.
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

    for raw in studies:
        core = ctgov.extract_core(raw)
        proto = raw.get("protocolSection", {})
        outcomes_mod = proto.get("outcomesModule", {})
        design_mod = proto.get("designModule", {})

        primary = [o.get("measure", "") for o in outcomes_mod.get("primaryOutcomes", [])]
        secondary = [o.get("measure", "") for o in outcomes_mod.get("secondaryOutcomes", [])]

        masking = design_mod.get("designInfo", {}).get("maskingInfo", {}).get("masking", "")
        allocation = design_mod.get("designInfo", {}).get("allocation", "")

        if masking:
            masking_freq[masking] = masking_freq.get(masking, 0) + 1
        if allocation:
            allocation_freq[allocation] = allocation_freq.get(allocation, 0) + 1

        for ep in primary:
            if ep:
                primary_endpoint_freq[ep] = primary_endpoint_freq.get(ep, 0) + 1
                for word in ep.lower().split():
                    if len(word) > 4:
                        endpoint_keywords[word] = endpoint_keywords.get(word, 0) + 1

        strategies.append({
            "nctId": core.get("nctId"),
            "title": core.get("title", "")[:100],
            "phase": core.get("phase"),
            "status": core.get("status"),
            "enrollment": core.get("enrollmentCount"),
            "primaryOutcomes": primary[:3],
            "secondaryOutcomes": secondary[:5],
            "masking": masking,
            "allocation": allocation,
        })

    sorted_eps = sorted(primary_endpoint_freq.items(), key=lambda x: x[1], reverse=True)
    sorted_kw = sorted(endpoint_keywords.items(), key=lambda x: x[1], reverse=True)
    STOP_WORDS = {"change", "from", "baseline", "week", "months", "rate", "score", "based", "using", "with", "after"}
    filtered_kw = [(kw, cnt) for kw, cnt in sorted_kw if kw not in STOP_WORDS]

    return {
        "condition": condition,
        "totalTrials": len(strategies),
        "strategies": strategies[:limit],
        "topPrimaryEndpoints": [{"endpoint": ep, "count": cnt} for ep, cnt in sorted_eps[:10]],
        "endpointKeywords": [{"keyword": kw, "count": cnt} for kw, cnt in filtered_kw[:15]],
        "maskingDistribution": [{"masking": k, "count": v} for k, v in sorted(masking_freq.items(), key=lambda x: x[1], reverse=True)],
        "allocationDistribution": [{"allocation": k, "count": v} for k, v in sorted(allocation_freq.items(), key=lambda x: x[1], reverse=True)],
    }


class ProtocolTextInput(BaseModel):
    text: str
    condition: Optional[str] = None
    phase: Optional[list[str]] = None


@router.post("/analyze-text")
async def analyze_protocol_text(body: ProtocolTextInput):
    parsed = parse_protocol_text(body.text)
    if body.condition:
        parsed["conditions"] = [body.condition]
    if body.phase:
        parsed["phase"] = body.phase

    issues = check_protocol_compliance(parsed)
    score = calculate_compliance_score(issues)

    search_condition = (body.condition or (parsed.get("conditions") or [""])[0])
    similar_data = {"studies": []}
    if search_condition:
        try:
            similar_data = await ctgov.search_studies(
                condition=search_condition,
                phase=parsed.get("phase") or None,
                page_size=20,
            )
        except Exception:
            pass

    similar_studies = [ctgov.extract_core(s) for s in similar_data.get("studies", [])]
    success_prob = analysis.compute_success_probability(parsed, similar_studies)

    return {
        "parsed": parsed,
        "compliance": {
            "score": score,
            "issues": [
                {
                    "id": i.id, "category": i.category, "severity": i.severity,
                    "rule": i.rule, "description": i.description,
                    "recommendation": i.recommendation,
                    "section": i.section, "reference": i.reference,
                }
                for i in issues
            ],
        },
        "successProbability": success_prob,
        "similarTrials": similar_studies[:10],
    }
