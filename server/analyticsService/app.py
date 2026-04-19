# server/analytics-service/app.py
from fastapi import FastAPI, HTTPException, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import asyncpg
import os
import httpx
from datetime import datetime, timedelta
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(
    title="FairGig Analytics Service",
    description="Analytics and insights for Advocate Dashboard",
    version="1.0.0"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DATABASE_URL = os.getenv("DATABASE_URL")
AUTH_SERVICE_URL = os.getenv("AUTH_SERVICE_URL", "http://localhost:3001")

# ============================================
# DATABASE CONNECTION
# ============================================

async def get_db():
    """Get database connection"""
    conn = await asyncpg.connect(DATABASE_URL)
    try:
        yield conn
    finally:
        await conn.close()

# ============================================
# AUTHENTICATION
# ============================================

async def verify_advocate(request: Request):
    """Verify user is authenticated and has advocate role"""
    cookies = request.headers.get("cookie", "")
    
    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"{AUTH_SERVICE_URL}/api/auth/verify",
            headers={"Cookie": cookies},
            timeout=10.0
        )
    
    if response.status_code != 200:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    data = response.json()
    user = data.get("user")
    
    if not user:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    if user.get("role") != "advocate":
        raise HTTPException(status_code=403, detail="Advocate role required")
    
    return user

# ============================================
# RESPONSE MODELS
# ============================================

class CommissionTrend(BaseModel):
    platform: str
    avg_commission: float
    change: float
    trend: str  # 'up', 'down', 'stable'

class IncomeDistribution(BaseModel):
    city: str
    avg_hourly_rate: float
    worker_count: int
    total_earnings: float

class VulnerableWorker(BaseModel):
    user_id: int
    name: str
    email: str
    city: str
    income_drop: float
    current_weekly_avg: float
    previous_weekly_avg: float

class TopComplaint(BaseModel):
    category: str
    count: int
    percentage: float

# ============================================
# HEALTH CHECK
# ============================================

@app.get("/health")
async def health():
    return {"status": "OK", "service": "analytics-service", "version": "1.0.0"}

@app.get("/")
async def root():
    return {
        "service": "FairGig Analytics Service",
        "endpoints": {
            "GET /health": "Health check",
            "GET /api/analytics/commission-trends": "Commission trends by platform",
            "GET /api/analytics/income-distribution": "Income distribution by city",
            "GET /api/analytics/vulnerable-workers": "Workers with >20% income drop",
            "GET /api/analytics/top-complaints": "Top complaint categories",
            "GET /api/analytics/summary": "Complete analytics summary"
        }
    }

# ============================================
# ANALYTICS ENDPOINTS
# ============================================

@app.get("/api/analytics/commission-trends", response_model=List[CommissionTrend])
async def get_commission_trends(
    user=Depends(verify_advocate), 
    db=Depends(get_db)
):
    """Get commission trends across platforms (last 7 days vs previous 7 days)"""
    
    # Current period (last 7 days)
    current = await db.fetch("""
        SELECT 
            platform,
            AVG(platform_deductions / NULLIF(gross_earned, 0) * 100) as avg_commission
        FROM shifts
        WHERE shift_date >= NOW() - INTERVAL '7 days'
            AND verification_status = 'confirmed'
            AND gross_earned > 0
        GROUP BY platform
    """)
    
    # Previous period (7-14 days ago)
    previous = await db.fetch("""
        SELECT 
            platform,
            AVG(platform_deductions / NULLIF(gross_earned, 0) * 100) as avg_commission
        FROM shifts
        WHERE shift_date BETWEEN NOW() - INTERVAL '14 days' AND NOW() - INTERVAL '7 days'
            AND verification_status = 'confirmed'
            AND gross_earned > 0
        GROUP BY platform
    """)
    
    prev_dict = {p['platform']: p['avg_commission'] for p in previous}
    
    trends = []
    for curr in current:
        prev = prev_dict.get(curr['platform'], curr['avg_commission'])
        change = ((curr['avg_commission'] - prev) / prev * 100) if prev > 0 else 0
        
        trends.append(CommissionTrend(
            platform=curr['platform'],
            avg_commission=round(curr['avg_commission'], 1),
            change=round(abs(change), 1),
            trend="up" if change > 0 else "down" if change < 0 else "stable"
        ))
    
    return trends

