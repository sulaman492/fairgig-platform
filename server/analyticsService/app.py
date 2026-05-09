from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from src.routes.analytics import router

import os
from dotenv import load_dotenv

load_dotenv()

"""
Main App - Entry point for Analytics Service
Similar to: const app = express(); app.use('/api', routes);
"""

app = FastAPI(
    title="FairGig Analytics Service",
    description="Analytics and moderation tooling for the advocate dashboard",
    version="2.0.0",
)

# CORS - Allow API Gateway only
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include all routes
app.include_router(router)

@app.get("/health")
async def health():
    return {"status": "OK", "service": "analytics-service", "version": "2.0.0"}

@app.get("/")
async def root():
    return {
        "service": "FairGig Analytics Service",
        "endpoints": {
            "GET /health": "Health check",
            "GET /api/analytics/overview": "Advocate overview metrics",
            "GET /api/analytics/vulnerable-workers": "Workers with 30-day income drops",
            "GET /api/analytics/commission-trends": "Weekly commission trends",
            "GET /api/analytics/income-distribution": "Income distribution by city",
            "GET /api/analytics/top-complaints": "Complaint intelligence",
            "GET /api/analytics/grievance-board": "Moderation queue",
            "PUT /api/analytics/grievance-board/{complaint_id}": "Update complaint",
            "GET /api/analytics/summary": "Complete dashboard payload",
        },
    }

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 3005))
    uvicorn.run(app, host="0.0.0.0", port=port, reload=True)