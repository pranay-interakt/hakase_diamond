from __future__ import annotations
import httpx
import asyncio
from typing import Any, Optional

BASE = "https://clinicaltrials.gov/api/v2"
HEADERS = {"Accept": "application/json"}

async def search_studies(
    query: str = "",
    condition: str = "",
    intervention: str = "",
    phase:Optional[ list[str] ] = None,
    status:Optional[ list[str] ] = None,
    page_size: int = 20,
    page_token:Optional[ str ] = None,
    fields:Optional[ list[str] ] = None,
) -> dict:
    params: dict[str, Any] = {"pageSize": page_size, "format": "json"}
    terms = []
    if query:
        terms.append(query)
    if condition:
        params["query.cond"] = condition
    if intervention:
        params["query.intr"] = intervention
    if terms:
        params["query.term"] = " ".join(terms)
    if phase:
        params["filter.advanced"] = " OR ".join([f"AREA[Phase]{p}" for p in phase])
    if status:
        params["filter.overallStatus"] = "|".join(status)
    if page_token:
        params["pageToken"] = page_token
    if fields:
        params["fields"] = "|".join(fields)

    async with httpx.AsyncClient(timeout=30) as client:
        r = await client.get(f"{BASE}/studies", params=params, headers=HEADERS)
        r.raise_for_status()
        return r.json()


async def get_study(nct_id: str) -> dict:
    async with httpx.AsyncClient(timeout=30) as client:
        r = await client.get(f"{BASE}/studies/{nct_id}", headers=HEADERS)
        r.raise_for_status()
        return r.json()


async def get_study_stats() -> dict:
    async with httpx.AsyncClient(timeout=30) as client:
        r = await client.get(f"{BASE}/stats/size", headers=HEADERS)
        r.raise_for_status()
        return r.json()


def extract_core(study: dict) -> dict:
    p = study.get("protocolSection", {})
    id_mod = p.get("identificationModule", {})
    status_mod = p.get("statusModule", {})
    desc_mod = p.get("descriptionModule", {})
    cond_mod = p.get("conditionsModule", {})
    design_mod = p.get("designModule", {})
    arm_mod = p.get("armsInterventionsModule", {})
    outcome_mod = p.get("outcomesModule", {})
    elig_mod = p.get("eligibilityModule", {})
    contact_mod = p.get("contactsLocationsModule", {})
    sponsor_mod = p.get("sponsorCollaboratorsModule", {})

    phases = design_mod.get("phases", [])
    enrollment = design_mod.get("enrollmentInfo", {})
    locations = contact_mod.get("locations", [])
    countries = list({loc.get("country", "") for loc in locations if loc.get("country")})

    primary_outcomes = [o.get("measure", "") for o in outcome_mod.get("primaryOutcomes", [])]
    secondary_outcomes = [o.get("measure", "") for o in outcome_mod.get("secondaryOutcomes", [])]

    interventions = []
    for arm in arm_mod.get("interventions", []):
        interventions.append({
            "name": arm.get("name", ""),
            "type": arm.get("type", ""),
        })

    return {
        "nctId": id_mod.get("nctId", ""),
        "title": id_mod.get("briefTitle", ""),
        "officialTitle": id_mod.get("officialTitle", ""),
        "status": status_mod.get("overallStatus", ""),
        "phase": phases,
        "conditions": cond_mod.get("conditions", []),
        "keywords": cond_mod.get("keywords", []),
        "interventions": interventions,
        "primaryOutcomes": primary_outcomes,
        "secondaryOutcomes": secondary_outcomes,
        "enrollmentCount": enrollment.get("count"),
        "enrollmentType": enrollment.get("type", ""),
        "startDate": status_mod.get("startDateStruct", {}).get("date", ""),
        "completionDate": status_mod.get("completionDateStruct", {}).get("date", ""),
        "primaryCompletionDate": status_mod.get("primaryCompletionDateStruct", {}).get("date", ""),
        "studyType": design_mod.get("studyType", ""),
        "allocation": design_mod.get("designInfo", {}).get("allocation", ""),
        "interventionModel": design_mod.get("designInfo", {}).get("interventionModel", ""),
        "masking": design_mod.get("designInfo", {}).get("maskingInfo", {}).get("masking", ""),
        "eligibilityCriteria": elig_mod.get("eligibilityCriteria", ""),
        "minAge": elig_mod.get("minimumAge", ""),
        "maxAge": elig_mod.get("maximumAge", ""),
        "sex": elig_mod.get("sex", ""),
        "countries": countries,
        "locations": locations,
        "locationCount": len(locations),
        "sponsorName": sponsor_mod.get("leadSponsor", {}).get("name", ""),
        "sponsorClass": sponsor_mod.get("leadSponsor", {}).get("class", ""),
        "briefSummary": desc_mod.get("briefSummary", ""),
        "detailedDescription": desc_mod.get("detailedDescription", ""),
    }
