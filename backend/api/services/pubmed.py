from __future__ import annotations
import httpx
import logging
import urllib.parse
import xml.etree.ElementTree as ET
from typing import Optional

logger = logging.getLogger(__name__)

ENTREZ_BASE = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils"


# ── search_articles ────────────────────────────────────────────────────────────

async def search_articles(
    query: str,
    max_results: int = 20,
    sort: str = "relevance",
    date_range: Optional[tuple[str, str]] = None,
) -> dict:
    """
    Full PubMed article search using NCBI E-utilities.
    Returns articles with title, authors, journal, pubDate, pmid, url.
    """
    if not query:
        return {"total": 0, "articles": []}

    search_params: dict = {
        "db": "pubmed",
        "term": query,
        "retmax": min(max_results, 50),
        "retmode": "json",
        "sort": "relevance" if sort == "relevance" else "pub+date",
        "usehistory": "y",
    }
    if date_range:
        search_params["mindate"] = date_range[0]
        search_params["maxdate"] = date_range[1]
        search_params["datetype"] = "pdat"

    try:
        async with httpx.AsyncClient(timeout=20.0) as client:
            # Step 1: esearch
            sresp = await client.get(f"{ENTREZ_BASE}/esearch.fcgi", params=search_params)
            sresp.raise_for_status()
            sdata = sresp.json()
            esr = sdata.get("esearchresult", {})
            total = int(esr.get("count", 0))
            pmids: list[str] = esr.get("idlist", [])
            web_env = esr.get("webenv", "")
            query_key = esr.get("querykey", "")

            if not pmids:
                return {"total": total, "articles": []}

            # Step 2: efetch XML to get metadata
            fetch_params: dict = {
                "db": "pubmed",
                "rettype": "abstract",
                "retmode": "xml",
            }
            if web_env and query_key:
                fetch_params["WebEnv"] = web_env
                fetch_params["query_key"] = query_key
                fetch_params["retmax"] = len(pmids)
            else:
                fetch_params["id"] = ",".join(pmids)

            fresp = await client.get(f"{ENTREZ_BASE}/efetch.fcgi", params=fetch_params)
            fresp.raise_for_status()

            articles = _parse_article_xml(fresp.text)
            return {"total": total, "articles": articles}

    except Exception as e:
        logger.warning(f"search_articles({query!r}): {e}")
        return {"total": 0, "articles": []}


# ── fetch_abstract ─────────────────────────────────────────────────────────────

async def fetch_abstract(pmid: str) -> str:
    """Fetch the abstract text for a single PubMed article by PMID."""
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(
                f"{ENTREZ_BASE}/efetch.fcgi",
                params={"db": "pubmed", "id": pmid, "rettype": "abstract", "retmode": "xml"},
            )
            resp.raise_for_status()
            arts = _parse_article_xml(resp.text)
            if arts:
                return arts[0].get("abstract") or "No abstract available."
    except Exception as e:
        logger.warning(f"fetch_abstract({pmid}): {e}")
    return "Could not load abstract."


# ── XML parser ─────────────────────────────────────────────────────────────────

def _parse_article_xml(xml_text: str) -> list[dict]:
    """Parse PubMed efetch XML into a list of article dicts."""
    try:
        root = ET.fromstring(xml_text)
    except ET.ParseError as e:
        logger.warning(f"XML parse error: {e}")
        return []

    articles = []
    for article_el in root.findall(".//PubmedArticle"):
        try:
            medline = article_el.find(".//MedlineCitation")
            if medline is None:
                continue

            # PMID
            pmid_el = medline.find("PMID")
            pmid = pmid_el.text.strip() if pmid_el is not None and pmid_el.text else ""

            art = medline.find("Article")
            if art is None:
                continue

            # Title
            title_el = art.find(".//ArticleTitle")
            title = _element_text(title_el)

            # Journal
            journal_el = art.find(".//Journal/Title")
            journal = journal_el.text.strip() if journal_el is not None and journal_el.text else ""

            # Abbreviated journal
            iso_el = art.find(".//Journal/ISOAbbreviation")
            journal_abbr = iso_el.text.strip() if iso_el is not None and iso_el.text else journal

            # Publication date
            pub_year = ""
            pub_date_els = [
                art.find(".//Journal/JournalIssue/PubDate"),
                art.find(".//ArticleDate"),
                medline.find(".//DateCompleted"),
            ]
            for pd in pub_date_els:
                if pd is not None:
                    year_el = pd.find("Year")
                    month_el = pd.find("Month")
                    if year_el is not None and year_el.text:
                        y = year_el.text.strip()
                        m = (month_el.text.strip()[:3] if month_el is not None and month_el.text else "")
                        pub_year = f"{y} {m}".strip() if m else y
                        break

            # Authors
            authors: list[str] = []
            for author in art.findall(".//AuthorList/Author"):
                last = author.findtext("LastName", "")
                first = author.findtext("ForeName", "")
                collective = author.findtext("CollectiveName", "")
                if collective:
                    authors.append(collective)
                elif last:
                    authors.append(f"{last} {first[0]}." if first else last)

            # Abstract
            abstract_parts: list[str] = []
            for ab_text in art.findall(".//Abstract/AbstractText"):
                label = ab_text.get("Label", "")
                text = _element_text(ab_text)
                if text:
                    if label:
                        abstract_parts.append(f"{label}: {text}")
                    else:
                        abstract_parts.append(text)
            abstract = " ".join(abstract_parts)[:3000]

            articles.append({
                "pmid": pmid,
                "title": title,
                "authors": authors,
                "journal": journal_abbr or journal,
                "pubDate": pub_year,
                "year": pub_year[:4] if pub_year else "",
                "abstract": abstract,
                "url": f"https://pubmed.ncbi.nlm.nih.gov/{pmid}/",
            })
        except Exception as e:
            logger.debug(f"Article parse error: {e}")
            continue

    return articles


def _element_text(el) -> str:
    """Recursively extract text from an XML element, including sub-elements."""
    if el is None:
        return ""
    parts = []
    if el.text:
        parts.append(el.text.strip())
    for child in el:
        parts.append(_element_text(child))
        if child.tail:
            parts.append(child.tail.strip())
    return " ".join(p for p in parts if p)


# ── backward-compat: get_literature_stats ─────────────────────────────────────

async def get_literature_stats(condition: str, intervention: str) -> dict:
    """Count-only PubMed query used by trial_hub_engine Stage 1."""
    if not condition:
        return {}
    query = f"{condition}[Title/Abstract]"
    if intervention:
        query += f" AND {intervention}[Title/Abstract]"
    encoded = urllib.parse.quote(query)
    url = f"{ENTREZ_BASE}/esearch.fcgi?db=pubmed&term={encoded}&retmode=json"
    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            resp = await client.get(url)
            if resp.status_code == 200:
                count = int(resp.json().get("esearchresult", {}).get("count", 0))
                return {
                    "source": "PubMed (NCBI E-utilities)",
                    "article_count": count,
                    "proofLink": f"https://pubmed.ncbi.nlm.nih.gov/?term={encoded}",
                }
    except Exception as e:
        logger.warning(f"get_literature_stats: {e}")
    return {}
