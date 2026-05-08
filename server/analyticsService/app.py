from collections import Counter, defaultdict
from datetime import datetime
import os
import re
import zlib
from typing import Dict, List, Optional

import asyncpg
import httpx
from dotenv import load_dotenv
from fastapi import Depends, FastAPI, HTTPException, Query, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

load_dotenv()

app = FastAPI(
    title="FairGig Analytics Service",
    description="Analytics and moderation tooling for the advocate dashboard",
    version="2.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DATABASE_URL = os.getenv("DATABASE_URL")
AUTH_SERVICE_URL = os.getenv("AUTH_SERVICE_URL", "http://localhost:3001")

if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL must be set for analyticsService")

STOP_WORDS = {
    "about",
    "after",
    "again",
    "been",
    "being",
    "careem",
    "could",
    "delivery",
    "foodpanda",
    "from",
    "have",
    "more",
    "over",
    "platform",
    "ride",
    "rides",
    "shift",
    "that",
    "their",
    "there",
    "these",
    "they",
    "this",
    "uber",
    "when",
    "with",
    "worker",
    "workers",
    "your",
}


class GrievanceUpdateRequest(BaseModel):
    status: Optional[str] = None
    tags: Optional[List[str]] = None
    cluster_id: Optional[int] = None


async def get_db():
    conn = await asyncpg.connect(DATABASE_URL)
    try:
        yield conn
    finally:
        await conn.close()


async def verify_advocate(request: Request):
    cookies = request.headers.get("cookie", "")

    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"{AUTH_SERVICE_URL}/api/auth/verify",
            headers={"Cookie": cookies},
            timeout=10.0,
        )

    if response.status_code != 200:
        raise HTTPException(status_code=401, detail="Authentication required")

    user = response.json().get("user")
    if not user:
        raise HTTPException(status_code=401, detail="Invalid token")

    if user.get("role") != "advocate":
        raise HTTPException(status_code=403, detail="Advocate role required")

    return user


def safe_float(value) -> float:
    if value is None:
        return 0.0
    return round(float(value), 2)


def week_label(value) -> str:
    if isinstance(value, str):
        dt = datetime.fromisoformat(value)
    else:
        dt = value
    return dt.strftime("%d %b")


def build_cluster_metadata(complaint: Dict) -> Dict:
    source = " ".join(
        filter(
            None,
            [
                complaint.get("platform"),
                complaint.get("category"),
                complaint.get("title"),
                complaint.get("description"),
            ],
        )
    ).lower()

    words = re.findall(r"[a-zA-Z]{4,}", source)
    filtered = [word for word in words if word not in STOP_WORDS]
    common_words = [word for word, _count in Counter(filtered).most_common(2)]
    keyword_part = "-".join(common_words) if common_words else "general"

    platform = (complaint.get("platform") or "unknown").lower().replace(" ", "-")
    category = (complaint.get("category") or "general").lower().replace(" ", "-")
    cluster_key = f"{platform}:{category}:{keyword_part}"
    cluster_id = zlib.crc32(cluster_key.encode("utf-8")) % 1000000

    suggested_tags = []
    for tag in [complaint.get("platform"), complaint.get("category"), *common_words]:
        if tag:
            normalized = str(tag).strip().lower().replace(" ", "-")
            if normalized and normalized not in suggested_tags:
                suggested_tags.append(normalized)

    label_keywords = ", ".join(common_words) if common_words else "general pattern"

    return {
        "cluster_key": cluster_key,
        "cluster_id": cluster_id,
        "cluster_label": f"{complaint.get('platform', 'Platform')} / {complaint.get('category', 'General')}",
        "cluster_reason": f"Grouped around {label_keywords}",
        "suggested_tags": suggested_tags[:5],
    }


@app.get("/health")
async def health():
    return {"status": "OK", "service": "analytics-service", "version": "2.0.0"}


@app.get("/")
async def root():
    return {
        "service": "FairGig Analytics Service",
        "endpoints": {
            "GET /api/analytics/overview": "Advocate overview metrics",
            "GET /api/analytics/vulnerable-workers": "Workers with 30-day income drops",
            "GET /api/analytics/commission-trends": "Weekly commission trends for 3 months",
            "GET /api/analytics/income-distribution": "Income distribution by city",
            "GET /api/analytics/top-complaints": "Complaint intelligence for the week",
            "GET /api/analytics/grievance-board": "Moderation queue for advocates",
            "PUT /api/analytics/grievance-board/{complaint_id}": "Update tags, cluster, and status",
            "GET /api/analytics/summary": "Complete advocate dashboard payload",
        },
    }


