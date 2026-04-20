from __future__ import annotations
import httpx
from typing import Optional
import xml.etree.ElementTree as ET
from collections import defaultdict
import re

ENTREZ_BASE = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils"


async def find_kols(
    condition: str,
    intervention: str = "",
    max_articles: int = 200,
    limit: int = 25,
) -> dict:
    """Find KOLs by mining PubMed authorship data for a therapeutic area."""
    query_parts = [f'("{condition}"[MeSH Terms] OR "{condition}"[Title/Abstract])']
    if intervention:
        query_parts.append(f'"{intervention}"[Title/Abstract]')
    query = " AND ".join(query_parts)
    query += " AND (Clinical Trial[PT] OR Randomized Controlled Trial[PT] OR Review[PT] OR Meta-Analysis[PT])"

    async with httpx.AsyncClient(timeout=45) as client:
        search_resp = await client.get(
            f"{ENTREZ_BASE}/esearch.fcgi",
            params={
                "db": "pubmed",
                "term": query,
                "retmax": max_articles,
                "retmode": "json",
                "sort": "relevance",
            },
        )
        search_data = search_resp.json()
        pmids = search_data.get("esearchresult", {}).get("idlist", [])

        if not pmids:
            return {"kols": [], "total": 0, "articlesAnalyzed": 0, "query": query, "condition": condition}

        author_stats: dict[str, dict] = defaultdict(lambda: {
            "name": "", "firstName": "", "lastName": "",
            "affiliations": [], "publications": 0,
            "firstAuthor": 0, "lastAuthor": 0,
            "pmids": [], "keywords": [],
        })

        batch_size = 50
        for i in range(0, min(len(pmids), max_articles), batch_size):
            batch = pmids[i: i + batch_size]
            try:
                fetch_resp = await client.get(
                    f"{ENTREZ_BASE}/efetch.fcgi",
                    params={"db": "pubmed", "id": ",".join(batch), "rettype": "xml", "retmode": "xml"},
                )
                _parse_pubmed_xml(fetch_resp.text, author_stats)
            except Exception:
                continue

    kols = []
    for key, stats in author_stats.items():
        if stats["publications"] < 2 or not stats["name"].strip():
            continue
        seen = set()
        unique_affs = []
        for aff in stats["affiliations"]:
            norm = aff[:60].lower()
            if norm not in seen:
                seen.add(norm)
                unique_affs.append(aff)
        stats["affiliations"] = unique_affs[:3]
        stats["score"] = stats["publications"] * 10 + stats["firstAuthor"] * 5 + stats["lastAuthor"] * 5
        stats["keywords"] = list(dict.fromkeys(stats["keywords"]))[:8]
        stats["pubmedUrl"] = f"https://pubmed.ncbi.nlm.nih.gov/?term={stats['firstName']}+{stats['lastName']}[Author]"
        kols.append(stats)

    kols.sort(key=lambda x: x["score"], reverse=True)

    return {
        "kols": kols[:limit],
        "total": len(kols),
        "articlesAnalyzed": len(pmids),
        "query": query,
        "condition": condition,
        "intervention": intervention,
    }


def _parse_pubmed_xml(xml_text: str, author_stats: dict) -> None:
    try:
        root = ET.fromstring(xml_text)
    except ET.ParseError:
        return

    for article in root.findall(".//PubmedArticle"):
        pmid_el = article.find(".//PMID")
        pmid = pmid_el.text if pmid_el is not None else ""

        keywords: list[str] = []
        for kw in article.findall(".//Keyword"):
            if kw.text:
                keywords.append(kw.text.strip())
        for mesh in article.findall(".//MeshHeading/DescriptorName"):
            if mesh.text and len(keywords) < 8:
                keywords.append(mesh.text.strip())

        author_list_el = article.find(".//AuthorList")
        if author_list_el is None:
            continue
        authors_in_article = author_list_el.findall("Author")

        for idx, author in enumerate(authors_in_article):
            last_el = author.find("LastName")
            first_el = author.find("ForeName")
            if last_el is None or not last_el.text:
                continue
            last = last_el.text.strip()
            first = first_el.text.strip() if first_el is not None and first_el.text else ""

            key = f"{last.lower()}_{first[:1].lower()}"

            affs: list[str] = []
            for aff_el in author.findall(".//Affiliation"):
                if aff_el.text:
                    clean = aff_el.text.strip()
                    clean = re.sub(r"\.\s*Electronic address:.*$", "", clean)
                    clean = re.sub(r"\s*[\w._%+-]+@[\w.-]+\.[A-Za-z]{2,}", "", clean).strip()
                    if clean:
                        affs.append(clean)

            s = author_stats[key]
            s["name"] = f"{first} {last}".strip()
            s["firstName"] = first
            s["lastName"] = last
            s["publications"] += 1
            s["affiliations"].extend(affs)
            s["keywords"].extend(keywords[:3])
            if pmid:
                s["pmids"].append(pmid)
            if idx == 0:
                s["firstAuthor"] += 1
            if idx == len(authors_in_article) - 1:
                s["lastAuthor"] += 1
