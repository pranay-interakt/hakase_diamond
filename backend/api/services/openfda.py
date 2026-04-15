import httpx
import logging

logger = logging.getLogger(__name__)

async def get_adverse_events(drug_name: str) -> dict:
    """
    Fetches aggregate adverse event data from OpenFDA.
    Useful for building safety profiles and deep learning outcome prediction.
    """
    if not drug_name or len(drug_name) < 3:
        return {}
    
    url = f"https://api.fda.gov/drug/event.json?search=patient.drug.medicinalproduct:{drug_name}&count=patient.reaction.reactionmeddrapt.exact"
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.get(url)
            if resp.status_code == 200:
                data = resp.json()
                results = data.get("results", [])
                return {
                    "source": "OpenFDA Adverse Event Reporting System (FAERS)",
                    "top_reactions": [r["term"] for r in results[:5]],
                    "total_reports": sum(r["count"] for r in results[:10]),
                    "proofLink": url.replace(" ", "+")
                }
    except Exception as e:
        logger.warning(f"OpenFDA fetch failed for {drug_name}: {e}")
    
    return {}