@app.get("/api/analytics/overview")
async def get_overview(_user=Depends(verify_advocate), db=Depends(get_db)):
    overview_row = await db.fetchrow(
        """
        WITH vulnerable AS (
            WITH current_period AS (
                SELECT user_id, SUM(net_received) AS current_earnings
                FROM shifts
                WHERE verification_status = 'confirmed'
                  AND shift_date >= CURRENT_DATE - INTERVAL '30 days'
                GROUP BY user_id
            ),
            previous_period AS (
                SELECT user_id, SUM(net_received) AS previous_earnings
                FROM shifts
                WHERE verification_status = 'confirmed'
                  AND shift_date >= CURRENT_DATE - INTERVAL '60 days'
                  AND shift_date < CURRENT_DATE - INTERVAL '30 days'
                GROUP BY user_id
            )
            SELECT COUNT(*) AS vulnerable_count
            FROM previous_period p
            LEFT JOIN current_period c ON c.user_id = p.user_id
            WHERE COALESCE(p.previous_earnings, 0) > 0
              AND ((p.previous_earnings - COALESCE(c.current_earnings, 0)) / p.previous_earnings) > 0.20
        ),
        commissions AS (
            SELECT AVG(platform_deductions / NULLIF(gross_earned, 0) * 100) AS avg_commission
            FROM shifts
            WHERE verification_status = 'confirmed'
              AND gross_earned > 0
              AND shift_date >= CURRENT_DATE - INTERVAL '7 days'
        ),
        complaint_stats AS (
            SELECT
                COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days') AS complaints_this_week,
                COUNT(*) FILTER (WHERE status IN ('pending', 'escalated')) AS open_complaints
            FROM complaints
        ),
        city_stats AS (
            SELECT COUNT(DISTINCT COALESCE(NULLIF(city, ''), 'Unknown')) AS active_cities
            FROM users
            WHERE role = 'worker'
        )
        SELECT
            (SELECT vulnerable_count FROM vulnerable) AS vulnerable_workers,
            (SELECT avg_commission FROM commissions) AS avg_commission,
            (SELECT complaints_this_week FROM complaint_stats) AS complaints_this_week,
            (SELECT open_complaints FROM complaint_stats) AS open_complaints,
            (SELECT active_cities FROM city_stats) AS active_cities
        """
    )

    rising_rows = await db.fetch(
        """
        WITH weekly AS (
            SELECT
                platform,
                date_trunc('week', shift_date)::date AS week_start,
                AVG(platform_deductions / NULLIF(gross_earned, 0) * 100) AS avg_commission
            FROM shifts
            WHERE verification_status = 'confirmed'
              AND gross_earned > 0
              AND shift_date >= CURRENT_DATE - INTERVAL '56 days'
            GROUP BY platform, date_trunc('week', shift_date)::date
        )
        SELECT
            platform,
            AVG(avg_commission) FILTER (WHERE week_start >= CURRENT_DATE - INTERVAL '28 days') AS recent_avg,
            AVG(avg_commission) FILTER (
                WHERE week_start < CURRENT_DATE - INTERVAL '28 days'
                  AND week_start >= CURRENT_DATE - INTERVAL '56 days'
            ) AS previous_avg
        FROM weekly
        GROUP BY platform
        """
    )

    rising_platforms = []
    for row in rising_rows:
        recent_avg = safe_float(row["recent_avg"])
        previous_avg = safe_float(row["previous_avg"])
        if previous_avg and recent_avg > previous_avg:
            rising_platforms.append(
                {
                    "platform": row["platform"],
                    "recent_avg": recent_avg,
                    "previous_avg": previous_avg,
                    "change": round(recent_avg - previous_avg, 2),
                }
            )

    return {
        "success": True,
        "overview": {
            "vulnerable_workers": int(overview_row["vulnerable_workers"] or 0),
            "avg_commission_this_week": safe_float(overview_row["avg_commission"]),
            "complaints_this_week": int(overview_row["complaints_this_week"] or 0),
            "open_complaints": int(overview_row["open_complaints"] or 0),
            "active_cities": int(overview_row["active_cities"] or 0),
            "rising_platform_count": len(rising_platforms),
        },
        "rising_platforms": sorted(rising_platforms, key=lambda item: item["change"], reverse=True)[:5],
    }


