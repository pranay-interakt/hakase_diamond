from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import Optional
from ..services import ctgov, analysis
import math

router = APIRouter(prefix="/simulation", tags=["simulation"])


class EnrollmentSimInput(BaseModel):
    targetEnrollment: int
    nSites: int
    monthlyRatePerSite: Optional[float] = None
    dropoutRate: float = 0.05
    nSimulations: int = 1000
    referenceNctId: Optional[str] = None
    condition: Optional[str] = None


@router.post("/enrollment")
async def simulate_enrollment(body: EnrollmentSimInput):
    if body.targetEnrollment <= 0:
        raise HTTPException(status_code=400, detail="targetEnrollment must be > 0")
    if body.nSites <= 0:
        raise HTTPException(status_code=400, detail="nSites must be > 0")

    monthly_rate = body.monthlyRatePerSite

    if monthly_rate is None:
        if body.referenceNctId:
            try:
                study_data = await ctgov.get_study(body.referenceNctId)
                core = ctgov.extract_core(study_data)
                conditions = core.get("conditions", [])
                phase = core.get("phase", [])
            except Exception:
                conditions = [body.condition] if body.condition else []
                phase = []
        elif body.condition:
            conditions = [body.condition]
            phase = []
        else:
            conditions = []
            phase = []

        if conditions:
            sim_data = await ctgov.search_studies(
                condition=conditions[0], phase=phase or None,
                status=["COMPLETED"], page_size=30,
            )
            similar = [ctgov.extract_core(s) for s in sim_data.get("studies", [])]
            rates = []
            for s in similar:
                enroll = s.get("enrollmentCount") or 0
                locs = s.get("locationCount") or 1
                start = s.get("startDate", "")
                end = s.get("completionDate", "")
                if enroll > 0 and start and end:
                    try:
                        from datetime import datetime
                        fmt = "%Y-%m-%d"
                        s_dt = datetime.strptime(start[:10], fmt)
                        e_dt = datetime.strptime(end[:10], fmt)
                        months = max(1, (e_dt - s_dt).days / 30.44)
                        rate = enroll / months / max(1, locs)
                        if 0.05 < rate < 10:
                            rates.append(rate)
                    except Exception:
                        pass

            if rates:
                import statistics
                monthly_rate = round(statistics.median(rates), 2)
            else:
                monthly_rate = 1.5
        else:
            monthly_rate = 1.5

    result = analysis.monte_carlo_enrollment(
        target=body.targetEnrollment,
        n_sites=body.nSites,
        monthly_rate_per_site=monthly_rate,
        dropout_rate=body.dropoutRate,
        n_simulations=min(body.nSimulations, 2000),
    )
    result["monthlyRateUsed"] = monthly_rate
    result["targetEnrollment"] = body.targetEnrollment
    result["nSites"] = body.nSites
    result["dropoutRate"] = body.dropoutRate

    result["scenarios"] = {
        "optimistic": {
            "rate": round(monthly_rate * 1.3, 2),
            "months": max(1, round(body.targetEnrollment / (body.nSites * monthly_rate * 1.3), 1)),
        },
        "base": {
            "rate": monthly_rate,
            "months": max(1, round(body.targetEnrollment / (body.nSites * monthly_rate), 1)),
        },
        "conservative": {
            "rate": round(monthly_rate * 0.7, 2),
            "months": max(1, round(body.targetEnrollment / (body.nSites * monthly_rate * 0.7), 1)),
        },
    }

    return result


class ProtocolAmendmentInput(BaseModel):
    originalProtocol: dict
    amendments: list[dict]


