# server/anomalyService/app.py
from fastapi import FastAPI, HTTPException, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict
from collections import defaultdict
import statistics
import os
import jwt
from datetime import datetime

# ============================================
# CREATE FASTAPI APP
# ============================================

app = FastAPI(title="FairGig Anomaly Service")

# ============================================
# ENVIRONMENT VALIDATION
# ============================================

JWT_SECRET = os.getenv('ACCESS_SECRET')
if not JWT_SECRET:
    print("❌ FATAL: ACCESS_SECRET environment variable not set")
    print("   Please set ACCESS_SECRET in Render environment variables")
    exit(1)

API_GATEWAY_URL = os.getenv('API_GATEWAY_URL', 'http://localhost:5000')
print(f"✅ Anomaly Service Configuration:")
print(f"   API Gateway URL: {API_GATEWAY_URL}")
print(f"   JWT Secret: {'✓ Set' if JWT_SECRET else '✗ Missing'}")

# ============================================
# CORS - ONLY ALLOW API GATEWAY
# ============================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=[API_GATEWAY_URL, "http://localhost:5000"],  # API Gateway only
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
    deductions: Optional[float] = None
    gross_earned: Optional[float] = None

class AnomalyRequest(BaseModel):
    user_id: int
    earnings: List[EarningsEntry]

class Anomaly(BaseModel):
    date: str
    type: str
    description: str
    severity: str
    platform: Optional[str] = None
    daily_total: Optional[float] = None
    expected_range: Optional[str] = None
    commission_rate: Optional[float] = None

class AnomalyResponse(BaseModel):
    user_id: int
    anomalies: List[Anomaly]
    summary: str
    has_anomalies: bool

# ============================================
# JWT AUTHENTICATION - INDEPENDENT! NO CALL TO AUTH SERVICE!
# ============================================

def verify_jwt_token(authorization: Optional[str] = Header(None)) -> Dict:
    """
    Verify JWT token locally using ACCESS_SECRET.
    This service does NOT call the Auth Service - it verifies independently!
    """
    if not authorization:
        raise HTTPException(status_code=401, detail="Authorization header required")
    
    try:
        # Extract token from "Bearer <token>"
        parts = authorization.split()
        if len(parts) != 2:
            raise HTTPException(status_code=401, detail="Invalid authorization header format")
        
        scheme, token = parts
        if scheme.lower() != 'bearer':
            raise HTTPException(status_code=401, detail="Invalid authorization scheme")
        
        # Decode and verify JWT locally - NO NETWORK CALL!
        payload = jwt.decode(token, JWT_SECRET, algorithms=['HS256'])
        return payload
        
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError as e:
        raise HTTPException(status_code=401, detail=f"Invalid token: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Authentication failed: {str(e)}")

# ============================================
# DEDUCTION/COMMISSION ANOMALY DETECTION
# ============================================

def detect_unusual_deductions(earnings: List[EarningsEntry]) -> List[Anomaly]:
    """Detect statistically unusual deductions/commission rates"""
    anomalies = []
    
    if len(earnings) < 3:
        return anomalies
    
    # Calculate commission rate for each shift
    commission_data = []
    for entry in earnings:
        if entry.gross_earned and entry.gross_earned > 0:
            rate = (entry.deductions / entry.gross_earned) * 100 if entry.deductions else 0
            commission_data.append({
                'date': entry.date,
                'platform': entry.platform,
                'rate': rate,
                'deductions': entry.deductions,
                'gross': entry.gross_earned,
                'amount': entry.amount
            })
    
    if len(commission_data) < 3:
        return anomalies
    
    # Sort by date
    commission_data.sort(key=lambda x: x['date'])
    
    # For each shift, compare against previous shifts only
    for i, current in enumerate(commission_data):
        if i < 2:
            continue
        
        previous_rates = [c['rate'] for c in commission_data[:i]]
        
        if len(previous_rates) < 2:
            continue
        
        avg_rate = statistics.mean(previous_rates)
        std_dev = statistics.stdev(previous_rates) if len(previous_rates) > 1 else 5
        
        # Flag unusually high commission
        if current['rate'] > avg_rate + (2 * std_dev):
            anomalies.append(Anomaly(
                date=current['date'].split('T')[0] if 'T' in current['date'] else current['date'],
                type="unusual_deductions",
                description=f"Platform deducted {current['rate']:.0f}% commission vs your average of {avg_rate:.0f}% (Rs.{int(current['deductions'])} deducted from Rs.{int(current['gross'])})",
                severity="high" if current['rate'] > avg_rate + (3 * std_dev) else "medium",
                platform=current['platform'],
                commission_rate=current['rate']
            ))
        
        # Flag unusually low commission
        elif current['rate'] < avg_rate - (1.5 * std_dev):
            anomalies.append(Anomaly(
                date=current['date'].split('T')[0] if 'T' in current['date'] else current['date'],
                type="low_deductions",
                description=f"Platform deducted only {current['rate']:.0f}% commission vs your average of {avg_rate:.0f}% (Good day!)",
                severity="low",
                platform=current['platform'],
                commission_rate=current['rate']
            ))
    
    return anomalies

