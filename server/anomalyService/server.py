# server/anomalyService/server.py
import uvicorn
import os
from dotenv import load_dotenv

load_dotenv()

if __name__ == "__main__":
    port = int(os.getenv("PORT", 3003))
    uvicorn.run("app:app", host="0.0.0.0", port=port, reload=True)