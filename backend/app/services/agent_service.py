"""
Servicio para gestionar operaciones de agentes de soporte.
"""

from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
import time

from fastapi import HTTPException
from httpx import ReadError, ConnectError, TimeoutException

from app.core.config import supabase_
from app.services.email_service import get_email_service


def get_utc_timestamp() -> str:
    """
    Obtener timestamp UTC en formato compatible con Supabase.
    Supabase espera formato ISO sin timezone explícito (naive UTC).
    """
    return datetime.now(timezone.utc).replace(tzinfo=None).isoformat()


def execute_with_retry(operation, max_retries=3, operation_name="Database operation"):
    """
    Ejecutar operación de base de datos con retry logic para manejar errores de conexión.

    Args:
        operation: Función lambda o callable que ejecuta la operación
        max_retries: Número máximo de intentos
        operation_name: Nombre de la operación para logging

    Returns:
        Resultado de la operación
    """
    retry_delay = 0.5  # segundos

    for attempt in range(max_retries):
        try:
            return operation()
        except (ReadError, ConnectError, TimeoutException) as e:
            if attempt < max_retries - 1:
                print(
                    f"⚠️ Connection error in {operation_name} (attempt {attempt + 1}/{max_retries}): {e}"
                )
                time.sleep(retry_delay * (attempt + 1))  # Exponential backoff
                continue
            else:
                print(f"❌ Failed {operation_name} after {max_retries} attempts: {e}")
                raise HTTPException(
                    status_code=503,
                    detail=f"Error de conexión con la base de datos. Por favor, intente nuevamente.",
                )
        except Exception as e:
            # Otros errores no son reintentos
            print(f"❌ Unexpected error in {operation_name}: {e}")
            raise


def get_agent_requests(agent_id: str) -> List[Dict[str, Any]]:
    """
    Obtener todas las solicitudes de agente pendientes y en progreso.

    Retorna:
    - Todas las solicitudes con status='pending'
    - Las solicitudes con status='in_progress' asignadas a este agente
    """
    try:
        # Obtener agent_requests desde la tabla correcta con JOIN a conversations
        response = (
            supabase_.table("agent_requests")
            .select(
                """
                *,
                conversations:conversation_id (
                    id,
                    user_id,
                    created_at,
                    escalated_at,
                    is_escalated,
                    resolved,
                    resolved_at,
                    title
                )
                """
            )
            .order("created_at", desc=True)
            .execute()
        )

        requests = []
        for req in response.data:
            # Filtrar: pending (todas) o in_progress (solo del agente actual)
            if req["status"] == "pending" or (
                req["status"] == "in_progress" and req.get("agent_id") == agent_id
            ):
                conversation = req.get("conversations", {})
                user_id = conversation.get("user_id")

                # Obtener información del usuario desde profiles
                profile_response = (
                    supabase_.table("profiles")
                    .select("full_name")
                    .eq("id", user_id)
                    .single()
                    .execute()
                )

                user_name = (
                    profile_response.data.get("full_name", "Usuario")
                    if profile_response.data
                    else "Usuario"
                )

                # Obtener mensajes de la conversación
                messages_response = (
                    supabase_.table("messages")
                    .select("content, timestamp")
                    .eq("conversation_id", conversation.get("id"))
                    .order("timestamp", desc=False)
                    .execute()
                )

                messages = messages_response.data if messages_response.data else []
                last_message = messages[-1]["content"] if messages else None
                message_count = len(messages)

                requests.append(
                    {
                        "id": req["id"],
                        "conversation_id": req["conversation_id"],
                        "agent_id": req.get("agent_id"),
                        "status": req["status"],
                        "escalated_at": conversation.get("escalated_at"),
                        "assigned_at": req.get("assigned_at"),
                        "resolved_at": req.get("resolved_at"),
                        "user_email": user_id,  # Usamos user_id como identificador
                        "user_name": user_name,
                        "last_message": last_message,
                        "message_count": message_count,
                    }
                )

        return requests

    except Exception as e:
        print(f"Error obteniendo solicitudes de agente: {e}")
        raise HTTPException(
            status_code=500, detail=f"Error obteniendo solicitudes: {str(e)}"
        )