# ============================================
# INCOME DROP DETECTION - PREVIOUS DAYS ONLY
# ============================================

def detect_income_drop_previous_days(earnings: List[EarningsEntry]) -> List[Anomaly]:
    """Detect income drops using ONLY previous days for baseline"""
    anomalies = []
    
    if len(earnings) < 4:
        return anomalies
    
    # Group earnings by date
    daily_totals = defaultdict(float)
    daily_platforms = defaultdict(list)
    
    for entry in earnings:
        date_key = entry.date.split('T')[0] if 'T' in entry.date else entry.date
        daily_totals[date_key] += entry.amount
        daily_platforms[date_key].append({
            'platform': entry.platform,
            'amount': entry.amount,
            'hours': entry.hours_worked
        })
    
    sorted_dates = sorted(daily_totals.keys())
    
    if len(sorted_dates) < 4:
        return anomalies
    
    # For each day, look at ONLY PREVIOUS days
    for i, current_date in enumerate(sorted_dates):
        if i < 3:
            continue
        
        previous_dates = sorted_dates[:i]
        
        if len(previous_dates) < 3:
            continue
        
        previous_amounts = [daily_totals[date] for date in previous_dates]
        avg_amount = statistics.mean(previous_amounts)
        std_dev = statistics.stdev(previous_amounts) if len(previous_amounts) > 1 else avg_amount * 0.2
        
        current_amount = daily_totals[current_date]
        lower_bound = avg_amount - (2 * std_dev)
        upper_bound = avg_amount + (2 * std_dev)
        
        # Check for income drop
        if current_amount < lower_bound:
            drop_percent = int((1 - current_amount / avg_amount) * 100)
            
            low_platforms = [p for p in daily_platforms[current_date] if p['amount'] < avg_amount / len(daily_platforms[current_date])]
            primary_platform = low_platforms[0]['platform'] if low_platforms else daily_platforms[current_date][0]['platform']
            
            anomalies.append(Anomaly(
                date=current_date,
                type="income_drop",
                description=f"Income dropped {drop_percent}% below your {min(len(previous_dates), 7)}-day average of Rs.{int(avg_amount)}",
                severity="high" if drop_percent > 40 else "medium",
                platform=primary_platform,
                daily_total=current_amount,
                expected_range=f"Rs.{int(lower_bound)} - Rs.{int(upper_bound)}"
            ))
        
        # Check for income spike
        elif current_amount > upper_bound:
            spike_percent = int((current_amount / avg_amount - 1) * 100)
            
            high_platforms = [p for p in daily_platforms[current_date] if p['amount'] > avg_amount / len(daily_platforms[current_date])]
            primary_platform = high_platforms[0]['platform'] if high_platforms else daily_platforms[current_date][0]['platform']
            
            anomalies.append(Anomaly(
                date=current_date,
                type="income_spike",
                description=f"Unusually high earnings: {spike_percent}% above your {min(len(previous_dates), 7)}-day average of Rs.{int(avg_amount)}",
                severity="medium",
                platform=primary_platform,
                daily_total=current_amount,
                expected_range=f"Rs.{int(lower_bound)} - Rs.{int(upper_bound)}"
            ))
    
    return anomalies

