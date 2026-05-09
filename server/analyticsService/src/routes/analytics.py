from fastapi import APIRouter, Depends, Query
from ..controllers.analytics import (
    get_overview,
    get_vulnerable_workers,
    get_commission_trends,
    get_income_distribution,
    get_top_complaints,
    get_grievance_board,
    update_grievance_board_item,
    get_analytics_summary
)
from pydantic import BaseModel
from typing import Optional, List

"""
Analytics Routes - Define all API endpoints
Similar to: router.get('/overview', controller.getOverview)
"""

router = APIRouter(prefix="/api/analytics", tags=["analytics"])

class GrievanceUpdateRequest(BaseModel):
    status: Optional[str] = None
    tags: Optional[List[str]] = None
    cluster_id: Optional[int] = None

@router.get("/overview")
async def overview(user=Depends(get_overview)):
    return user

@router.get("/vulnerable-workers")
async def vulnerable_workers(
    limit: int = Query(20, ge=1, le=100),
    data=Depends(get_vulnerable_workers)
):
    return data

@router.get("/commission-trends")
async def commission_trends(data=Depends(get_commission_trends)):
    return data

@router.get("/income-distribution")
async def income_distribution(data=Depends(get_income_distribution)):
    return data

@router.get("/top-complaints")
async def top_complaints(data=Depends(get_top_complaints)):
    return data

@router.get("/grievance-board")
async def grievance_board(
    page: int = Query(1, ge=1),
    limit: int = Query(12, ge=1, le=50),
    status: Optional[str] = None,
    platform: Optional[str] = None,
    search: Optional[str] = None,
    data=Depends(get_grievance_board)
):
    return data

@router.put("/grievance-board/{complaint_id}")
async def update_grievance_board(
    complaint_id: int,
    payload: GrievanceUpdateRequest,
    data=Depends(update_grievance_board_item)
):
    return data

@router.get("/summary")
async def summary(data=Depends(get_analytics_summary)):
    return data