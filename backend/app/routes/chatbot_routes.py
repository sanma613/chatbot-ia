from typing import Any, Dict, Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from app.routes.auth import get_current_user
from app.services.academic_chatbot_service import academic_chatbot
from app.services import conversation_service

router = APIRouter()


class ChatRequest(BaseModel):
    question: str
    conversation_id: Optional[str] = None


class InitialChatRequest(BaseModel):
    """Request for creating a new conversation with welcome message"""

    welcome_message: str
    initial_message: str


@router.post("/ask")
def ask_chatbot(
    req: ChatRequest, user: Any = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Endpoint principal del chatbot académico.
    Integra DeepSeek + Supabase para responder consultas en español.
    Ahora con gestión automática de conversaciones y mensajes.
    """
    user_id = user.id
    if not user_id:
        raise HTTPException(status_code=401, detail="User not authenticated")

    question = req.question.encode("utf-8", errors="ignore").decode("utf-8")

    # 1. Create or get conversation
    conversation_id = req.conversation_id
    if not conversation_id:
        # Create new conversation on first user message
        conv_result = conversation_service.create_conversation(user_id)
        if not conv_result.get("success"):
            raise HTTPException(status_code=500, detail="Failed to create conversation")
        conversation_id = conv_result["conversation_id"]
    else:
        # Verify conversation belongs to user
        conv = conversation_service.get_conversation(conversation_id, user_id)
        if not conv:
            raise HTTPException(status_code=404, detail="Conversation not found")

    # 2. Check for escalation request
    is_escalation = conversation_service.detect_escalation_request(question)

    if is_escalation:
        # Save user message
        conversation_service.save_message(
            conversation_id, "user", question, "escalation"
        )

        # Escalate conversation
        conversation_service.escalate_conversation(conversation_id)

        # Generate escalation response
        escalation_response = (
            "Entiendo que necesitas hablar con un agente humano. "
            "Te estoy conectando con nuestro equipo de soporte. "
            "Un agente se pondrá en contacto contigo en breve. "
            "Gracias por tu paciencia. 🤝"
        )

        # Save assistant response
        conversation_service.save_message(
            conversation_id, "assistant", escalation_response, "escalation"
        )

        return {
            "answer": escalation_response,
            "conversation_id": conversation_id,
            "escalated": True,
        }

    # 3. Save user message
    user_msg_result = conversation_service.save_message(
        conversation_id, "user", question, "academic_chatbot"
    )

    if not user_msg_result.get("success"):
        raise HTTPException(status_code=500, detail="Failed to save user message")

    # 4. Auto-generate title if needed (after 3rd user message)
    conversation_service.auto_generate_title_if_needed(conversation_id)

    # 5. Get chatbot response
    response = academic_chatbot(question)
    answer = response.get("answer", "")

    # 6. Save assistant response
    assistant_msg_result = conversation_service.save_message(
        conversation_id, "assistant", answer, "academic_chatbot"
    )

    if not assistant_msg_result.get("success"):
        raise HTTPException(status_code=500, detail="Failed to save assistant message")

    # 7. Return response with conversation_id and message_ids
    return {
        "answer": answer,
        "conversation_id": conversation_id,
        "user_message_id": user_msg_result.get("message_id"),
        "assistant_message_id": assistant_msg_result.get("message_id"),
        "escalated": False,
    }


@router.post("/start")
def start_conversation(
    req: InitialChatRequest, user: Any = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Start a new conversation with welcome message and initial user message.
    This endpoint creates a conversation and stores:
    1. Welcome message (assistant)
    2. User's first message
    3. AI response to user's message
    """
    user_id = user.id
    if not user_id:
        raise HTTPException(status_code=401, detail="User not authenticated")

    # 1. Create new conversation
    conv_result = conversation_service.create_conversation(user_id)
    if not conv_result.get("success"):
        raise HTTPException(status_code=500, detail="Failed to create conversation")
    conversation_id = conv_result["conversation_id"]

    # 2. Save welcome message (assistant)
    welcome_result = conversation_service.save_message(
        conversation_id, "assistant", req.welcome_message, "greeting"
    )
    if not welcome_result.get("success"):
        raise HTTPException(status_code=500, detail="Failed to save welcome message")

    # 3. Save user's initial message
    user_msg_result = conversation_service.save_message(
        conversation_id, "user", req.initial_message, "academic_chatbot"
    )
    if not user_msg_result.get("success"):
        raise HTTPException(status_code=500, detail="Failed to save user message")

    # 4. Check for escalation in initial message
    is_escalation = conversation_service.detect_escalation_request(req.initial_message)

    if is_escalation:
        # Escalate conversation
        conversation_service.escalate_conversation(conversation_id)

        # Generate escalation response
        escalation_response = (
            "Entiendo que necesitas hablar con un agente humano. "
            "Te estoy conectando con nuestro equipo de soporte. "
            "Un agente se pondrá en contacto contigo en breve. "
            "Gracias por tu paciencia. 🤝"
        )

        # Save assistant escalation response
        assistant_msg_result = conversation_service.save_message(
            conversation_id, "assistant", escalation_response, "escalation"
        )

        # Get all messages
        messages = conversation_service.get_conversation_messages(conversation_id)

        return {
            "success": True,
            "data": {
                "conversation": {
                    "id": conversation_id,
                    "created_at": conv_result["created_at"],
                    "is_escalated": True,
                },
                "messages": messages,
            },
        }

    # 5. Generate AI response to user's initial message
    response = academic_chatbot(req.initial_message)
    answer = response.get("answer", "")

    # 6. Save assistant response
    assistant_msg_result = conversation_service.save_message(
        conversation_id, "assistant", answer, "academic_chatbot"
    )
    if not assistant_msg_result.get("success"):
        raise HTTPException(status_code=500, detail="Failed to save assistant message")

    # 7. Auto-generate title if this qualifies as 1st user message
    conversation_service.auto_generate_title_if_needed(conversation_id)

    # 8. Get all messages to return
    messages = conversation_service.get_conversation_messages(conversation_id)

    # 9. Return complete conversation data
    return {
        "success": True,
        "data": {
            "conversation": {
                "id": conversation_id,
                "created_at": conv_result["created_at"],
                "is_escalated": False,
            },
            "messages": messages,
        },
    }
