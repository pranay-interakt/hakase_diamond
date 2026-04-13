from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from ..services.compliance_rules import check_protocol_compliance, calculate_compliance_score
from ..services import ctgov

router = APIRouter(prefix="/compliance", tags=["compliance"])


class ProtocolInput(BaseModel):
    title: Optional[str] = ""
    phase: Optional[list[str]] = []
    primaryOutcomes: Optional[list[str]] = []
    secondaryOutcomes: Optional[list[str]] = []
    eligibilityCriteria: Optional[str] = ""
    enrollmentCount: Optional[int] = None
    interventionModel: Optional[str] = ""
    masking: Optional[str] = ""
    allocation: Optional[str] = ""
    startDate: Optional[str] = ""
    completionDate: Optional[str] = ""
    sponsorName: Optional[str] = ""
    sponsorClass: Optional[str] = ""
    studyType: Optional[str] = ""
    countries: Optional[list[str]] = []
    interventions: Optional[list[dict]] = []


@router.post("/check")
async def check_compliance(protocol: ProtocolInput):
    data = protocol.model_dump()
    issues = check_protocol_compliance(data)
    score = calculate_compliance_score(issues)
    return {
        "score": score,
        "issues": [
            {
                "id": i.id,
                "category": i.category,
                "severity": i.severity,
                "rule": i.rule,
                "description": i.description,
                "recommendation": i.recommendation,
                "section": i.section,
                "reference": i.reference,
            }
            for i in issues
        ],
    }


@router.get("/check/{nct_id}")
async def check_trial_compliance(nct_id: str):
    try:
        study_data = await ctgov.get_study(nct_id)
    except Exception as e:
        raise HTTPException(status_code=404, detail=str(e))

    core = ctgov.extract_core(study_data)
    issues = check_protocol_compliance(core)
    score = calculate_compliance_score(issues)

    return {
        "nctId": nct_id,
        "trialTitle": core.get("title", ""),
        "score": score,
        "issues": [
            {
                "id": i.id,
                "category": i.category,
                "severity": i.severity,
                "rule": i.rule,
                "description": i.description,
                "recommendation": i.recommendation,
                "section": i.section,
                "reference": i.reference,
            }
            for i in issues
        ],
    }


@router.get("/regulations")
async def get_regulations():
    return {
        "regulations": [
            {
                "id": "ICH_E6",
                "name": "ICH E6(R2) — Good Clinical Practice",
                "description": "Provides unified standard for designing, conducting, recording and reporting trials involving human subjects.",
                "url": "https://database.ich.org/sites/default/files/E6_R2__Guideline.pdf",
                "applicability": "All interventional trials",
            },
            {
                "id": "ICH_E8",
                "name": "ICH E8(R1) — General Considerations for Clinical Studies",
                "description": "Framework for the design and conduct of clinical studies that supports the generation of reliable information on quality, safety and efficacy of medicinal products.",
                "url": "https://database.ich.org/sites/default/files/E8-R1_Step4_Guideline_2021_1005.pdf",
                "applicability": "All clinical studies",
            },
            {
                "id": "ICH_E9",
                "name": "ICH E9(R1) — Statistical Principles for Clinical Trials",
                "description": "Guidance on statistical methods, sample size, and analysis populations for confirmatory trials.",
                "url": "https://database.ich.org/sites/default/files/E9-R1_Step4_Guideline_2019_1203.pdf",
                "applicability": "Phase 2/3 confirmatory trials",
            },
            {
                "id": "FDA_21CFR312",
                "name": "FDA 21 CFR Part 312 — IND Regulations",
                "description": "Requirements for Investigational New Drug Applications and clinical investigator responsibilities.",
                "url": "https://www.ecfr.gov/current/title-21/chapter-I/subchapter-D/part-312",
                "applicability": "US IND-required studies",
            },
            {
                "id": "FDA_21CFR50",
                "name": "FDA 21 CFR Part 50 — Informed Consent",
                "description": "Protection of human subjects. Requirements for obtaining informed consent.",
                "url": "https://www.ecfr.gov/current/title-21/chapter-I/subchapter-A/part-50",
                "applicability": "All US clinical research",
            },
            {
                "id": "CONSORT",
                "name": "CONSORT 2010 — Reporting Guidelines",
                "description": "25-item checklist and flow diagram for transparent reporting of parallel-group RCTs.",
                "url": "http://www.consort-statement.org",
                "applicability": "Randomized controlled trials",
            },
        ]
    }
