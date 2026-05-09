import jwt
import os
from fastapi import HTTPException, Request
from dotenv import load_dotenv

load_dotenv()

"""
Auth Middleware - Verifies JWT tokens
Similar to: export const authenticate = (req, res, next) => { ... }
"""

ACCESS_SECRET = os.getenv("ACCESS_SECRET")

if not ACCESS_SECRET:
    raise RuntimeError("ACCESS_SECRET must be set in .env")

def verify_advocate(request: Request):
    """
    Verify JWT token and check if user has advocate role
    Like: requireRole(['advocate']) in Node.js
    """
    token = None
    
    # Try to get token from cookie (like req.cookies.accessToken)
    cookies = request.headers.get("cookie", "")
    if cookies:
        for part in cookies.split(";"):
            part = part.strip()
            if part.startswith("accessToken="):
                token = part.split("=", 1)[1]
                break
    
    # Try to get token from Authorization header (like req.headers.authorization)
    if not token:
        auth_header = request.headers.get("authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header[7:]
    
    if not token:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    try:
        # Verify JWT (like jwt.verify(token, ACCESS_SECRET))
        payload = jwt.decode(token, ACCESS_SECRET, algorithms=["HS256"])
        
        # Check role (like requireRole middleware)
        if payload.get("role") != "advocate":
            raise HTTPException(status_code=403, detail="Advocate role required")
        
        # Return user info (like req.user)
        return payload
        
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError as e:
        raise HTTPException(status_code=401, detail=f"Invalid token: {str(e)}")