@router.post("/protocol-impact")
async def simulate_protocol_impact(body: ProtocolAmendmentInput):
    from ..services.compliance_rules import check_protocol_compliance, calculate_compliance_score

    original_issues = check_protocol_compliance(body.originalProtocol)
    original_score = calculate_compliance_score(original_issues)

    amended = {**body.originalProtocol}
    for amendment in body.amendments:
        field = amendment.get("field", "")
        value = amendment.get("value")
        if field and value is not None:
            amended[field] = value

    amended_issues = check_protocol_compliance(amended)
    amended_score = calculate_compliance_score(amended_issues)

    resolved = [i for i in original_issues if i.id not in {x.id for x in amended_issues}]
    new_issues = [i for i in amended_issues if i.id not in {x.id for x in original_issues}]

    enrollment_impact = _estimate_enrollment_impact(body.originalProtocol, amended)

    return {
        "original": {
            "score": original_score,
            "issueCount": len(original_issues),
        },
        "amended": {
            "score": amended_score,
            "issueCount": len(amended_issues),
        },
        "delta": {
            "scoreChange": round(amended_score["score"] - original_score["score"], 1),
            "resolvedIssues": [{"id": i.id, "rule": i.rule, "severity": i.severity} for i in resolved],
            "newIssues": [{"id": i.id, "rule": i.rule, "severity": i.severity} for i in new_issues],
        },
        "enrollmentImpact": enrollment_impact,
        "amendedIssues": [
            {
                "id": i.id, "category": i.category, "severity": i.severity,
                "rule": i.rule, "description": i.description,
                "recommendation": i.recommendation, "section": i.section,
                "reference": i.reference,
            }
            for i in amended_issues
        ],
    }


def _estimate_enrollment_impact(original: dict, amended: dict) -> dict:
    factors = []
    impact_score = 0.0

    orig_enroll = original.get("enrollmentCount") or 0
    new_enroll = amended.get("enrollmentCount") or 0
    if new_enroll and orig_enroll and new_enroll != orig_enroll:
        change = ((new_enroll - orig_enroll) / orig_enroll) * 100
        factors.append({
            "factor": "Target enrollment changed",
            "impact": round(change, 1),
            "description": f"Enrollment target {'increased' if change > 0 else 'decreased'} by {abs(round(change, 1))}%",
        })
        impact_score += change

    orig_elig = original.get("eligibilityCriteria", "")
    new_elig = amended.get("eligibilityCriteria", "")
    if orig_elig and new_elig and orig_elig != new_elig:
        orig_words = set(orig_elig.lower().split())
        new_words = set(new_elig.lower().split())
        added = new_words - orig_words
        removed = orig_words - new_words
        restriction_words = {"must", "required", "exclude", "prohibited", "not", "contraindicated"}
        new_restrictions = len(added & restriction_words)
        removed_restrictions = len(removed & restriction_words)
        if new_restrictions > removed_restrictions:
            factors.append({
                "factor": "Eligibility criteria tightened",
                "impact": -10.0,
                "description": "More restrictive eligibility may reduce eligible patient pool by ~10-25%",
            })
            impact_score -= 10
        elif removed_restrictions > new_restrictions:
            factors.append({
                "factor": "Eligibility criteria relaxed",
                "impact": 15.0,
                "description": "Less restrictive eligibility may expand eligible patient pool by ~10-20%",
            })
            impact_score += 15

    orig_countries = set(original.get("countries", []))
    new_countries = set(amended.get("countries", []))
    added_countries = new_countries - orig_countries
    removed_countries = orig_countries - new_countries
    if added_countries:
        factors.append({
            "factor": f"Added {len(added_countries)} country/countries",
            "impact": len(added_countries) * 5.0,
            "description": f"Expanding to {', '.join(list(added_countries)[:3])} could increase enrollment by ~{len(added_countries) * 5}%",
        })
        impact_score += len(added_countries) * 5
    if removed_countries:
        factors.append({
            "factor": f"Removed {len(removed_countries)} country/countries",
            "impact": -len(removed_countries) * 5.0,
            "description": f"Removing sites in {', '.join(list(removed_countries)[:3])} may slow enrollment",
        })
        impact_score -= len(removed_countries) * 5

    return {
        "estimatedImpact": round(impact_score, 1),
        "direction": "positive" if impact_score > 0 else "negative" if impact_score < 0 else "neutral",
        "factors": factors,
    }