@app.get("/api/analytics/vulnerable-workers")
async def get_vulnerable_workers(
    limit: int = Query(20, ge=1, le=100),
    _user=Depends(verify_advocate),
    db=Depends(get_db),
):
    rows = await db.fetch(
        """
        WITH current_period AS (
            SELECT
                user_id,
                SUM(net_received) AS current_earnings,
                COUNT(*) AS current_shift_count
            FROM shifts
            WHERE verification_status = 'confirmed'
              AND shift_date >= CURRENT_DATE - INTERVAL '30 days'
            GROUP BY user_id
        ),
        previous_period AS (
            SELECT
                user_id,
                SUM(net_received) AS previous_earnings,
                COUNT(*) AS previous_shift_count
            FROM shifts
            WHERE verification_status = 'confirmed'
              AND shift_date >= CURRENT_DATE - INTERVAL '60 days'
              AND shift_date < CURRENT_DATE - INTERVAL '30 days'
            GROUP BY user_id
        )
        SELECT
            u.id AS user_id,
            u.name,
            COALESCE(NULLIF(u.city, ''), 'Unknown') AS city,
            COALESCE(c.current_earnings, 0) AS current_earnings,
            COALESCE(p.previous_earnings, 0) AS previous_earnings,
            COALESCE(c.current_shift_count, 0) AS current_shift_count,
            COALESCE(p.previous_shift_count, 0) AS previous_shift_count
        FROM users u
        JOIN previous_period p ON p.user_id = u.id
        LEFT JOIN current_period c ON c.user_id = u.id
        WHERE u.role = 'worker'
          AND COALESCE(p.previous_earnings, 0) > 0
          AND ((p.previous_earnings - COALESCE(c.current_earnings, 0)) / p.previous_earnings) > 0.20
        ORDER BY ((p.previous_earnings - COALESCE(c.current_earnings, 0)) / p.previous_earnings) DESC
        LIMIT $1
        """,
        limit,
    )

    workers = []
    for row in rows:
        previous_earnings = float(row["previous_earnings"] or 0)
        current_earnings = float(row["current_earnings"] or 0)
        drop_percentage = ((previous_earnings - current_earnings) / previous_earnings * 100) if previous_earnings else 0
        workers.append(
            {
                "user_id": row["user_id"],
                "name": row["name"],
                "city": row["city"],
                "current_month_earnings": safe_float(current_earnings),
                "previous_month_earnings": safe_float(previous_earnings),
                "drop_percentage": round(drop_percentage, 1),
                "current_shift_count": int(row["current_shift_count"] or 0),
                "previous_shift_count": int(row["previous_shift_count"] or 0),
            }
        )

    return {"success": True, "workers": workers}


@app.get("/api/analytics/commission-trends")
async def get_commission_trends(_user=Depends(verify_advocate), db=Depends(get_db)):
    rows = await db.fetch(
        """
        WITH weekly AS (
            SELECT
                platform,
                date_trunc('week', shift_date)::date AS week_start,
                AVG(platform_deductions / NULLIF(gross_earned, 0) * 100) AS avg_commission
            FROM shifts
            WHERE verification_status = 'confirmed'
              AND gross_earned > 0
              AND shift_date >= CURRENT_DATE - INTERVAL '84 days'
            GROUP BY platform, date_trunc('week', shift_date)::date
        )
        SELECT platform, week_start, avg_commission
        FROM weekly
        ORDER BY week_start ASC, platform ASC
        """
    )

    weeks = sorted({row["week_start"] for row in rows})
    platform_map: Dict[str, Dict] = defaultdict(dict)
    for row in rows:
        platform_map[row["platform"]][row["week_start"]] = safe_float(row["avg_commission"])

    trend_data = []
    rising_platforms = []
    week_series = [week_label(item) for item in weeks]

    for platform, values in platform_map.items():
        series = []
        numeric_values = []
        for week in weeks:
            commission = values.get(week)
            point = {
                "week_start": week.isoformat(),
                "label": week_label(week),
                "avg_commission": commission,
            }
            series.append(point)
            if commission is not None:
                numeric_values.append(commission)

        recent_values = [point["avg_commission"] for point in series[-4:] if point["avg_commission"] is not None]
        previous_values = [point["avg_commission"] for point in series[-8:-4] if point["avg_commission"] is not None]
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
        "trends": sorted(trend_data, key=lambda item: item["platform"]),
        "rising_platforms": sorted(rising_platforms, key=lambda item: item["change"], reverse=True),
    }


