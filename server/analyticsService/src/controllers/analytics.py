from fastapi import Depends, Query
from ..middleware.auth import verify_advocate
from ..models.shift import ShiftModel
from ..models.user import UserModel
from ..models.complaint import ComplaintModel
from ..utils.helpers import safe_float, week_label, build_cluster_metadata
from collections import defaultdict

"""
Analytics Controller - Handles all API requests
Similar to: exports.getOverview = async (req, res) => { ... }
"""

async def get_overview(user=Depends(verify_advocate)):
    """GET /api/analytics/overview - Dashboard metrics"""
    overview_row = await ShiftModel.get_overview_stats()
    
    rising_rows = await ShiftModel.get_rising_platforms()
    rising_platforms = []
    
    for row in rising_rows:
        recent_avg = safe_float(row["recent_avg"])
        previous_avg = safe_float(row["previous_avg"])
        if previous_avg and recent_avg > previous_avg:
            rising_platforms.append({
                "platform": row["platform"],
                "recent_avg": recent_avg,
                "previous_avg": previous_avg,
                "change": round(recent_avg - previous_avg, 2),
            })
    
    complaint_stats = await ComplaintModel.get_complaint_stats()
    
    return {
        "success": True,
        "overview": {
            "vulnerable_workers": int(overview_row["vulnerable_workers"] or 0),
            "avg_commission_this_week": safe_float(overview_row["avg_commission"]),
            "complaints_this_week": int(complaint_stats["complaints_this_week"] or 0),
            "open_complaints": int(complaint_stats["open_complaints"] or 0),
            "active_cities": 0,  # Can be added from user model
            "rising_platform_count": len(rising_platforms),
        },
        "rising_platforms": sorted(rising_platforms, key=lambda x: x["change"], reverse=True)[:5],
    }


async def get_vulnerable_workers(
    limit: int = Query(20, ge=1, le=100),
    user=Depends(verify_advocate)
):
    """GET /api/analytics/vulnerable-workers - Workers with income drop >20%"""
    rows = await ShiftModel.get_vulnerable_workers(limit)
    
    workers = []
    for row in rows:
        previous_earnings = float(row["previous_earnings"] or 0)
        current_earnings = float(row["current_earnings"] or 0)
        drop_percentage = ((previous_earnings - current_earnings) / previous_earnings * 100) if previous_earnings else 0
        workers.append({
            "user_id": row["user_id"],
            "name": row["name"],
            "city": row["city"],
            "current_month_earnings": safe_float(current_earnings),
            "previous_month_earnings": safe_float(previous_earnings),
            "drop_percentage": round(drop_percentage, 1),
            "current_shift_count": int(row["current_shift_count"] or 0),
            "previous_shift_count": int(row["previous_shift_count"] or 0),
        })
    
    return {"success": True, "workers": workers}


async def get_commission_trends(user=Depends(verify_advocate)):
    """GET /api/analytics/commission-trends - Commission trends by platform"""
    rows = await ShiftModel.get_commission_trends()
    
    weeks = sorted({row["week_start"] for row in rows})
    platform_map = defaultdict(dict)
    
    for row in rows:
        platform_map[row["platform"]][row["week_start"]] = safe_float(row["avg_commission"])
    
    trend_data = []
    rising_platforms = []
    week_series = [week_label(item) for item in weeks]
    
    for platform, values in platform_map.items():
        series = []
        for week in weeks:
            series.append({
                "week_start": week.isoformat(),
                "label": week_label(week),
                "avg_commission": values.get(week),
            })
        
        recent_values = [p["avg_commission"] for p in series[-4:] if p["avg_commission"] is not None]
        previous_values = [p["avg_commission"] for p in series[-8:-4] if p["avg_commission"] is not None]
        recent_avg = sum(recent_values) / len(recent_values) if recent_values else 0
        previous_avg = sum(previous_values) / len(previous_values) if previous_values else recent_avg
        change = recent_avg - previous_avg
        
        direction = "stable"
        if change > 0.25:
            direction = "up"
        elif change < -0.25:
            direction = "down"
        
        trend_entry = {
            "platform": platform,
            "direction": direction,
            "change": round(change, 2),
            "recent_avg": round(recent_avg, 2),
            "previous_avg": round(previous_avg, 2),
            "series": series,
        }
        trend_data.append(trend_entry)
        
        if direction == "up":
            rising_platforms.append(trend_entry)
    
    return {
        "success": True,
        "weeks": week_series,
        "trends": sorted(trend_data, key=lambda x: x["platform"]),
        "rising_platforms": sorted(rising_platforms, key=lambda x: x["change"], reverse=True),
    }


async def get_income_distribution(user=Depends(verify_advocate)):
    """GET /api/analytics/income-distribution - Income by city"""
    rows = await UserModel.get_income_distribution()
    
    distribution = [
        {
            "city_zone": row["city_zone"],
            "worker_count": int(row["worker_count"] or 0),
            "average_earnings": safe_float(row["avg_earnings"]),
            "median_earnings": safe_float(row["median_earnings"]),
            "min_earnings": safe_float(row["min_earnings"]),
            "max_earnings": safe_float(row["max_earnings"]),
            "total_earnings": safe_float(row["total_earnings"]),
        }
        for row in rows
    ]
    
    return {"success": True, "distribution": distribution}


