from fastapi import APIRouter, Query, HTTPException
from ..services import openfda
import asyncio

router = APIRouter(prefix="/safety", tags=["safety"])


@router.get("/adverse-events")
async def get_adverse_events(
    drug: str = Query(..., description="Drug/intervention name"),
    limit: int = Query(default=25, le=100),
):
    try:
        events, serious = await asyncio.gather(
            openfda.search_adverse_events(drug, limit=limit),
            openfda.get_serious_outcome_counts(drug),
        )
        return {**events, "seriousOutcomes": serious}
    except Exception as e:
        raise HTTPException(status_code=502, detail=str(e))


@router.get("/drug-label")
async def get_drug_label(drug: str = Query(...)):
    try:
        label = await openfda.get_drug_label(drug)
        if not label:
            raise HTTPException(status_code=404, detail=f"No label found for {drug}")
        return label
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=502, detail=str(e))


@router.get("/recalls")
async def get_drug_recalls(drug: str = Query(...), limit: int = Query(default=5)):
    try:
        recalls = await openfda.search_recalls(drug, limit=limit)
        return {"drug": drug, "recalls": recalls, "total": len(recalls)}
    except Exception as e:
        raise HTTPException(status_code=502, detail=str(e))


@router.get("/faers-timeline")
async def get_faers_timeline(
    drug: str = Query(...),
    years: int = Query(default=5, le=10),
):
    try:
        timeline = await openfda.get_faers_timeline(drug, years=years)
        return {"drug": drug, "timeline": timeline}
    except Exception as e:
        raise HTTPException(status_code=502, detail=str(e))


@router.get("/profile")
async def get_full_safety_profile(drug: str = Query(...)):
    try:
        events_task = openfda.search_adverse_events(drug, limit=30)
        serious_task = openfda.get_serious_outcome_counts(drug)
        label_task = openfda.get_drug_label(drug)
        recalls_task = openfda.search_recalls(drug, limit=5)
        timeline_task = openfda.get_faers_timeline(drug, years=5)

        events, serious, label, recalls, timeline = await asyncio.gather(
            events_task, serious_task, label_task, recalls_task, timeline_task,
            return_exceptions=True,
        )

        return {
            "drug": drug,
            "adverseEvents": events if not isinstance(events, Exception) else {"total": 0, "reactions": []},
            "seriousOutcomes": serious if not isinstance(serious, Exception) else {},
            "label": label if not isinstance(label, Exception) else {},
            "recalls": recalls if not isinstance(recalls, Exception) else [],
            "faersTimeline": timeline if not isinstance(timeline, Exception) else [],
        }
    except Exception as e:
        raise HTTPException(status_code=502, detail=str(e))
