from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
from collections import defaultdict
import statistics
import os
from datetime import datetime

# Create FastAPI app
app = FastAPI(title="FairGig Anomaly Service")

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5000", "http://localhost:5173", "http://localhost:5174"],
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
    deductions: Optional[float] = None  # ADDED: Platform deductions/commission
    gross_earned: Optional[float] = None  # ADDED: Gross earnings before deductions

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
    commission_rate: Optional[float] = None  # ADDED: For deduction anomalies

class AnomalyResponse(BaseModel):
    user_id: int
    anomalies: List[Anomaly]
    summary: str
    has_anomalies: bool

# ============================================
# DEDUCTION/COMMISSION ANOMALY DETECTION
# ============================================

def detect_unusual_deductions(earnings: List[EarningsEntry]) -> List[Anomaly]:
    """
    Detect statistically unusual deductions/commission rates
    Compares each shift's commission rate against historical average
    """
    anomalies = []
    
    if len(earnings) < 3:
        return anomalies
    
    # Calculate commission rate for each shift (deductions / gross_earned)
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
    
    # For each shift, compare against previous shifts only (not future)
    for i, current in enumerate(commission_data):
        if i < 2:  # Need at least 2 previous shifts for baseline
            continue
        
        # Use only previous shifts for baseline (not including current)
        previous_rates = [c['rate'] for c in commission_data[:i]]
        
        if len(previous_rates) < 2:
            continue
        
        avg_rate = statistics.mean(previous_rates)
        std_dev = statistics.stdev(previous_rates) if len(previous_rates) > 1 else 5
        
        # Flag unusually high commission (above 2 standard deviations)
        if current['rate'] > avg_rate + (2 * std_dev):
            anomalies.append(Anomaly(
                date=current['date'].split('T')[0] if 'T' in current['date'] else current['date'],
                type="unusual_deductions",
                description=f"Platform deducted {current['rate']:.0f}% commission vs your average of {avg_rate:.0f}% (Rs.{int(current['deductions'])} deducted from Rs.{int(current['gross'])})",
                severity="high" if current['rate'] > avg_rate + (3 * std_dev) else "medium",
                platform=current['platform'],
                commission_rate=current['rate']
            ))
        
        # Flag unusually low commission (could be a good thing, but still notable)
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
    """
    Detect income drops by comparing each day's TOTAL earnings against 
    ONLY PREVIOUS days (not including current day in average)
    This prevents the current anomaly from skewing the baseline
    """
    anomalies = []
    
    if len(earnings) < 4:
        return anomalies
    
    # Step 1: Group earnings by date (sum all platforms on same day)
    daily_totals = defaultdict(float)
    daily_platforms = defaultdict(list)
    daily_deductions = defaultdict(float)  # Track total deductions per day
    
    for entry in earnings:
        date_key = entry.date.split('T')[0] if 'T' in entry.date else entry.date
        daily_totals[date_key] += entry.amount
        daily_deductions[date_key] += entry.deductions if entry.deductions else 0
        daily_platforms[date_key].append({
            'platform': entry.platform,
            'amount': entry.amount,
            'hours': entry.hours_worked,
            'deductions': entry.deductions
        })
    
    # Step 2: Sort dates chronologically
    sorted_dates = sorted(daily_totals.keys())
    
    if len(sorted_dates) < 4:
        return anomalies
    
    # Step 3: For each day, look at ONLY PREVIOUS days (not including current)
    for i, current_date in enumerate(sorted_dates):
        if i < 3:  # Need at least 3 days before to establish baseline
            continue
        
        # Get ONLY PREVIOUS days (exclude current)
        previous_dates = sorted_dates[:i]  # All dates before current
        
        if len(previous_dates) < 3:
            continue
        
        # Calculate average of previous days ONLY
        previous_amounts = [daily_totals[date] for date in previous_dates]
        avg_amount = statistics.mean(previous_amounts)
        std_dev = statistics.stdev(previous_amounts) if len(previous_amounts) > 1 else avg_amount * 0.2
        
        current_amount = daily_totals[current_date]
        
        # Calculate bounds using previous days only
        lower_bound = avg_amount - (2 * std_dev)
        upper_bound = avg_amount + (2 * std_dev)
        
        # Check for income drop (below lower bound)
        if current_amount < lower_bound:
            drop_percent = int((1 - current_amount / avg_amount) * 100)
            
            # Find which platform had the lowest earnings that day
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
        
        # Check for income spike (above upper bound)
        elif current_amount > upper_bound:
            spike_percent = int((current_amount / avg_amount - 1) * 100)
            
            # Find which platform had the highest earnings that day
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
    
    # Check volatility using rolling window of previous days
    for i in range(4, len(sorted_dates)):
        # Use only previous days for baseline
        previous_dates = sorted_dates[:i]
        
        if len(previous_dates) < 4:
            continue
        
        amounts = [daily_totals[date] for date in previous_dates[-7:]]  # Last 7 previous days
        
        if len(amounts) >= 3:
            changes = [abs(amounts[j] - amounts[j-1]) for j in range(1, len(amounts))]
            avg_change = statistics.mean(changes) if changes else 0
            avg_amount = statistics.mean(amounts)
            
            if avg_change > avg_amount * 0.7:
                anomalies.append(Anomaly(
                    date=sorted_dates[i-1],  # Most recent date in the window
                    type="high_volatility",
                    description=f"Your earnings have been unstable (average Rs.{int(avg_change)} change day-to-day over last {len(amounts)} days)",
                    severity="medium",
                    platform="Multiple",
                    daily_total=amounts[-1] if amounts else 0,
                    expected_range=f"±{int(avg_change)} PKR daily change"
                ))
                break  # Only report volatility once
    
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
            summary=f"Not enough data to detect anomalies (have {len(request.earnings)} shifts, need at least 3)",
            has_anomalies=False
        )
    
    all_anomalies = []
    
    # 1. Detect income drops using ONLY previous days (REQUIRED by spec)
    all_anomalies.extend(detect_income_drop_previous_days(request.earnings))
    
    # 2. Detect unusual deductions/commission rates (REQUIRED by spec)
    all_anomalies.extend(detect_unusual_deductions(request.earnings))
    
    # 3. Detect volatility (optional but helpful)
    all_anomalies.extend(detect_volatility_previous_days(request.earnings))
    
    # Remove duplicates based on date and type
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
        "description": "Detects unusual deductions/commissions and sudden income drops using ONLY previous days for baseline",
        "endpoints": {
            "POST /api/detect-anomalies": "Detect anomalies in earnings data",
            "GET /health": "Health check"
        }
    }

# ============================================
# RUN SERVER
# ============================================
if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 3003))
    uvicorn.run("app:app", host="0.0.0.0", port=port, reload=True)