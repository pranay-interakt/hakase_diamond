from fastapi import APIRouter, Query, HTTPException
from ..services import ctgov, analysis

router = APIRouter(prefix="/sites", tags=["sites"])


@router.get("/recommend")
async def recommend_sites(
    condition: str = Query(...),
    phase: str | None = Query(default=None),
    countries: str | None = Query(default=None, description="Comma-separated country names"),
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
                }
            all_sites[key]["trialCount"] += 1
            if loc.get("status") in ["RECRUITING", "ACTIVE_NOT_RECRUITING"]:
                all_sites[key]["activeTrials"] += 1
            elif study.get("status") == "COMPLETED":
                all_sites[key]["completedTrials"] += 1

        if len(all_sites) >= limit * 2:
            break

    site_list = list(all_sites.values())
    perf = analysis.estimate_site_performance([
        {"facility": s["facility"], "city": s["city"], "country": s["country"], "status": s["status"]}
        for s in site_list
    ])

    for i, site in enumerate(site_list):
        perf_data = perf[i] if i < len(perf) else {}
        site["score"] = perf_data.get("score", 50)
        site["enrollmentRate"] = perf_data.get("enrollmentRate", 1.5)
        site["startupWeeks"] = perf_data.get("startupWeeks", 14)

    site_list.sort(key=lambda x: (x.get("score", 0), x.get("trialCount", 0)), reverse=True)
    return {
        "condition": condition,
        "total": len(site_list),
        "sites": site_list[:limit],
        "countrySummary": _summarize_by_country(site_list[:limit]),
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
