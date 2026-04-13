import httpx
from typing import Any
import xml.etree.ElementTree as ET

BASE = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils"
EMAIL = "hakase-clinical@example.com"


async def search_articles(
    query: str,
    max_results: int = 20,
    sort: str = "relevance",
    date_range: tuple[str, str] | None = None,
) -> dict:
    params: dict[str, Any] = {
        "db": "pubmed",
        "term": query,
        "retmax": max_results,
        "retmode": "json",
        "sort": sort,
        "email": EMAIL,
        "tool": "HakaseClinical",
    }
    if date_range:
        params["mindate"] = date_range[0]
        params["maxdate"] = date_range[1]
        params["datetype"] = "pdat"

    async with httpx.AsyncClient(timeout=30) as client:
        r = await client.get(f"{BASE}/esearch.fcgi", params=params)
        r.raise_for_status()
        data = r.json()

    ids = data.get("esearchresult", {}).get("idlist", [])
    count = int(data.get("esearchresult", {}).get("count", 0))

    if not ids:
        return {"total": count, "articles": []}

    articles = await fetch_summaries(ids)
    return {"total": count, "articles": articles}


async def fetch_summaries(pmids: list[str]) -> list[dict]:
    params: dict[str, Any] = {
        "db": "pubmed",
        "id": ",".join(pmids),
        "retmode": "json",
        "email": EMAIL,
        "tool": "HakaseClinical",
    }
    async with httpx.AsyncClient(timeout=30) as client:
        r = await client.get(f"{BASE}/esummary.fcgi", params=params)
        r.raise_for_status()
        data = r.json()

    result = data.get("result", {})
    articles = []
    for pmid in pmids:
        art = result.get(pmid, {})
        if not art:
            continue
        authors = [a.get("name", "") for a in art.get("authors", [])[:5]]
        articles.append({
            "pmid": pmid,
            "title": art.get("title", ""),
            "journal": art.get("source", ""),
            "pubDate": art.get("pubdate", ""),
            "authors": authors,
            "doi": next((
                uid.get("value", "") for uid in art.get("articleids", [])
                if uid.get("idtype") == "doi"
            ), ""),
            "url": f"https://pubmed.ncbi.nlm.nih.gov/{pmid}/",
            "abstract": "",
        })
    return articles


async def fetch_abstract(pmid: str) -> str:
    params: dict[str, Any] = {
        "db": "pubmed",
        "id": pmid,
        "retmode": "xml",
        "rettype": "abstract",
        "email": EMAIL,
        "tool": "HakaseClinical",
    }
    async with httpx.AsyncClient(timeout=30) as client:
        r = await client.get(f"{BASE}/efetch.fcgi", params=params)
        r.raise_for_status()

    try:
        root = ET.fromstring(r.text)
        texts = []
        for ab in root.iter("AbstractText"):
            label = ab.get("Label", "")
            text = ab.text or ""
            if label:
                texts.append(f"{label}: {text}")
            else:
                texts.append(text)
        return " ".join(texts)
    except Exception:
        return ""