def get_active_case(agent_id: str) -> Optional[Dict[str, Any]]:
    """
    Obtener el caso activo del agente (si tiene uno).

    Un caso activo es una agent_request con status='in_progress' asignada a este agente.
    """
    try:
        response = (
            supabase_.table("agent_requests")
            .select(
                """
                *,
                conversations:conversation_id (
                    id,
                    user_id,
                    created_at,
                    is_escalated,
                    resolved,
                    title
                )
                """
            )
            .eq("agent_id", agent_id)
            .eq("status", "in_progress")
            .limit(1)
            .execute()
        )

        if not response.data:
            return None

        request_data = response.data[0]
        conversation = request_data.get("conversations", {})

        # Obtener mensajes de la conversación
        messages = get_conversation_messages(conversation["id"])

        # Obtener información del usuario desde profiles
        profile_response = (
            supabase_.table("profiles")
            .select("full_name")
            .eq("id", conversation["user_id"])
            .single()
            .execute()
        )

        user_name = (
            profile_response.data.get("full_name", "Usuario")
            if profile_response.data
            else "Usuario"
        )

        return {
            "request": {
                "id": request_data["id"],
                "conversation_id": request_data["conversation_id"],
                "agent_id": request_data.get("agent_id"),
                "status": request_data["status"],
                "escalated_at": request_data.get("created_at"),
                "assigned_at": request_data.get("assigned_at"),
                "resolved_at": request_data.get("resolved_at"),
            },
            "conversation": conversation,
            "messages": messages,
            "user_info": {"email": conversation["user_id"], "name": user_name},
        }

    except Exception as e:
        print(f"Error obteniendo caso activo: {e}")
        raise HTTPException(
            status_code=500, detail=f"Error obteniendo caso activo: {str(e)}"
        )


def assign_request_to_agent(request_id: str, agent_id: str) -> None:
    """
    Asignar una solicitud pendiente a un agente.

    Actualiza el agent_id y cambia status de 'pending' a 'in_progress' en agent_requests.
    Envía un email al usuario notificando que su caso fue tomado.
    """
    try:
        # Verificar que la solicitud existe y está pendiente
        check_response = (
            supabase_.table("agent_requests")
            .select(
                """
                *,
                conversations:conversation_id (
                    user_id
                )
            """
            )
            .eq("id", request_id)
            .eq("status", "pending")
            .execute()
        )

        if not check_response.data:
            raise HTTPException(
                status_code=404,
                detail="Solicitud no encontrada o ya está asignada",
            )

        request_data = check_response.data[0]
        user_id = request_data["conversations"]["user_id"]

        # IMPORTANTE: Obtener TODOS los datos necesarios en variables locales
        # ANTES de hacer cualquier operación de escritura o envío de email
        # Esto evita problemas de estado compartido entre requests concurrentes

        print(f"📊 Fetching user data for user_id: {user_id}")

        # Obtener información del usuario (email y nombre) con retry
        user_profile = execute_with_retry(
            lambda: supabase_.table("profiles")
            .select("full_name")
            .eq("id", user_id)
            .single()
            .execute(),
            operation_name=f"fetch user profile {user_id}",
        )

        # Obtener información del agente con retry
        agent_profile = execute_with_retry(
            lambda: supabase_.table("profiles")
            .select("full_name")
            .eq("id", agent_id)
            .single()
            .execute(),
            operation_name=f"fetch agent profile {agent_id}",
        )

        user_name = (
            user_profile.data.get("full_name", "Usuario")
            if user_profile.data
            else "Usuario"
        )
        agent_name = (
            agent_profile.data.get("full_name", "Agente de Soporte")
            if agent_profile.data
            else "Agente de Soporte"
        )

        print(f"   User name: {user_name}")
        print(f"   Agent name: {agent_name}")

        # Obtener email del usuario usando RPC function (mismo método que scheduler)
        user_email = None
        try:
            print(f"   Fetching email using RPC for user_id: {user_id}")

            # Usar RPC function para obtener email desde auth.users
            result = execute_with_retry(
                lambda: supabase_.rpc(
                    "get_user_email", {"user_uuid": user_id}
                ).execute(),
                operation_name=f"fetch user email via RPC {user_id}",
            )

            if result.data and len(result.data) > 0:
                user_data = result.data[0]
                user_email = user_data.get("email")

                # Actualizar user_name si viene del RPC
                rpc_name = user_data.get("full_name")
                if rpc_name:
                    user_name = rpc_name

                if user_email:
                    print(
                        f"✅ Email retrieved via RPC: {user_email} (for user_id: {user_id})"
                    )
                else:
                    print(f"⚠️ RPC returned data but no email field")
            else:
                print(f"⚠️ RPC returned no data for user {user_id}")

        except Exception as rpc_error:
            print(f"⚠️ Could not fetch user email via RPC: {rpc_error}")
            print(f"   Error details: {type(rpc_error).__name__}")
            import traceback

            traceback.print_exc()

        if not user_email:
            print(f"⚠️ No email found for user {user_id}, skipping email notification")

        # Guardar conversation_id en variable local
        conversation_id_local = request_data["conversation_id"]
        print(f"   Conversation ID: {conversation_id_local}")

        # PRIMERO: Actualizar la base de datos con retry
        print(
            f"💾 Updating database: assigning request {request_id} to agent {agent_id}"
        )
        execute_with_retry(
            lambda: supabase_.table("agent_requests")
            .update(
                {
                    "agent_id": agent_id,
                    "status": "in_progress",
                    "assigned_at": get_utc_timestamp(),
                    "updated_at": get_utc_timestamp(),
                }
            )
            .eq("id", request_id)
            .execute(),
            operation_name=f"assign request {request_id} to agent {agent_id}",
        )
        print(f"✅ Database updated successfully")

        # SEGUNDO: Enviar email de notificación (en un bloque completamente separado)
        # Usar variables locales para evitar problemas de estado compartido
        print(f"\n📧 Preparing to send email notification")
        print(f"   Target email: {user_email}")
        print(f"   User name: {user_name}")
        print(f"   Agent name: {agent_name}")
        print(f"   Conversation ID: {conversation_id_local}")

        email_sent_successfully = False
        if user_email:
            try:
                # Crear una NUEVA instancia del servicio para evitar conflictos
                # con conexiones HTTP/2 reutilizadas del cliente de Supabase
                from app.services.email_service import EmailService

                email_service = EmailService()  # Nueva instancia, no reutilizar
                print(f"   Email service initialized (fresh instance)")

                # Intentar enviar email (puede fallar si no hay configuración SMTP)
                email_sent_successfully = (
                    email_service.send_agent_assignment_notification(
                        to_email=user_email,
                        user_name=user_name,
                        agent_name=agent_name,
                        conversation_id=conversation_id_local,
                    )
                )

                if email_sent_successfully:
                    print(
                        f"✅ Email sent successfully to {user_email} - Case assigned by {agent_name}"
                    )
                else:
                    print(f"⚠️ Email not sent (SMTP not configured or error)")
                    print(f"   Check SMTP_USER and SMTP_PASSWORD environment variables")
            except Exception as email_error:
                # No fallar si el email no se envía
                print(f"❌ Error sending email notification: {email_error}")
                print(f"   Error type: {type(email_error).__name__}")
                import traceback

                traceback.print_exc()
        else:
            print(f"⚠️ Cannot send email - no email address found for user")

        print(f"\n✅ Request {request_id} assigned to agent {agent_id} (complete)")

    except HTTPException:
        raise
    except Exception as e:
        print(f"Error asignando solicitud: {e}")
        raise HTTPException(
            status_code=500, detail=f"Error asignando solicitud: {str(e)}"
        )


