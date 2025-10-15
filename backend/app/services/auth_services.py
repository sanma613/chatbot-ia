from typing import Any, Dict

from fastapi import HTTPException

from app.core.config import supabase_


def get_user_from_token(token: str) -> Any:
    """Obtener usuario desde token JWT"""
    try:
        user_response = supabase_.auth.get_user(token)
        if not user_response or not user_response.user:
            raise HTTPException(status_code=401, detail="Token inválido")
        return user_response.user
    except Exception as e:
        raise HTTPException(status_code=401, detail="Token inválido") from e


def register_user(email: str, password: str, full_name: str, role: str = "user") -> Any:
    """Registrar nuevo usuario en Supabase"""
    try:
        # Incluir el nombre en user_metadata para que esté disponible en auth
        response = supabase_.auth.sign_up(
            {
                "email": email,
                "password": password,
                "options": {"data": {"name": full_name, "full_name": full_name}},
            }
        )

        if response.user is None:
            raise HTTPException(status_code=400, detail="Error creando usuario")

        user_id = response.user.id
        supabase_.table("profiles").insert(
            {"id": user_id, "full_name": full_name, "role": role}
        ).execute()

        return response.user
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error en registro: {str(e)}")


def login_user(email: str, password: str) -> str:
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


def get_user_info(user: Any) -> Dict[str, Any]:
    """Obtener información del usuario desde la tabla profiles"""
    import time
    from httpx import ReadError, ConnectError, TimeoutException

    user_id = user.id

    # Retry logic para manejar errores de conexión HTTP/2
    max_retries = 3
    retry_delay = 0.5  # segundos

    for attempt in range(max_retries):
        try:
            profile = (
                supabase_.table("profiles")
                .select("*")
                .eq("id", user_id)
                .single()
                .execute()
            )

            if not profile.data:
                raise HTTPException(status_code=404, detail="Usuario no encontrado")

            user_data = user.model_dump()
            response = {**user_data, **profile.data}
            return response

        except (ReadError, ConnectError, TimeoutException) as e:
            if attempt < max_retries - 1:
                print(
                    f"⚠️ Connection error in get_user_info (attempt {attempt + 1}/{max_retries}): {e}"
                )
                time.sleep(retry_delay * (attempt + 1))  # Exponential backoff
                continue
            else:
                print(f"❌ Failed to get user info after {max_retries} attempts: {e}")
                raise HTTPException(
                    status_code=503,
                    detail="Error de conexión con la base de datos. Por favor, intente nuevamente.",
                )
        except Exception as e:
            # Otros errores no son reintentos
            print(f"❌ Unexpected error in get_user_info: {e}")
            raise
