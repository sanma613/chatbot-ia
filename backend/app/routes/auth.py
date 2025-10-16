from typing import Any, Dict, Optional

from fastapi import APIRouter, Cookie, Depends, HTTPException, Response
from fastapi.security import HTTPBearer
from pydantic import BaseModel

from app.services.auth_services import (
    get_user_from_token,
    get_user_info,
    login_user,
    register_user,
)

router = APIRouter()
security = HTTPBearer()


# --- Responses / Requests --- #
class MeResponse(BaseModel):
    message: str
    user: dict


class RegisterRequest(BaseModel):
    email: str
    password: str
    full_name: str
    role: str = "user"


class LoginRequest(BaseModel):
    email: str
    password: str


# --- Dependencias --- #
def get_current_user(access_token: Optional[str] = Cookie(default=None)) -> Any:
    """Obtener usuario autenticado desde cookie"""
    if not access_token:
        raise HTTPException(status_code=401, detail="No token cookie found")

    user = get_user_from_token(access_token)
    return user


async def get_current_user_ws(token: Optional[str] = None) -> Any:
    """Obtener usuario autenticado para WebSocket (token opcional)"""
    if not token:
        # WebSocket sin autenticación - permitir conexión anónima por ahora
        # En producción, considera requerir autenticación
        return None

    try:
        user = get_user_from_token(token)
        return user
    except Exception:
        # Si el token es inválido, permitir conexión anónima
        return None


# --- Routes --- #
@router.get("/me", response_model=MeResponse)
def get_me(user: Any = Depends(get_current_user)) -> Dict[str, Any]:
    """Obtener información del usuario autenticado"""
    return {"message": "Usuario autenticado", "user": get_user_info(user)}


@router.post("/register")
def register(request: RegisterRequest) -> Dict[str, Any]:
    """Registro de nuevo usuario"""
    user = register_user(
        email=request.email,
        password=request.password,
        full_name=request.full_name,
        role=request.role,
    )
    return {"message": "Usuario creado correctamente", "user_id": user.id}


@router.post("/login")
def login(request: LoginRequest, response: Response) -> Dict[str, str]:
    """Login de usuario y creación de cookie de sesión"""
    token = login_user(email=request.email, password=request.password)

    response.set_cookie(
        key="access_token",
        value=token,
        httponly=True,
        max_age=60 * 60 * 24 * 7,
        secure=True,
        samesite="none",
    )

    return {"message": "Login exitoso"}


@router.post("/logout")
def logout(response: Response, user: Any = Depends(get_current_user)) -> Dict[str, str]:
    """Cerrar sesión eliminando cookie"""
    response.delete_cookie(
        key="access_token",
        value=token,
        httponly=True,
        max_age=60 * 60 * 24 * 7,
        secure=True,
        samesite="none",
        path='/',
    )
    return {"message": "Sesión cerrada"}