@app.get("/api/analytics/income-distribution")
async def get_income_distribution(_user=Depends(verify_advocate), db=Depends(get_db)):
    rows = await db.fetch(
        """
        WITH worker_totals AS (
            SELECT
                COALESCE(NULLIF(u.city, ''), 'Unknown') AS city_zone,
                s.user_id,
                SUM(s.net_received) AS worker_earnings
            FROM shifts s
            JOIN users u ON u.id = s.user_id
            WHERE s.verification_status = 'confirmed'
              AND s.shift_date >= CURRENT_DATE - INTERVAL '30 days'
            GROUP BY COALESCE(NULLIF(u.city, ''), 'Unknown'), s.user_id
        )
        SELECT
            city_zone,
            COUNT(*) AS worker_count,
            AVG(worker_earnings) AS avg_earnings,
            PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY worker_earnings) AS median_earnings,
            MIN(worker_earnings) AS min_earnings,
            MAX(worker_earnings) AS max_earnings,
            SUM(worker_earnings) AS total_earnings
        FROM worker_totals
        GROUP BY city_zone
        ORDER BY total_earnings DESC, city_zone ASC
        """
    )

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


@app.get("/api/analytics/top-complaints")
async def get_top_complaints(_user=Depends(verify_advocate), db=Depends(get_db)):
    category_rows = await db.fetch(
        """
        SELECT
            COALESCE(NULLIF(category, ''), 'Uncategorized') AS category,
            COUNT(*) AS count,
            ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 1) AS percentage
        FROM complaints
        WHERE created_at >= NOW() - INTERVAL '7 days'
        GROUP BY COALESCE(NULLIF(category, ''), 'Uncategorized')
        ORDER BY count DESC
        LIMIT 5
        """
    )

    platform_rows = await db.fetch(
        """
        SELECT
            COALESCE(NULLIF(platform, ''), 'Unknown') AS platform,
            COUNT(*) AS count
        FROM complaints
        WHERE created_at >= NOW() - INTERVAL '7 days'
        GROUP BY COALESCE(NULLIF(platform, ''), 'Unknown')
        ORDER BY count DESC
        LIMIT 5
        """
    )

    issue_rows = await db.fetch(
        """
        SELECT
            COALESCE(NULLIF(platform, ''), 'Unknown') AS platform,
            COALESCE(NULLIF(category, ''), 'Uncategorized') AS category,
            COUNT(*) AS complaint_count,
            COUNT(*) FILTER (WHERE status = 'escalated') AS escalated_count,
            COUNT(*) FILTER (WHERE status != 'resolved') AS unresolved_count
        FROM complaints
        WHERE created_at >= NOW() - INTERVAL '7 days'
        GROUP BY COALESCE(NULLIF(platform, ''), 'Unknown'), COALESCE(NULLIF(category, ''), 'Uncategorized')
        ORDER BY complaint_count DESC, unresolved_count DESC
        LIMIT 6
        """
    )

    categories = [
        {
            "category": row["category"],
            "count": int(row["count"] or 0),
            "percentage": safe_float(row["percentage"]),
        }
        for row in category_rows
    ]
    platforms = [{"platform": row["platform"], "count": int(row["count"] or 0)} for row in platform_rows]
    systemic_issues = [
        {
            "platform": row["platform"],
            "category": row["category"],
            "complaint_count": int(row["complaint_count"] or 0),
            "escalated_count": int(row["escalated_count"] or 0),
            "unresolved_count": int(row["unresolved_count"] or 0),
        }
        for row in issue_rows
    ]

    return {
        "success": True,
        "categories": categories,
        "platforms": platforms,
        "systemic_issues": systemic_issues,
    }


