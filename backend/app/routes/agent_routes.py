"""
Rutas para agentes de soporte.
Maneja la gestión de solicitudes escaladas y conversaciones asignadas.
"""

from typing import Any, Dict, List

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from app.routes.auth import get_current_user
from app.services.agent_service import (
    assign_request_to_agent,
    get_active_case,
    get_agent_requests,
    get_conversation_messages,
    resolve_request,
    send_agent_message,
)

router = APIRouter()


# --- Request/Response Models --- #
class SendMessageRequest(BaseModel):
    content: str


# --- Dependencias --- #
def get_current_agent(user: Any = Depends(get_current_user)) -> Any:
    """Verificar que el usuario actual es un agente"""
    from app.services.auth_services import get_user_info

    user_info = get_user_info(user)
    if user_info.get("role") != "agent":
        raise HTTPException(
            status_code=403, detail="Acceso denegado. Se requiere rol de agente."
        )
    return user


# --- Rutas --- #
@router.get("/requests")
def get_requests(
    agent: Any = Depends(get_current_agent),
) -> Dict[str, List[Dict[str, Any]]]:
    """Obtener todas las solicitudes pendientes y la solicitud activa del agente"""
    agent_id = agent.id
    requests = get_agent_requests(agent_id)
    return {"requests": requests}


@router.get("/active-case")
def get_active_case_endpoint(agent: Any = Depends(get_current_agent)) -> Dict[str, Any]:
    """Obtener el caso activo del agente (si tiene uno)"""
    agent_id = agent.id
    active_case = get_active_case(agent_id)

    if not active_case:
        raise HTTPException(status_code=404, detail="No hay caso activo")

    return active_case


@router.post("/requests/{request_id}/take")
def take_request(
    request_id: str, agent: Any = Depends(get_current_agent)
) -> Dict[str, str]:
    """Tomar una solicitud pendiente (asignarla al agente)"""
    agent_id = agent.id

    # Verificar que el agente no tenga ya un caso activo
    current_case = get_active_case(agent_id)
    if current_case:
        raise HTTPException(
            status_code=400,
            detail="Ya tienes un caso activo. Debes resolverlo antes de tomar otro.",
        )

    assign_request_to_agent(request_id, agent_id)
    return {"message": "Solicitud asignada correctamente"}


@router.post("/requests/{request_id}/resolve")
def resolve_request_endpoint(
    request_id: str, agent: Any = Depends(get_current_agent)
) -> Dict[str, str]:
    """Resolver una solicitud (marcarla como resuelta)"""
    agent_id = agent.id
    resolve_request(request_id, agent_id)
    return {"message": "Solicitud resuelta correctamente"}


@router.get("/conversations/{conversation_id}/messages")
def get_messages(
    conversation_id: str, agent: Any = Depends(get_current_agent)
) -> Dict[str, List[Dict[str, Any]]]:
    """Obtener mensajes de una conversación"""
    messages = get_conversation_messages(conversation_id)
    return {"messages": messages}


@router.post("/conversations/{conversation_id}/messages")
def send_message(
    conversation_id: str,
    request: SendMessageRequest,
    agent: Any = Depends(get_current_agent),
) -> Dict[str, Any]:
    """Enviar un mensaje como agente en una conversación"""
    agent_id = agent.id

    # Verificar que el agente tiene esta conversación asignada
    active_case = get_active_case(agent_id)
    if not active_case or active_case["conversation"]["id"] != conversation_id:
        raise HTTPException(
            status_code=403, detail="No tienes acceso a esta conversación"
        )

    message = send_agent_message(conversation_id, request.content)
    return {"message": message}
