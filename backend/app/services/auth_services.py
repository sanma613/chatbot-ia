from fastapi import HTTPException
from app.core.config import supabase_


def get_user_from_token(token: str):
    """Obtener usuario desde token JWT"""
    try:
        user_response = supabase_.auth.get_user(token)
        if not user_response or not user_response.user:
            raise HTTPException(status_code=401, detail="Token inválido")
        return user_response.user
    except Exception as e:
        raise HTTPException(status_code=401, detail="Token inválido") from e


def register_user(email: str, password: str, full_name: str, role: str = "user"):
    """Registrar nuevo usuario en Supabase"""
    try:
        response = supabase_.auth.sign_up({"email": email, "password": password})

        if response.user is None:
            raise HTTPException(status_code=400, detail="Error creando usuario")

        user_id = response.user.id
        supabase_.table("profiles").insert(
            {"id": user_id, "full_name": full_name, "role": role}
        ).execute()

        return response.user
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error en registro: {str(e)}")


def login_user(email: str, password: str):
    """Autenticar usuario y retornar access token"""
    try:
        result = supabase_.auth.sign_in_with_password(
            {"email": email, "password": password}
        )

        if result.session is None:
            raise HTTPException(status_code=400, detail="Credenciales inválidas")

        return result.session.access_token
    except Exception as e:
        error_msg = str(e)
        if "Invalid login credentials" in error_msg:
            raise HTTPException(
                status_code=401, detail="Email o contraseña incorrectos"
            )
        raise HTTPException(status_code=400, detail=f"Error en login: {error_msg}")
