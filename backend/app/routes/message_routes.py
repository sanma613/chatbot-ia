"""
Router para manejo de mensajes con imágenes
"""

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from typing import Optional, Any, Dict
import uuid
from datetime import datetime
from app.core.config import get_supabase
from app.routes.auth import get_current_user
from app.services.cloudinary_service import cloudinary_service
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/messages", tags=["messages"])


@router.post("/send-with-image/{conversation_id}")
async def send_message_with_image(
    conversation_id: str,
    image: UploadFile = File(...),
    content: Optional[str] = Form(None),
    user: Any = Depends(get_current_user),
) -> Dict[str, Any]:
    """
    Envía un mensaje con imagen adjunta

    Args:
        conversation_id: ID de la conversación
        image: Archivo de imagen (multipart/form-data)
        content: Texto opcional que acompaña la imagen

    Returns:
        dict: Información del mensaje creado
    """
    try:
        supabase = get_supabase()

        # 1. Validar que la conversación existe y pertenece al usuario
        conversation_response = (
            supabase.table("conversations")
            .select("*")
            .eq("id", conversation_id)
            .execute()
        )

        if not conversation_response.data:
            raise HTTPException(status_code=404, detail="Conversación no encontrada")

        conversation = conversation_response.data[0]

        # Verificar que el usuario es dueño de la conversación o es un agente asignado
        if conversation["user_id"] != user.id:
            # Verificar si es agente asignado
            agent_request_response = (
                supabase.table("agent_requests")
                .select("agent_id")
                .eq("conversation_id", conversation_id)
                .eq("status", "in_progress")
                .execute()
            )

            if (
                not agent_request_response.data
                or agent_request_response.data[0]["agent_id"] != user.id
            ):
                raise HTTPException(
                    status_code=403,
                    detail="No autorizado para enviar mensajes en esta conversación",
                )

        # 2. Subir imagen a Cloudinary
        logger.info(f"Subiendo imagen para conversación {conversation_id}")
        image_url = await cloudinary_service.upload_image(
            file=image, folder=f"chat_images/{conversation_id}"
        )

        # 3. Determinar rol del mensaje
        profile_response = (
            supabase.table("profiles").select("role").eq("id", user.id).execute()
        )
        role = (
            "assistant"
            if profile_response.data and profile_response.data[0]["role"] == "agent"
            else "user"
        )

        # 4. Crear mensaje en la base de datos
        message_id = str(uuid.uuid4())
        message_data = {
            "id": message_id,
            "conversation_id": conversation_id,
            "role": role,
            "content": content or "",  # Puede ser vacío si solo envía imagen
            "image_url": image_url,
            "response_type": "image" if not content else "text_with_image",
            "timestamp": datetime.utcnow().isoformat(),
        }

        result = supabase.table("messages").insert(message_data).execute()

        if not result.data:
            # Si falla la inserción, intentar eliminar imagen de Cloudinary
            await cloudinary_service.delete_image(image_url)
            raise HTTPException(status_code=500, detail="Error al guardar mensaje")

        # 5. Actualizar last_message_at en la conversación
        supabase.table("conversations").update(
            {"last_message_at": datetime.utcnow().isoformat()}
        ).eq("id", conversation_id).execute()

        logger.info(f"Mensaje con imagen creado exitosamente: {message_id}")

        return {"success": True, "message": result.data[0], "image_url": image_url}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error enviando mensaje con imagen: {str(e)}")
        raise HTTPException(
            status_code=500, detail=f"Error interno del servidor: {str(e)}"
        )


@router.delete("/image/{message_id}")
async def delete_message_image(
    message_id: str, user: Any = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Elimina la imagen de un mensaje (solo el autor puede hacerlo)
    """
    try:
        supabase = get_supabase()

        # 1. Obtener mensaje
        message_response = (
            supabase.table("messages").select("*").eq("id", message_id).execute()
        )

        if not message_response.data:
            raise HTTPException(status_code=404, detail="Mensaje no encontrado")

        message = message_response.data[0]

        # 2. Verificar permisos (debe ser el autor del mensaje)
        conversation_response = (
            supabase.table("conversations")
            .select("user_id")
            .eq("id", message["conversation_id"])
            .execute()
        )

        if (
            not conversation_response.data
            or conversation_response.data[0]["user_id"] != user.id
        ):
            # Verificar si es agente
            profile_response = (
                supabase.table("profiles").select("role").eq("id", user.id).execute()
            )
            if not (
                profile_response.data and profile_response.data[0]["role"] == "agent"
            ):
                raise HTTPException(status_code=403, detail="No autorizado")

        # 3. Eliminar imagen de Cloudinary
        if message.get("image_url"):
            await cloudinary_service.delete_image(message["image_url"])

        # 4. Actualizar mensaje en BD (remover image_url)
        supabase.table("messages").update(
            {"image_url": None, "response_type": "text"}
        ).eq("id", message_id).execute()

        return {"success": True, "message": "Imagen eliminada"}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error eliminando imagen: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
