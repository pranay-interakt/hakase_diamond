import httpx
import logging
import urllib.parse

logger = logging.getLogger(__name__)

async def get_literature_stats(condition: str, intervention: str) -> dict:
    """
    Fetches literature counts from NCBI E-utilities (PubMed).
    Used as an indicator of scientific consensus and maturity of the approach.
    """
    if not condition:
        return {}
        
    query = f"{condition}[Title/Abstract]"
    if intervention:
        query += f" AND {intervention}[Title/Abstract]"
        
    encoded_query = urllib.parse.quote(query)
    url = f"https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term={encoded_query}&retmode=json"
    
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.get(url)
            if resp.status_code == 200:
                data = resp.json()
                count = int(data.get("esearchresult", {}).get("count", 0))
                return {
                    "source": "PubMed (NCBI E-utilities)",
                    "article_count": count,
                    "proofLink": f"https://pubmed.ncbi.nlm.nih.gov/?term={encoded_query}"
                }
    except Exception as e:
        logger.warning(f"PubMed fetch failed: {e}")
        
    return {}