@app.get("/api/analytics/grievance-board")
async def get_grievance_board(
    page: int = Query(1, ge=1),
    limit: int = Query(12, ge=1, le=50),
    status: Optional[str] = None,
    platform: Optional[str] = None,
    search: Optional[str] = None,
    _user=Depends(verify_advocate),
    db=Depends(get_db),
):
    filters = ["1=1"]
    params: List[object] = []
    param_index = 1

    if status:
        filters.append(f"c.status = ${param_index}")
        params.append(status)
        param_index += 1

    if platform:
        filters.append(f"c.platform = ${param_index}")
        params.append(platform)
        param_index += 1

    if search:
        filters.append(
            f"""(
                c.title ILIKE ${param_index}
                OR c.description ILIKE ${param_index}
                OR c.category ILIKE ${param_index}
            )"""
        )
        params.append(f"%{search}%")
        param_index += 1

    where_clause = " AND ".join(filters)
    offset = (page - 1) * limit

    complaint_rows = await db.fetch(
        f"""
        SELECT
            c.id,
            c.user_id,
            c.platform,
            c.category,
            c.title,
            c.description,
            c.tags,
            c.cluster_id,
            c.upvotes,
            c.status,
            c.created_at,
            c.updated_at,
            u.name AS worker_name,
            COALESCE(NULLIF(u.city, ''), 'Unknown') AS city
        FROM complaints c
        LEFT JOIN users u ON u.id = c.user_id
        WHERE {where_clause}
        ORDER BY
            CASE WHEN c.status = 'escalated' THEN 0 ELSE 1 END,
            c.upvotes DESC,
            c.created_at DESC
        LIMIT ${param_index} OFFSET ${param_index + 1}
        """,
        *params,
        limit,
        offset,
    )

    count_row = await db.fetchrow(
        f"SELECT COUNT(*) AS total FROM complaints c WHERE {where_clause}",
        *params,
    )

    complaints = []
    cluster_counts: Dict[int, int] = defaultdict(int)
    for row in complaint_rows:
        complaint = dict(row)
        cluster_meta = build_cluster_metadata(complaint)
        complaint["created_at"] = complaint["created_at"].isoformat()
        complaint["updated_at"] = complaint["updated_at"].isoformat()
        complaint["tags"] = complaint.get("tags") or []
        complaint["suggested_cluster_id"] = cluster_meta["cluster_id"]
        complaint["suggested_cluster_key"] = cluster_meta["cluster_key"]
        complaint["suggested_cluster_label"] = cluster_meta["cluster_label"]
        complaint["cluster_reason"] = cluster_meta["cluster_reason"]
        complaint["suggested_tags"] = cluster_meta["suggested_tags"]
        complaints.append(complaint)

        current_cluster = complaint.get("cluster_id") or cluster_meta["cluster_id"]
        cluster_counts[current_cluster] += 1

    summary_row = await db.fetchrow(
        """
        SELECT
            COUNT(*) FILTER (WHERE status = 'pending') AS pending_count,
            COUNT(*) FILTER (WHERE status = 'escalated') AS escalated_count,
            COUNT(*) FILTER (WHERE status = 'resolved') AS resolved_count
        FROM complaints
        """
    )

    return {
        "success": True,
        "complaints": complaints,
        "pagination": {
            "page": page,
            "limit": limit,
            "total": int(count_row["total"] or 0),
            "total_pages": max(1, ((int(count_row["total"] or 0) - 1) // limit) + 1),
        },
        "summary": {
            "pending": int(summary_row["pending_count"] or 0),
            "escalated": int(summary_row["escalated_count"] or 0),
            "resolved": int(summary_row["resolved_count"] or 0),
            "active_clusters": len(cluster_counts),
        },
    }


@app.put("/api/analytics/grievance-board/{complaint_id}")
async def update_grievance_board_item(
    complaint_id: int,
    payload: GrievanceUpdateRequest,
    _user=Depends(verify_advocate),
    db=Depends(get_db),
):
    if payload.status is None and payload.tags is None and payload.cluster_id is None:
        raise HTTPException(status_code=400, detail="At least one field must be updated")

    existing = await db.fetchrow("SELECT * FROM complaints WHERE id = $1", complaint_id)
    if not existing:
        raise HTTPException(status_code=404, detail="Complaint not found")

    updated = await db.fetchrow(
        """
        UPDATE complaints
        SET
            status = COALESCE($1, status),
            tags = COALESCE($2, tags),
            cluster_id = COALESCE($3, cluster_id),
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $4
        RETURNING *
        """,
        payload.status,
        payload.tags,
        payload.cluster_id,
        complaint_id,
    )

    complaint = dict(updated)
    complaint["created_at"] = complaint["created_at"].isoformat()
    complaint["updated_at"] = complaint["updated_at"].isoformat()
    complaint["tags"] = complaint.get("tags") or []
    complaint.update(build_cluster_metadata(complaint))

    return {"success": True, "complaint": complaint}


@app.get("/api/analytics/summary")
async def get_analytics_summary(_user=Depends(verify_advocate), db=Depends(get_db)):
    overview = await get_overview(_user, db)
    vulnerable = await get_vulnerable_workers(5, _user, db)
    commission = await get_commission_trends(_user, db)
    income = await get_income_distribution(_user, db)
    complaints = await get_top_complaints(_user, db)
    moderation = await get_grievance_board(1, 5, None, None, None, _user, db)

    return {
        "success": True,
        "overview": overview["overview"],
        "rising_platforms": overview["rising_platforms"],
        "vulnerable_workers": vulnerable["workers"],
        "commission_trends": commission["trends"],
        "income_distribution": income["distribution"],
        "complaints": complaints,
        "grievance_summary": moderation["summary"],
        "priority_complaints": moderation["complaints"],
    }


if __name__ == "__main__":
    import uvicorn

    port = int(os.getenv("PORT", 3005))
    uvicorn.run(app, host="0.0.0.0", port=port, reload=True)
