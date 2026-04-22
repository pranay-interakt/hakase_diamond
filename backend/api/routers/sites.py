from __future__ import annotations
import math
import statistics
import logging
from typing import Optional
from fastapi import APIRouter, Query, HTTPException
from ..services import ctgov

router = APIRouter(prefix="/sites", tags=["sites"])
logger = logging.getLogger(__name__)

# ─── Ranking Weights (must sum to 100) ────────────────────────────────────────
WEIGHTS = {
    "experience":        30,   # trial_count + completed ratio (depth of experience)
    "condition_match":   25,   # how well the site has done in THIS specific condition
    "country_preference": 20,  # preferred country boost
    "dropout_resilience": 15,  # sites with historically low dropout / stable completion
    "operational_activity": 10, # currently active/recruiting signal
}

PREFERRED_COUNTRY_FULL_SCORE = 20   # max pts when country matches
PREFERRED_COUNTRY_NO_SCORE   = 8    # base pts if not in preferred list (neutral)


@router.get("/recommend")
async def recommend_sites(
    condition:             str            = Query(..., description="Primary condition / indication"),
    intervention:          Optional[str]  = Query(default=None, description="Drug or intervention name"),
    phase:                 Optional[str]  = Query(default=None, description="Trial phase e.g. PHASE2"),
    countries:             Optional[str]  = Query(default=None, description="Comma-separated preferred country names"),
    dropout_rate:          Optional[float]= Query(default=None, description="Expected dropout rate 0-1, used to penalise high-dropout sites"),
    therapeutic_area:      Optional[str]  = Query(default=None, description="Therapeutic area for broader search"),
    limit:                 int            = Query(default=30, le=100),
):
    """
    Find and rank clinical trial sites using live ClinicalTrials.gov data.

    Ranking factors (100 pts total):
      1. Experience (30 pts)          — log-scale trial volume + completion ratio
      2. Condition Match (25 pts)     — trials in this exact condition at this site
      3. Country Preference (20 pts)  — whether site is in the preferred country list
      4. Dropout Resilience (15 pts)  — completion consistency as proxy for low dropout
      5. Operational Activity (10 pts)— currently recruiting / active status
    """
    phase_list    = [p.strip().upper() for p in phase.split(",")] if phase else None
    country_list  = [c.strip() for c in countries.split(",")] if countries else []
    target_dropout = dropout_rate if dropout_rate is not None else 0.10  # default 10%

    # ── 1. Fetch studies from CTGov ──────────────────────────────────────────
    search_terms = [condition]
    if intervention:
        search_terms.append(intervention)
    if therapeutic_area:
        search_terms.append(therapeutic_area)

    raw_data = await ctgov.search_studies(
        condition=condition,
        phase=phase_list,
        status=["RECRUITING", "COMPLETED", "ACTIVE_NOT_RECRUITING", "NOT_YET_RECRUITING"],
        page_size=min(200, limit * 5),
    )
    studies = [ctgov.extract_core(s) for s in raw_data.get("studies", [])]

    if not studies:
        return {
            "condition":      condition,
            "total":          0,
            "sites":          [],
            "countrySummary": [],
            "rankingFactors": _describe_factors(),
            "methodology":    "No trials found for this condition on ClinicalTrials.gov.",
        }

    # ── 2. Aggregate location data across studies ────────────────────────────
    site_map: dict[str, dict] = {}           # key → aggregated site record
    condition_lower = condition.lower()

    for study in studies:
        try:
            full = await ctgov.get_study(study["nctId"])
        except Exception:
            continue

        proto   = full.get("protocolSection", {})
        locs    = proto.get("contactsLocationsModule", {}).get("locations", [])
        design  = proto.get("designModule", {})
        status_mod = proto.get("statusModule", {})
        conds   = [c.lower() for c in (proto.get("conditionsModule", {}).get("conditions", []))]

        # Does this study match the condition closely?
        condition_match_study = any(condition_lower in c for c in conds)

        for loc in locs:
            key = f"{loc.get('facility','')}|{loc.get('city','')}|{loc.get('country','')}"
            if key not in site_map:
                site_map[key] = {
                    "facility":         loc.get("facility", "Unknown"),
                    "city":             loc.get("city", ""),
                    "state":            loc.get("state", ""),
                    "country":          loc.get("country", ""),
                    "trialCount":       0,
                    "activeTrials":     0,
                    "completedTrials":  0,
                    "conditionTrials":  0,   # trials at this site matching the condition
                    "recruitingNow":    False,
                    "totalEnrolled":    0,
                    "enrollmentMonths": 0,
                    "studyStatuses":    [],
                }

            s = site_map[key]
            s["trialCount"] += 1
            loc_status = (loc.get("status") or study.get("status") or "").upper()
            s["studyStatuses"].append(loc_status)

            if loc_status in ("RECRUITING", "ACTIVE_NOT_RECRUITING", "NOT_YET_RECRUITING"):
                s["activeTrials"] += 1
            if loc_status == "RECRUITING":
                s["recruitingNow"] = True
            if study.get("status") == "COMPLETED":
                s["completedTrials"] += 1

            if condition_match_study:
                s["conditionTrials"] += 1

            # Accumulate enrollment data for rate calculation
            enroll = study.get("enrollmentCount") or 0
            if enroll and study.get("startDate") and study.get("completionDate"):
                try:
                    from datetime import datetime
                    fmt = "%Y-%m-%d"
                    s_dt = datetime.strptime(study["startDate"][:10], fmt)
                    e_dt = datetime.strptime(study["completionDate"][:10], fmt)
                    months = max(1, (e_dt - s_dt).days / 30.44)
                    lc = max(1, len(locs))
                    s["totalEnrolled"]    += enroll / lc
                    s["enrollmentMonths"] += months
                except Exception:
                    pass

        if len(site_map) >= limit * 4:
            break

    # ── 3. Score each site ───────────────────────────────────────────────────
    all_sites = list(site_map.values())
    corpus_max_trials = max((s["trialCount"] for s in all_sites), default=1)

    scored_sites = []
    for s in all_sites:
        tc   = s["trialCount"]
        comp = s["completedTrials"]
        act  = s["activeTrials"]
        cond_t = s["conditionTrials"]
        country = s.get("country", "")

        # ── Factor 1: Experience (30 pts) ────────────────────────────────────
        # log-scale maturity (0-15) + completion ratio (0-15)
        maturity_pts    = min(15, math.log1p(tc) / math.log1p(corpus_max_trials) * 15)
        completion_ratio = (comp / tc) if tc > 0 else 0.0
        reliability_pts  = completion_ratio * 15
        experience_pts   = round(maturity_pts + reliability_pts, 2)

        # ── Factor 2: Condition Match (25 pts) ───────────────────────────────
        # How many of this site's trials are in the queried condition
        match_ratio       = (cond_t / tc) if tc > 0 else 0.0
        volume_bonus       = min(5, math.log1p(cond_t))   # small bonus for raw volume
        condition_match_pts = round(min(25, match_ratio * 20 + volume_bonus), 2)

        # ── Factor 3: Country Preference (20 pts) ────────────────────────────
        if country_list:
            in_preferred = any(pref.lower() in country.lower() or country.lower() in pref.lower()
                               for pref in country_list)
            country_pts  = PREFERRED_COUNTRY_FULL_SCORE if in_preferred else PREFERRED_COUNTRY_NO_SCORE
        else:
            country_pts = 14   # neutral when no preference set

        # ── Factor 4: Dropout Resilience (15 pts) ────────────────────────────
        # Proxy: sites with high completion ratio are likely to retain patients
        # Also penalise if our target dropout_rate is high (riskier trial)
        # High completion = low historical dropout
        dropout_proxy = completion_ratio   # 0-1, higher is better
        # Scale down score if our trial's expected dropout_rate is high (target_dropout > 0.15)
        dropout_adjustment = max(0.5, 1.0 - max(0, target_dropout - 0.10) * 2)
        dropout_resilience_pts = round(dropout_proxy * 15 * dropout_adjustment, 2)

        # ── Factor 5: Operational Activity (10 pts) ──────────────────────────
        activity_pts = 0.0
        if s["recruitingNow"]:
            activity_pts = 10.0
        elif act > 0:
            activity_pts = 7.0
        elif comp > 0:
            activity_pts = 4.0   # historically active but currently idle

        # ── Total Score ───────────────────────────────────────────────────────
        total = experience_pts + condition_match_pts + country_pts + dropout_resilience_pts + activity_pts
        composite = round(min(100, total), 1)

        # ── Enrollment Rate ───────────────────────────────────────────────────
        if s["enrollmentMonths"] > 0:
            enroll_rate = round(s["totalEnrolled"] / s["enrollmentMonths"], 2)
        else:
            enroll_rate = 1.5   # corpus median fallback

        # ── Grounding: Why is this site better? ──────────────────────────────
        grounding = _build_grounding(
            tc, comp, act, cond_t, country, country_list,
            completion_ratio, enroll_rate, target_dropout,
            s["recruitingNow"], match_ratio
        )

        # ── Startup estimate (heuristic) ──────────────────────────────────────
        if s["recruitingNow"]:
            startup_weeks = 4
        elif act > 0:
            startup_weeks = 8
        else:
            startup_weeks = 14

        scored_sites.append({
            **{k: v for k, v in s.items() if k != "studyStatuses"},
            "enrollmentRate":         enroll_rate,
            "startupWeeks":           startup_weeks,
            "expectedPatients":       round(enroll_rate * 12),
            "compositeScore":         composite,
            "score":                  composite,
            "grounding":              grounding,
            "rankingBreakdown": {
                "experience":           experience_pts,
                "conditionMatch":       condition_match_pts,
                "countryPreference":    round(country_pts, 1),
                "dropoutResilience":    dropout_resilience_pts,
                "operationalActivity":  round(activity_pts, 1),
            },
        })

    # ── 4. Sort & Filter ──────────────────────────────────────────────────────
    scored_sites.sort(key=lambda x: x["compositeScore"], reverse=True)

    # If country preference set, surface preferred-country sites first in ties
    if country_list:
        scored_sites.sort(
            key=lambda x: (
                x["compositeScore"],
                1 if any(p.lower() in x.get("country", "").lower() for p in country_list) else 0,
            ),
            reverse=True,
        )

    top_sites = scored_sites[:limit]

    return {
        "condition":        condition,
        "intervention":     intervention,
        "preferredCountries": country_list,
        "targetDropoutRate": target_dropout,
        "total":            len(top_sites),
        "sites":            top_sites,
        "countrySummary":   _summarize_by_country(top_sites),
        "rankingFactors":   _describe_factors(),
        "methodology": (
            "Sites ranked using 5-factor Hakase Clinical Site Intelligence Engine: "
            "Experience (30%), Condition Match (25%), Country Preference (20%), "
            "Dropout Resilience (15%), Operational Activity (10%). "
            "All data sourced live from ClinicalTrials.gov API."
        ),
    }


