from __future__ import annotations
from fastapi import APIRouter, Query, HTTPException
from typing import Optional
from ..services import ctgov, analysis

router = APIRouter(prefix="/trials", tags=["trials"])


@router.get("/search")
async def search_trials(
    q: str = Query(default="", description="General query term"),
    condition: str = Query(default="", description="Medical condition"),
    intervention: str = Query(default="", description="Drug/intervention name"),
    phase: Optional[str] = Query(default=None, description="Comma-separated phases"),
    status: Optional[str] = Query(default=None, description="Comma-separated statuses"),
    page_size: int = Query(default=20, le=100),
    page_token: Optional[str] = Query(default=None),
):
    phases = [p.strip().upper() for p in phase.split(",")] if phase else None
    statuses = [s.strip().upper() for s in status.split(",")] if status else None
    data = await ctgov.search_studies(
        query=q, condition=condition, intervention=intervention,
        phase=phases, status=statuses,
        page_size=page_size, page_token=page_token,
    )
    studies = data.get("studies", [])
    cores = [ctgov.extract_core(s) for s in studies]
    return {
        "total": data.get("totalCount", len(cores)),
        "nextPageToken": data.get("nextPageToken"),
        "studies": cores,
    }


@router.get("/similar")
async def get_similar_trials(
    nct_id: str = Query(..., description="Reference NCT ID"),
    limit: int = Query(default=15, le=50),
):
    study_data = await ctgov.get_study(nct_id)
    base = ctgov.extract_core(study_data)

    conditions = base.get("conditions", [])
    cond_query = conditions[0] if conditions else ""
    phase_list = base.get("phase", [])
    phases = phase_list if phase_list else None

    similar_data = await ctgov.search_studies(
        condition=cond_query,
        phase=phases,
        page_size=min(50, limit * 3),
    )
    similar_studies = [
        ctgov.extract_core(s) for s in similar_data.get("studies", [])
        if ctgov.extract_core(s).get("nctId") != nct_id
    ]

    for s in similar_studies:
        s["similarityScore"] = analysis.compute_trial_similarity(base, s)

    similar_studies.sort(key=lambda x: x.get("similarityScore", 0), reverse=True)
    top = similar_studies[:limit]

    enrollment_stats = analysis.compute_enrollment_stats(similar_studies)
    success_prob = analysis.compute_success_probability(base, similar_studies)

    return {
        "reference": base,
        "similar": top,
        "enrollmentStats": enrollment_stats,
        "successProbability": success_prob,
    }


@router.get("/{nct_id}")
async def get_trial(nct_id: str):
    try:
        data = await ctgov.get_study(nct_id)
    except Exception as e:
        raise HTTPException(status_code=404, detail=f"Trial {nct_id} not found: {str(e)}")
    return ctgov.extract_core(data)


@router.get("/{nct_id}/full")
async def get_trial_full(nct_id: str):
    try:
        data = await ctgov.get_study(nct_id)
    except Exception as e:
        raise HTTPException(status_code=404, detail=str(e))
    return data


@router.get("/{nct_id}/sites")
async def get_trial_sites(nct_id: str):
    try:
        data = await ctgov.get_study(nct_id)
    except Exception as e:
        raise HTTPException(status_code=404, detail=str(e))
    p = data.get("protocolSection", {})
    locations = p.get("contactsLocationsModule", {}).get("locations", [])
    # Enrich locations with trial-level enrollment/date data for rate computation
    status_mod = p.get("statusModule", {})
    design_mod = p.get("designModule", {})
    n_locs = max(1, len(locations))
    for loc in locations:
        if not loc.get("enrollmentCount"):
            enr = design_mod.get("enrollmentInfo", {}).get("count")
            if enr:
                loc["enrollmentCount"] = enr
                loc["locationCount"] = n_locs
        if not loc.get("startDate"):
            loc["startDate"] = status_mod.get("startDateStruct", {}).get("date", "")
        if not loc.get("completionDate"):
            loc["completionDate"] = status_mod.get("completionDateStruct", {}).get("date", "")
    site_perf = analysis.estimate_site_performance(locations)
    return {"nctId": nct_id, "sites": site_perf, "total": len(site_perf)}



@router.get("/stats/global")
async def get_global_stats():
    data = await ctgov.get_study_stats()
    return data