async def get_top_complaints(user=Depends(verify_advocate)):
    """GET /api/analytics/top-complaints - Top complaints this week"""
    categories = await ComplaintModel.get_top_complaints()
    platforms = await ComplaintModel.get_complaint_platforms()
    systemic_issues = await ComplaintModel.get_systemic_issues()
    
    return {
        "success": True,
        "categories": [
            {"category": row["category"], "count": int(row["count"] or 0), "percentage": safe_float(row["percentage"])}
            for row in categories
        ],
        "platforms": [
            {"platform": row["platform"], "count": int(row["count"] or 0)}
            for row in platforms
        ],
        "systemic_issues": [
            {
                "platform": row["platform"],
                "category": row["category"],
                "complaint_count": int(row["complaint_count"] or 0),
                "escalated_count": int(row["escalated_count"] or 0),
                "unresolved_count": int(row["unresolved_count"] or 0),
            }
            for row in systemic_issues
        ],
    }


async def get_grievance_board(
    page: int = Query(1, ge=1),
    limit: int = Query(12, ge=1, le=50),
    status: str = None,
    platform: str = None,
    search: str = None,
    user=Depends(verify_advocate)
):
    """GET /api/analytics/grievance-board - Moderation queue"""
    complaints = await ComplaintModel.get_grievance_board(status, platform, search, page, limit)
    total = await ComplaintModel.get_complaints_count(status, platform, search)
    stats = await ComplaintModel.get_complaint_stats()
    
    cluster_counts = defaultdict(int)
    processed_complaints = []
    
    for complaint in complaints:
        complaint_dict = dict(complaint)
        cluster_meta = build_cluster_metadata(complaint_dict)
        complaint_dict["created_at"] = complaint_dict["created_at"].isoformat()
        complaint_dict["updated_at"] = complaint_dict["updated_at"].isoformat()
        complaint_dict["tags"] = complaint_dict.get("tags") or []
        complaint_dict["suggested_cluster_id"] = cluster_meta["cluster_id"]
        complaint_dict["suggested_cluster_key"] = cluster_meta["cluster_key"]
        complaint_dict["suggested_cluster_label"] = cluster_meta["cluster_label"]
        complaint_dict["cluster_reason"] = cluster_meta["cluster_reason"]
        complaint_dict["suggested_tags"] = cluster_meta["suggested_tags"]
        processed_complaints.append(complaint_dict)
        
        current_cluster = complaint_dict.get("cluster_id") or cluster_meta["cluster_id"]
        cluster_counts[current_cluster] += 1
    
    return {
        "success": True,
        "complaints": processed_complaints,
        "pagination": {
            "page": page,
            "limit": limit,
            "total": total,
            "total_pages": max(1, (total - 1) // limit + 1),
        },
        "summary": {
            "pending": int(stats["pending_count"] or 0),
            "escalated": int(stats["escalated_count"] or 0),
            "resolved": int(stats["resolved_count"] or 0),
            "active_clusters": len(cluster_counts),
        },
    }


async def update_grievance_board_item(
    complaint_id: int,
    status: str = None,
    tags: list = None,
    cluster_id: int = None,
    user=Depends(verify_advocate)
):
    """PUT /api/analytics/grievance-board/{complaint_id} - Update complaint"""
    updated = await ComplaintModel.update_complaint(complaint_id, status, tags, cluster_id)
    
    if not updated:
        return {"success": False, "error": "Complaint not found"}
    
    complaint_dict = dict(updated)
    complaint_dict["created_at"] = complaint_dict["created_at"].isoformat()
    complaint_dict["updated_at"] = complaint_dict["updated_at"].isoformat()
    complaint_dict["tags"] = complaint_dict.get("tags") or []
    complaint_dict.update(build_cluster_metadata(complaint_dict))
    
    return {"success": True, "complaint": complaint_dict}


async def get_analytics_summary(user=Depends(verify_advocate)):
    """GET /api/analytics/summary - Complete dashboard data"""
    overview_data = await get_overview(user)
    vulnerable_data = await get_vulnerable_workers(5, user)
    commission_data = await get_commission_trends(user)
    income_data = await get_income_distribution(user)
    complaints_data = await get_top_complaints(user)
    moderation_data = await get_grievance_board(1, 5, None, None, None, user)
    
    return {
        "success": True,
        "overview": overview_data["overview"],
        "rising_platforms": overview_data["rising_platforms"],
        "vulnerable_workers": vulnerable_data["workers"],
        "commission_trends": commission_data["trends"],
        "income_distribution": income_data["distribution"],
        "complaints": complaints_data,
        "grievance_summary": moderation_data["summary"],
        "priority_complaints": moderation_data["complaints"],
    }