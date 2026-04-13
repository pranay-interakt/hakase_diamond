from fastapi import APIRouter, Query, HTTPException
from ..services import pubmed

router = APIRouter(prefix="/publications", tags=["publications"])


@router.get("/search")
async def search_publications(
    q: str = Query(..., description="Search query — condition, drug, MeSH terms, etc."),
    max_results: int = Query(default=20, le=50),
    sort: str = Query(default="relevance", pattern="^(relevance|date)$"),
    since_year: int | None = Query(default=None, description="Minimum publication year"),
):
    date_range = (f"{since_year}/01/01", "3000/12/31") if since_year else None
    try:
        result = await pubmed.search_articles(q, max_results=max_results, sort=sort, date_range=date_range)
        return result
    except Exception as e:
        raise HTTPException(status_code=502, detail=str(e))


@router.get("/abstract/{pmid}")
async def get_abstract(pmid: str):
    try:
        abstract = await pubmed.fetch_abstract(pmid)
        return {"pmid": pmid, "abstract": abstract}
    except Exception as e:
        raise HTTPException(status_code=502, detail=str(e))


@router.get("/evidence-map")
async def get_evidence_map(
    condition: str = Query(...),
    intervention: str = Query(default=""),
    max_results: int = Query(default=30, le=50),
):
    query_parts = [condition]
    if intervention:
        query_parts.append(intervention)
    query_parts.append("clinical trial")
    query = " AND ".join(f'"{p}"' if " " in p else p for p in query_parts)

    try:
        result = await pubmed.search_articles(query, max_results=max_results, sort="relevance")
        articles = result.get("articles", [])

        rct_keywords = ["randomized", "randomised", "rct", "placebo-controlled", "double-blind"]
        meta_keywords = ["meta-analysis", "systematic review", "cochrane"]
        phase3_keywords = ["phase 3", "phase iii", "phase3"]

        def classify(title: str) -> str:
            t = title.lower()
            if any(k in t for k in meta_keywords):
                return "meta-analysis"
            if any(k in t for k in phase3_keywords):
                return "phase3-rct"
            if any(k in t for k in rct_keywords):
                return "rct"
            return "other"

        for art in articles:
            art["evidenceLevel"] = classify(art.get("title", ""))

        return {
            "total": result.get("total", 0),
            "articles": articles,
            "breakdown": {
                "metaAnalysis": sum(1 for a in articles if a.get("evidenceLevel") == "meta-analysis"),
                "phase3Rct": sum(1 for a in articles if a.get("evidenceLevel") == "phase3-rct"),
                "rct": sum(1 for a in articles if a.get("evidenceLevel") == "rct"),
                "other": sum(1 for a in articles if a.get("evidenceLevel") == "other"),
            },
        }
    except Exception as e:
        raise HTTPException(status_code=502, detail=str(e))