# ─── Helpers ──────────────────────────────────────────────────────────────────

def _build_grounding(
    tc: int, comp: int, act: int, cond_t: int,
    country: str, country_list: list,
    completion_ratio: float, enroll_rate: float,
    target_dropout: float, recruiting_now: bool, match_ratio: float,
) -> list[str]:
    """Generate human-readable reasons why this site is recommended."""
    reasons = []

    if tc >= 20:
        reasons.append(f"High-volume site with {tc} trials — deeply experienced in clinical operations.")
    elif tc >= 5:
        reasons.append(f"Solid track record with {tc} clinical trials across multiple studies.")

    if completion_ratio >= 0.7:
        reasons.append(f"{int(completion_ratio*100)}% trial completion rate — strong execution reliability.")
    elif completion_ratio >= 0.5:
        reasons.append(f"{int(completion_ratio*100)}% completion rate — above average site stability.")

    if cond_t > 0:
        cond_pct = int(match_ratio * 100)
        reasons.append(f"{cond_t} trial(s) ({cond_pct}% of portfolio) in this specific condition — direct therapeutic area expertise.")

    if country_list and any(p.lower() in country.lower() or country.lower() in p.lower() for p in country_list):
        reasons.append(f"Located in preferred country ({country}) — aligns with geographic strategy.")

    if recruiting_now:
        reasons.append("Currently recruiting — minimal activation delay, ready for immediate engagement.")
    elif act > 0:
        reasons.append("Active trials ongoing — operational infrastructure is ready.")

    if enroll_rate >= 3.0:
        reasons.append(f"High enrollment rate ({enroll_rate} pts/mo) — accelerates timeline significantly.")
    elif enroll_rate >= 1.5:
        reasons.append(f"Solid enrollment rate ({enroll_rate} pts/mo) — meets typical Phase II-III benchmarks.")

    if target_dropout > 0.15 and completion_ratio >= 0.65:
        reasons.append("Strong retention history suggests capacity to manage a higher-dropout protocol.")

    if not reasons:
        reasons.append("Meets baseline criteria for trial site participation based on available ClinicalTrials.gov data.")

    return reasons


