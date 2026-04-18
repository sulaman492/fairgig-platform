# server/anomalyService/app.py
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import statistics
import os

# Create FastAPI app
app = FastAPI(title="FairGig Anomaly Service")

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================
# REQUEST/RESPONSE MODELS
# ============================================

class EarningsEntry(BaseModel):
    date: str
    amount: float
    hours_worked: Optional[float] = None
    platform: Optional[str] = None

class AnomalyRequest(BaseModel):
    user_id: int
    earnings: List[EarningsEntry]

class Anomaly(BaseModel):
    date: str
    type: str
    description: str
    severity: str

class AnomalyResponse(BaseModel):
    user_id: int
    anomalies: List[Anomaly]
    summary: str
    has_anomalies: bool

# ============================================
# ANOMALY DETECTION LOGIC
# ============================================

def detect_income_drop(earnings: List[EarningsEntry]) -> List[Anomaly]:
    """Detect sudden drops in income (30% below average)"""
    anomalies = []
    
    if len(earnings) < 7:
        return anomalies
    
    amounts = [e.amount for e in earnings[-7:]]
    avg = statistics.mean(amounts)
    
    for entry in earnings[-7:]:
        if entry.amount < avg * 0.7:
            drop_percent = int((1 - entry.amount / avg) * 100)
            anomalies.append(Anomaly(
                date=entry.date,
                type="income_drop",
                description=f"Income dropped {drop_percent}% below your 7-day average of Rs.{int(avg)}",
                severity="high" if drop_percent > 40 else "medium"
            ))
    
    return anomalies

def detect_volatility(earnings: List[EarningsEntry]) -> List[Anomaly]:
    """Detect unstable income patterns"""
    anomalies = []
    
    if len(earnings) < 14:
        return anomalies
    
    amounts = [e.amount for e in earnings[-14:]]
    
    if len(amounts) >= 2:
        changes = [abs(amounts[i] - amounts[i-1]) for i in range(1, len(amounts))]
        avg_change = statistics.mean(changes) if changes else 0
        avg_earning = statistics.mean(amounts)
        
        if avg_change > avg_earning * 0.5:
            anomalies.append(Anomaly(
                date=earnings[-1].date,
                type="high_volatility",
                description=f"Your daily earnings vary significantly (average Rs.{int(avg_change)} change day-to-day)",
                severity="medium"
            ))
    
    return anomalies

# ============================================
# API ENDPOINTS
# ============================================

@app.post("/api/detect-anomalies", response_model=AnomalyResponse)
async def detect_anomalies(request: AnomalyRequest):
    if not request.earnings:
        raise HTTPException(status_code=400, detail="Earnings data is required")
    
    if len(request.earnings) < 3:
        return AnomalyResponse(
            user_id=request.user_id,
            anomalies=[],
            summary="Not enough data to detect anomalies (minimum 3 days required)",
            has_anomalies=False
        )
    
    all_anomalies = []
    all_anomalies.extend(detect_income_drop(request.earnings))
    all_anomalies.extend(detect_volatility(request.earnings))
    
    if all_anomalies:
        high_count = sum(1 for a in all_anomalies if a.severity == "high")
        summary = f"Found {len(all_anomalies)} anomaly(ies)"
        if high_count > 0:
            summary += f", including {high_count} high-severity issue(s)"
    else:
        summary = "No anomalies detected. Your earnings pattern looks normal."
    
    return AnomalyResponse(
        user_id=request.user_id,
        anomalies=all_anomalies,
        summary=summary,
        has_anomalies=len(all_anomalies) > 0
    )

@app.get("/health")
async def health():
    return {"status": "OK", "service": "anomaly-service"}

@app.get("/")
async def root():
    return {
        "service": "FairGig Anomaly Detection Service",
        "version": "1.0",
        "endpoints": {
            "POST /api/detect-anomalies": "Detect anomalies in earnings data",
            "GET /health": "Health check"
        }
    }