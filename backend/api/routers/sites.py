from fastapi import APIRouter, Query, HTTPException
from ..services import ctgov
import statistics

router = APIRouter(prefix="/sites", tags=["sites"])

# Startup time benchmarks (weeks) sourced from Tufts CSDD published data
STARTUP_WEEKS: dict[str, int] = {
    "United States": 12, "United Kingdom": 14, "Germany": 16,
    "France": 18, "Spain": 14, "Italy": 16, "Netherlands": 12,
    "Belgium": 14, "Switzerland": 14, "Austria": 16,
    "India": 10, "China": 20, "Japan": 24, "South Korea": 18,
    "Brazil": 22, "Mexico": 20, "Argentina": 20,
    "Australia": 8, "Canada": 10, "Israel": 12,
    "Poland": 12, "Czech Republic": 12, "Hungary": 14,
    "Russia": 22, "Ukraine": 18,
}
DEFAULT_STARTUP_WEEKS = 16


def _months_between(start: str, end: str) -> float | None:
    """Parse YYYY-MM-DD or YYYY-MM dates and return month delta."""
    if not start or not end:
        return None
    try:
        from datetime import datetime
        s_str = start[:10]
        e_str = end[:10]
        for fmt in ("%Y-%m-%d", "%Y-%m"):
            try:
                s_dt = datetime.strptime(s_str, fmt)
                e_dt = datetime.strptime(e_str, fmt)
                months = (e_dt.year - s_dt.year) * 12 + (e_dt.month - s_dt.month)
                return float(max(1, months))
            except ValueError:
                continue
        return None
    except Exception:
        return None


def _study_enrollment_rate(study: dict) -> float | None:
    """Compute per-site-per-month enrollment rate from a completed study."""
    enroll = study.get("enrollmentCount") or 0
    if enroll <= 0:
        return None
    start = study.get("startDate", "")
    end = study.get("primaryCompletionDate", "") or study.get("completionDate", "")
    months = _months_between(start, end)
    if not months:
        return None
    n_locs = max(1, study.get("locationCount") or 1)
    rate = enroll / months / n_locs
    # Sanity bounds: 0.1 – 15 patients/site/month
    if 0.1 <= rate <= 15.0:
        return round(rate, 3)
    return None


@router.get("/recommend")
async def recommend_sites(
    condition: str = Query(...),
    phase: str | None = Query(default=None),
    countries: str | None = Query(default=None, description="Comma-separated country names"),
    limit: int = Query(default=30, le=100),
):
    phases = [p.strip().upper() for p in phase.split(",")] if phase else None
    country_filter = [c.strip() for c in countries.split(",")] if countries else None

    data = await ctgov.search_studies(
        condition=condition,
        phase=phases,
        status=["RECRUITING", "COMPLETED", "ACTIVE_NOT_RECRUITING"],
        page_size=min(100, limit * 3),
    )
    studies = [ctgov.extract_core(s) for s in data.get("studies", [])]

    # ── Compute per-country enrollment rates from real data ──────────────────
    country_rates: dict[str, list[float]] = {}
    global_rates: list[float] = []
    for study in studies:
        if study.get("status") != "COMPLETED":
            continue
        rate = _study_enrollment_rate(study)
        if rate is None:
            continue
        global_rates.append(rate)
        for country in study.get("countries", []):
            if country:
                country_rates.setdefault(country, []).append(rate)

    global_median_rate = round(statistics.median(global_rates), 2) if global_rates else 2.0

    # ── Build site list with trial tracking ──────────────────────────────────
    all_sites: dict[str, dict] = {}
    studies_processed = 0

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
        if country_filter:
            locations = [loc for loc in locations if loc.get("country", "") in country_filter]

        study_status = study.get("status", "")
        trial_ref = {
            "nctId": study["nctId"],
            "title": study.get("title", "")[:90],
            "status": study_status,
            "phase": "/".join(study.get("phase", [])) if study.get("phase") else "",
            "enrollment": study.get("enrollmentCount"),
        }

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
                    "trials": [],
                }
            site = all_sites[key]
            site["trialCount"] += 1
            if len(site["trials"]) < 8:
                site["trials"].append(trial_ref)
            if study_status in ["RECRUITING", "ACTIVE_NOT_RECRUITING"]:
                site["activeTrials"] += 1
            elif study_status == "COMPLETED":
                site["completedTrials"] += 1

        studies_processed += 1
        if len(all_sites) >= limit * 3:
            break

    # ── Score sites ───────────────────────────────────────────────────────────
    site_list = list(all_sites.values())
    for site in site_list:
        country = site.get("country", "")
        # Enrollment rate: use per-country computed rate from real data, else global median
        cr = country_rates.get(country, [])
        enroll_rate = round(statistics.median(cr), 2) if cr else global_median_rate

        startup_wks = STARTUP_WEEKS.get(country, DEFAULT_STARTUP_WEEKS)

        # Score formula: base 50 + experience + activity bonus – startup penalty
        score = 50
        score += min(20, site["trialCount"] * 4)         # up to +20 for experience
        score += site["activeTrials"] * 10                # +10 per active trial (capped below)
        score += site["completedTrials"] * 5              # +5 per completed trial
        score += min(10, enroll_rate * 3)                 # up to +10 for high enrollment rate
        score -= max(0, (startup_wks - 12) // 2)          # penalty for slow startup countries
        score = min(100, max(10, round(score)))

        site["enrollmentRate"] = enroll_rate
        site["startupWeeks"] = startup_wks
        site["score"] = score

    site_list.sort(key=lambda x: (x["score"], x["trialCount"]), reverse=True)

    return {
        "condition": condition,
        "total": len(site_list),
        "sites": site_list[:limit],
        "countrySummary": _summarize_by_country(site_list[:limit]),
        "enrollmentRateSource": "real_data" if global_rates else "fallback",
        "trialsAnalyzed": studies_processed,
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