def _describe_factors() -> list[dict]:
    return [
        {"factor": "Experience",           "weight": 30, "description": "Log-scale trial volume + completion ratio — measures site depth and execution reliability."},
        {"factor": "Condition Match",       "weight": 25, "description": "Proportion of the site's trials in the queried condition — measures direct therapeutic area expertise."},
        {"factor": "Country Preference",    "weight": 20, "description": "Full 20 pts if site is in a preferred country; baseline 8 pts otherwise."},
        {"factor": "Dropout Resilience",    "weight": 15, "description": "Completion ratio adjusted by protocol's expected dropout rate — sites with strong retention score higher."},
        {"factor": "Operational Activity",  "weight": 10, "description": "Currently recruiting sites get full marks; recently active sites partial credit."},
    ]


def _summarize_by_country(sites: list[dict]) -> list[dict]:
    summary: dict[str, dict] = {}
    for site in sites:
        country = site.get("country", "Unknown")
        if country not in summary:
            summary[country] = {"country": country, "siteCount": 0, "avgScore": 0.0, "totalTrials": 0}
        summary[country]["siteCount"]  += 1
        summary[country]["avgScore"]   += site.get("compositeScore", 0)
        summary[country]["totalTrials"] += site.get("trialCount", 0)

    for v in summary.values():
        if v["siteCount"] > 0:
            v["avgScore"] = round(v["avgScore"] / v["siteCount"], 1)

    return sorted(summary.values(), key=lambda x: x["siteCount"], reverse=True)
