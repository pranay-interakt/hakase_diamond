import httpx
from typing import Any

BASE = "https://api.fda.gov"


async def search_adverse_events(
    drug_name: str,
    limit: int = 20,
    serious: bool | None = None,
) -> dict:
    query_parts = [f'patient.drug.medicinalproduct:"{drug_name}"']
    if serious is not None:
        query_parts.append(f"serious:{int(serious)}")

    params: dict[str, Any] = {
        "search": " AND ".join(query_parts),
        "limit": limit,
        "count": "patient.reaction.reactionmeddrapt.exact",
    }

    async with httpx.AsyncClient(timeout=30) as client:
        r = await client.get(f"{BASE}/drug/event.json", params=params)
        if r.status_code == 404:
            return {"total": 0, "reactions": []}
        r.raise_for_status()
        data = r.json()

    total = data.get("meta", {}).get("results", {}).get("total", 0)
    reactions = [
        {"term": item["term"], "count": item["count"]}
        for item in data.get("results", [])[:limit]
    ]
    return {"total": total, "reactions": reactions, "drug": drug_name}


async def get_serious_outcome_counts(drug_name: str) -> dict:
    outcomes = {}
    outcome_fields = {
        "death": "serious:1 AND seriousnessdeath:1",
        "hospitalization": "serious:1 AND seriousnesshospitalization:1",
        "life_threatening": "serious:1 AND seriousnesslifethreatening:1",
        "disability": "serious:1 AND seriousnessdisabling:1",
    }
    drug_filter = f'patient.drug.medicinalproduct:"{drug_name}"'

    async with httpx.AsyncClient(timeout=30) as client:
        for key, outcome_filter in outcome_fields.items():
            params: dict[str, Any] = {
                "search": f"{drug_filter} AND {outcome_filter}",
                "limit": 1,
            }
            try:
                r = await client.get(f"{BASE}/drug/event.json", params=params)
                if r.status_code == 200:
                    data = r.json()
                    outcomes[key] = data.get("meta", {}).get("results", {}).get("total", 0)
                else:
                    outcomes[key] = 0
            except Exception:
                outcomes[key] = 0

    return outcomes


async def get_drug_label(drug_name: str) -> dict:
    params: dict[str, Any] = {
        "search": f'openfda.brand_name:"{drug_name}" OR openfda.generic_name:"{drug_name}"',
        "limit": 1,
    }
    async with httpx.AsyncClient(timeout=30) as client:
        r = await client.get(f"{BASE}/drug/label.json", params=params)
        if r.status_code == 404:
            return {}
        r.raise_for_status()
        data = r.json()

    results = data.get("results", [])
    if not results:
        return {}

    label = results[0]
    openfda = label.get("openfda", {})
    return {
        "brandName": openfda.get("brand_name", []),
        "genericName": openfda.get("generic_name", []),
        "manufacturer": openfda.get("manufacturer_name", []),
        "pharmacologicClass": openfda.get("pharm_class_cs", []),
        "indications": label.get("indications_and_usage", [""]),
        "warnings": label.get("warnings", [""]),
        "contraindications": label.get("contraindications", [""]),
        "dosage": label.get("dosage_and_administration", [""]),
        "adverseReactions": label.get("adverse_reactions", [""]),
    }


async def search_recalls(drug_name: str, limit: int = 5) -> list[dict]:
    params: dict[str, Any] = {
        "search": f'product_description:"{drug_name}"',
        "limit": limit,
        "sort": "recall_initiation_date:desc",
    }
    async with httpx.AsyncClient(timeout=30) as client:
        r = await client.get(f"{BASE}/drug/enforcement.json", params=params)
        if r.status_code == 404:
            return []
        r.raise_for_status()
        data = r.json()

    return [
        {
            "recallNumber": item.get("recall_number", ""),
            "date": item.get("recall_initiation_date", ""),
            "status": item.get("status", ""),
            "classificationLevel": item.get("classification", ""),
            "reason": item.get("reason_for_recall", ""),
            "product": item.get("product_description", ""),
        }
        for item in data.get("results", [])
    ]


async def get_faers_timeline(drug_name: str, years: int = 5) -> list[dict]:
    params: dict[str, Any] = {
        "search": f'patient.drug.medicinalproduct:"{drug_name}"',
        "count": "receivedate",
        "limit": years * 12,
    }
    async with httpx.AsyncClient(timeout=30) as client:
        r = await client.get(f"{BASE}/drug/event.json", params=params)
        if r.status_code == 404:
            return []
        r.raise_for_status()
        data = r.json()

    monthly: dict[str, int] = {}
    for item in data.get("results", []):
        date_str = str(item.get("time", ""))
        if len(date_str) >= 6:
            month = date_str[:6]
            monthly[month] = monthly.get(month, 0) + item.get("count", 0)

    sorted_months = sorted(monthly.items(), key=lambda x: x[0])[-60:]
    return [{"month": m, "count": c} for m, c in sorted_months]
