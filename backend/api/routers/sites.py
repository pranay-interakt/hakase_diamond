from __future__ import annotations
from typing import Optional
from fastapi import APIRouter, Query, HTTPException
from ..services import ctgov, analysis, pytrial_integration

router = APIRouter(prefix="/sites", tags=["sites"])


@router.get("/recommend")
async def recommend_sites(
    condition: str = Query(...),
    phase:Optional[ str ] = Query(default=None),
    countries:Optional[ str ] = Query(default=None, description="Comma-separated country names"),
    limit: int = Query(default=30, le=100),
):
    phases = [p.strip().upper() for p in phase.split(",")] if phase else None
    country_list = [c.strip() for c in countries.split(",")] if countries else None

    data = await ctgov.search_studies(
        condition=condition,
        phase=phases,
        status=["RECRUITING", "COMPLETED", "ACTIVE_NOT_RECRUITING"],
        page_size=min(100, limit * 3),
    )
    studies = [ctgov.extract_core(s) for s in data.get("studies", [])]

    all_sites: dict[str, dict] = {}
    for study in studies:
        full_data = None
        try:
            full_data = await ctgov.get_study(study["nctId"])
        except Exception:
            continue
        locations = (
            full_data.get("protocolSection", {})
            .get("contactsLocationsModule", {})
            .get("locations", [])
        )
        if country_list:
            locations = [loc for loc in locations if loc.get("country", "") in country_list]

        for loc in locations:
            key = f"{loc.get('facility', '')}|{loc.get('city', '')}|{loc.get('country', '')}"
            if key not in all_sites:
                all_sites[key] = {
                    "facility": loc.get("facility", "Unknown"),
                    "city": loc.get("city", ""),
                    "state": loc.get("state", ""),
                    "country": loc.get("country", ""),
                    "trialCount": 0,
                    "activeTrials": 0,
                    "completedTrials": 0,
                    "status": loc.get("status", ""),
                    # Internal rates extracted for ranking
                    "enrollmentRate": analysis._compute_facility_rate(loc),
                }
            all_sites[key]["trialCount"] += 1
            if loc.get("status") in ["RECRUITING", "ACTIVE_NOT_RECRUITING"]:
                all_sites[key]["activeTrials"] += 1
            elif study.get("status") == "COMPLETED":
                all_sites[key]["completedTrials"] += 1

        if len(all_sites) >= limit * 2:
            break

    site_list = list(all_sites.values())
    # Use PyTrial Integration service
    trial_meta = {"conditions": [condition], "phase": phases}
    primary_loc = country_list[0] if country_list else None
    
    enriched = pytrial_integration.pytrial_ranker.rank_sites(
        trial_data=trial_meta,
        sites=site_list,
        user_location=primary_loc
    )

    enriched.sort(key=lambda x: (x.get("score", 0), x.get("trialCount", 0)), reverse=True)
    return {
        "condition": condition,
        "total": len(enriched),
        "sites": enriched[:limit],
        "countrySummary": _summarize_by_country(enriched[:limit]),
        "methodology": "Priority ranking using simulated PyTrial site selection benchmarks combined with facility experience and regional location relevance."
    }




def _summarize_by_country(sites: list[dict]) -> list[dict]:
    summary: dict[str, dict] = {}
    for site in sites:
        country = site.get("country", "Unknown")
        if country not in summary:
            summary[country] = {"country": country, "siteCount": 0, "avgScore": 0, "totalTrials": 0}
        summary[country]["siteCount"] += 1
        summary[country]["avgScore"] += site.get("score", 0)
        summary[country]["totalTrials"] += site.get("trialCount", 0)

    for v in summary.values():
        if v["siteCount"] > 0:
            v["avgScore"] = round(v["avgScore"] / v["siteCount"], 1)

    return sorted(summary.values(), key=lambda x: x["siteCount"], reverse=True)