@app.get("/api/analytics/income-distribution")
async def get_income_distribution(
    user=Depends(verify_advocate), 
    db=Depends(get_db)
):
    """Get income distribution by city (last 30 days)"""
    
    result = await db.fetch("""
        SELECT 
            u.city,
            AVG(s.net_received / NULLIF(s.hours_worked, 0)) as avg_hourly_rate,
            COUNT(DISTINCT s.user_id) as worker_count,
            SUM(s.net_received) as total_earnings
        FROM shifts s
        JOIN users u ON s.user_id = u.id
        WHERE s.verification_status = 'confirmed'
            AND u.city IS NOT NULL
            AND u.city != ''
            AND s.shift_date >= NOW() - INTERVAL '30 days'
        GROUP BY u.city
        ORDER BY avg_hourly_rate DESC
    """)
    
    distribution = []
    for r in result:
        distribution.append({
            "city": r['city'],
            "avg_hourly_rate": round(r['avg_hourly_rate'], 2),
            "worker_count": r['worker_count'],
            "total_earnings": float(r['total_earnings'])
        })
    
    return {"success": True, "distribution": distribution}

@app.get("/api/analytics/vulnerable-workers")
async def get_vulnerable_workers(
    user=Depends(verify_advocate), 
    db=Depends(get_db)
):
    """Get workers with >20% income drop month-over-month"""
    
    result = await db.fetch("""
        WITH current_week AS (
            SELECT 
                user_id,
                SUM(net_received) as current_earnings,
                COUNT(*) as shift_count
            FROM shifts
            WHERE shift_date >= NOW() - INTERVAL '7 days'
                AND verification_status = 'confirmed'
            GROUP BY user_id
        ),
        previous_week AS (
            SELECT 
                user_id,
                SUM(net_received) as previous_earnings,
                COUNT(*) as shift_count
            FROM shifts
            WHERE shift_date BETWEEN NOW() - INTERVAL '14 days' AND NOW() - INTERVAL '7 days'
                AND verification_status = 'confirmed'
            GROUP BY user_id
        )
        SELECT 
            u.id as user_id,
            u.name,
            u.email,
            u.city,
            COALESCE(c.current_earnings, 0) as current_earnings,
            COALESCE(p.previous_earnings, 0) as previous_earnings,
            COALESCE(c.shift_count, 0) as current_shifts,
            COALESCE(p.shift_count, 0) as previous_shifts
        FROM users u
        LEFT JOIN current_week c ON u.id = c.user_id
        LEFT JOIN previous_week p ON u.id = p.user_id
        WHERE u.role = 'worker'
            AND COALESCE(p.previous_earnings, 0) > 0
            AND ((p.previous_earnings - COALESCE(c.current_earnings, 0)) / p.previous_earnings * 100) > 20
        ORDER BY ((p.previous_earnings - COALESCE(c.current_earnings, 0)) / p.previous_earnings * 100) DESC
    """)
    
    workers = []
    for r in result:
        drop_percent = ((r['previous_earnings'] - r['current_earnings']) / r['previous_earnings'] * 100) if r['previous_earnings'] > 0 else 0
        workers.append({
            "user_id": r['user_id'],
            "name": r['name'],
            "email": r['email'],
            "city": r['city'] or 'Unknown',
            "income_drop": round(drop_percent, 1),
            "current_weekly_avg": round(r['current_earnings'] / 7, 2) if r['current_earnings'] > 0 else 0,
            "previous_weekly_avg": round(r['previous_earnings'] / 7, 2) if r['previous_earnings'] > 0 else 0
        })
    
    return {"success": True, "workers": workers}

@app.get("/api/analytics/top-complaints")
async def get_top_complaints(
    user=Depends(verify_advocate), 
    db=Depends(get_db)
):
    """Get top complaint categories for the week"""
    
    result = await db.fetch("""
        SELECT 
            category,
            COUNT(*) as count,
            ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 1) as percentage
        FROM complaints
        WHERE created_at >= NOW() - INTERVAL '7 days'
        GROUP BY category
        ORDER BY count DESC
        LIMIT 5
    """)
    
    complaints = []
    for r in result:
        complaints.append({
            "category": r['category'] or "Uncategorized",
            "count": r['count'],
            "percentage": float(r['percentage'])
        })
    
    return {"success": True, "top_complaints": complaints}

@app.get("/api/analytics/summary")
async def get_analytics_summary(
    user=Depends(verify_advocate), 
    db=Depends(get_db)
):
    """Get complete analytics summary for advocate dashboard"""
    
    # Get all data in parallel
    trends = await get_commission_trends(user, db)
    income = await get_income_distribution(user, db)
    vulnerable = await get_vulnerable_workers(user, db)
    complaints = await get_top_complaints(user, db)
    
    return {
        "success": True,
        "commission_trends": trends,
        "income_distribution": income.get("distribution", []),
        "vulnerable_workers": vulnerable.get("workers", []),
        "top_complaints": complaints.get("top_complaints", [])
    }

# ============================================
# RUN SERVER
# ============================================

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 3005))
    uvicorn.run(app, host="0.0.0.0", port=port, reload=True)
