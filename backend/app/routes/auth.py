from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.core.config import supabase_

router = APIRouter()
security = HTTPBearer()


@router.get("/protected")
async def protected_route(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> dict:
    token = credentials.credentials
    try:
        user = supabase_.auth.get_user(token)
        if user is None or user.user is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        return {"message": "Access granted", "user": user.user}
    except Exception as e:
        raise HTTPException(status_code=401, detail="Invalid token") from e
