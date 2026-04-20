from __future__ import annotations
import httpx
import logging
from datetime import datetime

logger = logging.getLogger(__name__)

FAERS_BASE = "https://api.fda.gov/drug/event.json"
LABEL_BASE = "https://api.fda.gov/drug/label.json"
ENFORCE_BASE = "https://api.fda.gov/drug/enforcement.json"

# ── helpers ────────────────────────────────────────────────────────────────────

def _drug_query(drug: str) -> str:
    """Build an OR query matching generic/brand name in FAERS."""
    d = drug.replace('"', "").strip()
    return (
        f'patient.drug.openfda.generic_name:"{d}"'
        f' OR patient.drug.openfda.brand_name:"{d}"'
        f' OR patient.drug.medicinalproduct:"{d}"'
    )


# ── adverse events ─────────────────────────────────────────────────────────────

async def search_adverse_events(drug: str, limit: int = 25) -> dict:
    """Top adverse event reactions from FAERS for a drug."""
    q = _drug_query(drug)
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            # Count query: get top reactions
            count_resp = await client.get(FAERS_BASE, params={
                "search": q,
                "count": "patient.reaction.reactionmeddrapt.exact",
                "limit": min(limit, 100),
            })
            # Total query: get real number of adverse event reports
            total_resp = await client.get(FAERS_BASE, params={
                "search": q,
                "limit": 1,
            })

            reactions: list[dict] = []
            total = 0

            if count_resp.status_code == 200:
                results = count_resp.json().get("results", [])
                reactions = [
                    {"reaction": r["term"], "count": r["count"]}
                    for r in results[:limit]
                ]

            if total_resp.status_code == 200:
                total = total_resp.json().get("meta", {}).get("results", {}).get("total", 0)
            elif reactions:
                # Fallback: sum top reaction counts as lower bound
                total = sum(r["count"] for r in reactions)

            return {
                "drug": drug,
                "total": total,
                "reactions": reactions,
                "source": "OpenFDA FAERS",
            }
    except Exception as e:
        logger.warning(f"search_adverse_events({drug}): {e}")
    return {"drug": drug, "total": 0, "reactions": [], "source": "OpenFDA FAERS"}


async def get_serious_outcome_counts(drug: str) -> dict:
    """Count deaths, hospitalizations, life-threatening events and disabilities."""
    q = _drug_query(drug)
    outcomes = {
        "death": "seriousnessother:1 AND seriousnessdeath:1",
        "hospitalization": "seriousnesshospitalization:1",
        "life_threatening": "seriousnesslifethreatening:1",
        "disability": "seriousnessdisabling:1",
        "congenital": "seriousnesscongenitalanomali:1",
    }
    result: dict[str, int] = {}
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            for key, outcome_filter in outcomes.items():
                try:
                    r = await client.get(
                        FAERS_BASE,
                        params={"search": f"({q}) AND {outcome_filter}", "limit": 1},
                    )
                    if r.status_code == 200:
                        meta = r.json().get("meta", {}).get("results", {})
                        result[key] = meta.get("total", 0)
                    else:
                        result[key] = 0
                except Exception:
                    result[key] = 0
    except Exception as e:
        logger.warning(f"get_serious_outcome_counts({drug}): {e}")
    return result


# ── drug label ─────────────────────────────────────────────────────────────────

async def get_drug_label(drug: str) -> dict:
    """Fetch FDA drug label (warnings, indications, dosage) from OpenFDA."""
    params = {
        "search": f'openfda.generic_name:"{drug}" OR openfda.brand_name:"{drug}"',
        "limit": 1,
    }
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(LABEL_BASE, params=params)
            if resp.status_code == 200:
                results = resp.json().get("results", [])
                if results:
                    r = results[0]
                    openfda = r.get("openfda", {})
                    return {
                        "drug": drug,
                        "brandName": (openfda.get("brand_name") or [""])[0],
                        "genericName": (openfda.get("generic_name") or [""])[0],
                        "manufacturer": (openfda.get("manufacturer_name") or [""])[0],
                        "route": (openfda.get("route") or [""])[0],
                        "productType": (openfda.get("product_type") or [""])[0],
                        "indications": _first(r, "indications_and_usage"),
                        "warnings": _first(r, "warnings"),
                        "boxedWarning": _first(r, "boxed_warning"),
                        "adverseReactions": _first(r, "adverse_reactions"),
                        "dosage": _first(r, "dosage_and_administration"),
                        "contraindications": _first(r, "contraindications"),
                        "drugInteractions": _first(r, "drug_interactions"),
                        "source": "OpenFDA Drug Labels",
                    }
    except Exception as e:
        logger.warning(f"get_drug_label({drug}): {e}")
    return {}


def _first(obj: dict, key: str) -> str:
    val = obj.get(key)
    if isinstance(val, list) and val:
        return val[0][:2000]
    return ""


# ── recalls ────────────────────────────────────────────────────────────────────

async def search_recalls(drug: str, limit: int = 5) -> list[dict]:
    """Fetch FDA drug enforcement / recall records for a drug."""
    params = {
        "search": f'product_description:"{drug}" OR openfda.generic_name:"{drug}" OR openfda.brand_name:"{drug}"',
        "limit": min(limit, 20),
        "sort": "report_date:desc",
    }
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(ENFORCE_BASE, params=params)
            if resp.status_code == 200:
                results = resp.json().get("results", [])
                return [
                    {
                        "recallNumber": r.get("recall_number", ""),
                        "product": r.get("product_description", "")[:200],
                        "reason": r.get("reason_for_recall", "")[:300],
                        "status": r.get("status", ""),
                        "classification": r.get("classification", ""),
                        "date": r.get("report_date", ""),
                        "recallingFirm": r.get("recalling_firm", ""),
                        "country": r.get("country", ""),
                    }
                    for r in results
                ]
            elif resp.status_code == 404:
                return []
    except Exception as e:
        logger.warning(f"search_recalls({drug}): {e}")
    return []


# ── FAERS timeline ─────────────────────────────────────────────────────────────

async def get_faers_timeline(drug: str, years: int = 5) -> list[dict]:
    """Monthly FAERS report counts for the past N years."""
    q = _drug_query(drug)
    params = {
        "search": q,
        "count": "receivedate",
        "limit": years * 12 + 6,
    }
    try:
        async with httpx.AsyncClient(timeout=12.0) as client:
            resp = await client.get(FAERS_BASE, params=params)
            if resp.status_code == 200:
                results = resp.json().get("results", [])
                cutoff_year = datetime.now().year - years
                timeline = []
                for r in results:
                    raw = r.get("time", "")
                    if len(raw) >= 6:
                        year = int(raw[:4])
                        month = raw[4:6]
                        if year >= cutoff_year:
                            timeline.append({
                                "month": f"{year}-{month}",
                                "count": r.get("count", 0),
                            })
                timeline.sort(key=lambda x: x["month"])
                return timeline
    except Exception as e:
        logger.warning(f"get_faers_timeline({drug}): {e}")
    return []


# ── backward-compat shim ───────────────────────────────────────────────────────

async def get_adverse_events(drug_name: str) -> dict:
    """Legacy shim used by trial_hub_engine (returns old format)."""
    result = await search_adverse_events(drug_name, limit=10)
    return {
        "source": "OpenFDA FAERS",
        "top_reactions": [r["reaction"] for r in result.get("reactions", [])[:5]],
        "total_reports": result.get("total", 0),
        "proofLink": f"{FAERS_BASE}?search={_drug_query(drug_name)}&limit=1",
    }