def resolve_request(request_id: str, agent_id: str) -> None:
    """
    Resolver una solicitud (marcarla como resuelta).

    Cambia status de 'in_progress' a 'resolved' en agent_requests y marca la conversación como resuelta.
    """
    try:
        # Verificar que la solicitud está asignada a este agente
        check_response = (
            supabase_.table("agent_requests")
            .select("*")
            .eq("id", request_id)
            .eq("agent_id", agent_id)
            .eq("status", "in_progress")
            .execute()
        )

        if not check_response.data:
            raise HTTPException(
                status_code=404,
                detail="Solicitud no encontrada o no tienes permiso para resolverla",
            )

        request_data = check_response.data[0]
        conversation_id = request_data["conversation_id"]

        # Marcar la solicitud como resuelta
        supabase_.table("agent_requests").update(
            {
                "status": "resolved",
                "resolved_at": get_utc_timestamp(),
                "updated_at": get_utc_timestamp(),
            }
        ).eq("id", request_id).execute()

        # Marcar la conversación como resuelta
        supabase_.table("conversations").update(
            {
                "resolved": True,
                "resolved_at": get_utc_timestamp(),
                "updated_at": get_utc_timestamp(),
            }
        ).eq("id", conversation_id).execute()

    except HTTPException:
        raise
    except Exception as e:
        print(f"Error resolviendo solicitud: {e}")
        raise HTTPException(
            status_code=500, detail=f"Error resolviendo solicitud: {str(e)}"
        )


def get_conversation_messages(conversation_id: str) -> List[Dict[str, Any]]:
    """Obtener todos los mensajes de una conversación"""
    try:
        response = (
            supabase_.table("messages")
            .select("*")
            .eq("conversation_id", conversation_id)
            .order("timestamp", desc=False)
            .execute()
        )

        return response.data

    except Exception as e:
        print(f"Error obteniendo mensajes: {e}")
        raise HTTPException(
            status_code=500, detail=f"Error obteniendo mensajes: {str(e)}"
        )


def send_agent_message(conversation_id: str, content: str) -> Dict[str, Any]:
    """Enviar un mensaje como agente en una conversación"""
    try:
        # Insertar mensaje con role='assistant' (el agente actúa como asistente)
        response = (
            supabase_.table("messages")
            .insert(
                {
                    "conversation_id": conversation_id,
                    "content": content,
                    "role": "assistant",  # Usar 'role' en lugar de 'sender'
                }
            )
            .execute()
        )

        if not response.data:
            raise HTTPException(status_code=500, detail="Error al insertar mensaje")

        return response.data[0]

    except Exception as e:
        print(f"Error enviando mensaje de agente: {e}")
        raise HTTPException(status_code=500, detail=f"Error enviando mensaje: {str(e)}")
