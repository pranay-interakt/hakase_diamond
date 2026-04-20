from __future__ import annotations
from fastapi import APIRouter, Query
from ..services import kols as kol_service

router = APIRouter(prefix="/kols", tags=["kols"])


@router.get("/find")
async def find_kols(
    condition: str = Query(..., description="Disease / therapeutic area"),
    intervention: str = Query(default="", description="Drug or intervention name"),
    limit: int = Query(default=20, le=50),
):
    """Find Key Opinion Leaders for a disease area by mining PubMed authorship data."""
    return await kol_service.find_kols(
        condition=condition,
        intervention=intervention,
        max_articles=200,
        limit=limit,
    )
