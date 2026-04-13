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
    perf = analysis.estimate_site_performance(site_list)   # pass full dicts — includes trialCount/activeTrials/completedTrials

    # estimate_site_performance returns sorted list; build a lookup by key
    perf_map = {f"{p['facility']}|{p['city']}|{p['country']}": p for p in perf}

    enriched = []
    for site in site_list:
        key = f"{site['facility']}|{site['city']}|{site['country']}"
        p = perf_map.get(key, {})
        enriched.append({**site, **{
            "score": p.get("score", 0),
            "enrollmentRate": p.get("enrollmentRate", None),
            "rateSource": p.get("rateSource", "unknown"),
        }})

    enriched.sort(key=lambda x: (x.get("score", 0), x.get("trialCount", 0)), reverse=True)
    return {
        "condition": condition,
        "total": len(enriched),
        "sites": enriched[:limit],
        "countrySummary": _summarize_by_country(enriched[:limit]),
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
