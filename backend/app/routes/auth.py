from fastapi import APIRouter, Depends, HTTPException, Response, Cookie
from fastapi.security import HTTPBearer
from pydantic import BaseModel

from app.services.auth_services import (
    get_user_from_token,
    register_user,
    login_user,
    get_user_info,
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
def get_current_user(access_token: str | None = Cookie(default=None)):
    """Obtener usuario autenticado desde cookie"""
    if not access_token:
        raise HTTPException(status_code=401, detail="No token cookie found")

    user = get_user_from_token(access_token)
    return user


# --- Routes --- #
@router.get("/me", response_model=MeResponse)
def get_me(user=Depends(get_current_user)):
    """Obtener información del usuario autenticado"""
    return {"message": "Usuario autenticado", "user": get_user_info(user)}


@router.post("/register")
def register(request: RegisterRequest):
    """Registro de nuevo usuario"""
    user = register_user(
        email=request.email,
        password=request.password,
        full_name=request.full_name,
        role=request.role,
    )
    return {"message": "Usuario creado correctamente", "user_id": user.id}


@router.post("/login")
def login(request: LoginRequest, response: Response):
    """Login de usuario y creación de cookie de sesión"""
    token = login_user(email=request.email, password=request.password)

    response.set_cookie(
        key="access_token",
        value=token,
        httponly=True,
        max_age=60 * 60 * 24 * 7,
        secure=False,
        samesite="lax",
    )

    return {"message": "Login exitoso"}


@router.post("/logout")
def logout(response: Response, user=Depends(get_current_user)):
    """Cerrar sesión eliminando cookie"""
    response.delete_cookie(key="access_token")
    return {"message": "Sesión cerrada"}