def detect_volatility_previous_days(earnings: List[EarningsEntry]) -> List[Anomaly]:
    """Detect high volatility using only previous days for baseline"""
    anomalies = []
    
    if len(earnings) < 5:
        return anomalies
    
    # Group by date
    daily_totals = defaultdict(float)
    for entry in earnings:
        date_key = entry.date.split('T')[0] if 'T' in entry.date else entry.date
        daily_totals[date_key] += entry.amount
    
    sorted_dates = sorted(daily_totals.keys())
    
    if len(sorted_dates) < 4:
        return anomalies
    
    # Check volatility
    for i in range(4, len(sorted_dates)):
        previous_dates = sorted_dates[:i]
        
        if len(previous_dates) < 4:
            continue
        
        amounts = [daily_totals[date] for date in previous_dates[-7:]]
        
        if len(amounts) >= 3:
            changes = [abs(amounts[j] - amounts[j-1]) for j in range(1, len(amounts))]
            avg_change = statistics.mean(changes) if changes else 0
            avg_amount = statistics.mean(amounts)
            
            if avg_change > avg_amount * 0.7:
                anomalies.append(Anomaly(
                    date=sorted_dates[i-1],
                    type="high_volatility",
                    description=f"Your earnings have been unstable (average Rs.{int(avg_change)} change day-to-day over last {len(amounts)} days)",
                    severity="medium",
                    platform="Multiple",
                    daily_total=amounts[-1] if amounts else 0,
                    expected_range=f"±{int(avg_change)} PKR daily change"
                ))
                break
    
    return anomalies

# ============================================
# API ENDPOINTS
# ============================================

@app.post("/api/detect-anomalies", response_model=AnomalyResponse)
async def detect_anomalies(
    request: AnomalyRequest,
    user_payload: Dict = Depends(verify_jwt_token)
):
    """Detect anomalies in earnings data. Requires valid JWT token."""
    
    # Verify user_id matches token
    if request.user_id != user_payload.get('id'):
        raise HTTPException(status_code=403, detail="User ID mismatch")
    
    if not request.earnings:
        raise HTTPException(status_code=400, detail="Earnings data is required")
    
    if len(request.earnings) < 3:
        return AnomalyResponse(
            user_id=request.user_id,
            anomalies=[],
            summary=f"Not enough data (have {len(request.earnings)} shifts, need at least 3)",
            has_anomalies=False
        )
    
    all_anomalies = []
    all_anomalies.extend(detect_income_drop_previous_days(request.earnings))
    all_anomalies.extend(detect_unusual_deductions(request.earnings))
    all_anomalies.extend(detect_volatility_previous_days(request.earnings))
    
    # Remove duplicates
    unique_anomalies = []
    seen = set()
    for anomaly in all_anomalies:
        key = f"{anomaly.date}_{anomaly.type}"
        if key not in seen:
            seen.add(key)
            unique_anomalies.append(anomaly)
    
    if unique_anomalies:
        high_count = sum(1 for a in unique_anomalies if a.severity == "high")
        summary = f"Found {len(unique_anomalies)} anomaly(ies)"
        if high_count > 0:
            summary += f", including {high_count} high-severity issue(s)"
    else:
        summary = "No anomalies detected. Your earnings pattern looks normal."
    
    return AnomalyResponse(
        user_id=request.user_id,
        anomalies=unique_anomalies,
        summary=summary,
        has_anomalies=len(unique_anomalies) > 0
    )

@app.get("/health")
async def health():
    return {"status": "OK", "service": "anomaly-service"}

@app.get("/")
async def root():
    return {
        "service": "FairGig Anomaly Detection Service",
        "version": "2.1",
        "description": "Detects unusual deductions and sudden income drops",
        "authentication": "JWT required (Bearer token)",
        "endpoints": {
            "POST /api/detect-anomalies": "Detect anomalies (requires JWT)",
            "GET /health": "Health check"
        }
    }