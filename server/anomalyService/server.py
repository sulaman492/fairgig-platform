# server/anomalyService/server.py
import uvicorn
import os

# ============================================
# PRODUCTION SERVER - NO DOTENV!
# Render injects environment variables directly
# ============================================

# Get port from environment (Render provides this)
PORT = int(os.getenv("PORT", 3003))

# Check if running in development
ENV = os.getenv("ENV", "production")
RELOAD = ENV == "development"

print(f"🚀 Starting Anomaly Service...")
print(f"   Environment: {ENV}")
print(f"   Port: {PORT}")
print(f"   Reload: {RELOAD}")

if __name__ == "__main__":
    uvicorn.run(
        "app:app",
        host="0.0.0.0",
        port=PORT,
        reload=RELOAD,
        log_level="info"
    )