from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from app.routes.auth import get_current_user
from app.services.faq_services import (
    get_answer_by_question_id,
    get_questions_from_db,
)
from app.services import conversation_service

router = APIRouter()


# --- Responses / Requests --- #
class QuestionResponse(BaseModel):
    id: int
    question: str


class QuestionsListResponse(BaseModel):
    questions: List[QuestionResponse]


@router.get("/list-questions", response_model=QuestionsListResponse)
def list_questions(
    user: Any = Depends(get_current_user),
) -> Dict[str, List[QuestionResponse]]:
    """Endpoint para listar preguntas frecuentes desde la base de datos"""
    questions = get_questions_from_db()
    return {
        "questions": [
            QuestionResponse(id=q["id"], question=q["question"]) for q in questions
        ]
    }


class FAQRequest(BaseModel):
    """Request model for FAQ with optional conversation tracking"""

    conversation_id: Optional[str] = None


# New endpoint with conversation tracking
@router.post("/get_answer/{question_id}")
def get_answer(
    question_id: int, req: FAQRequest, user: Any = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Endpoint para obtener la respuesta a una pregunta frecuente por su ID.
    Ahora con tracking de conversación automático.
    """
    user_id = user.id
    if not user_id:
        raise HTTPException(status_code=401, detail="User not authenticated")

    # Get the question text first
    questions = get_questions_from_db()
    question_text = None
    for q in questions:
        if q["id"] == question_id:
            question_text = q["question"]
            break

    if not question_text:
        raise HTTPException(status_code=404, detail="Pregunta no encontrada")

    # 1. Create or get conversation
    conversation_id = req.conversation_id
    if not conversation_id:
        # Create new conversation on first FAQ
        conv_result = conversation_service.create_conversation(user_id)
        if not conv_result.get("success"):
            raise HTTPException(status_code=500, detail="Failed to create conversation")
        conversation_id = conv_result["conversation_id"]
    else:
        # Verify conversation belongs to user
        conv = conversation_service.get_conversation(conversation_id, user_id)
        if not conv:
            raise HTTPException(status_code=404, detail="Conversation not found")

    # 2. Save user's question (the FAQ selection)
    user_msg_result = conversation_service.save_message(
        conversation_id, "user", question_text, "faq"
    )
    if not user_msg_result.get("success"):
        raise HTTPException(status_code=500, detail="Failed to save user message")

    # 3. Get the FAQ answer
    answer = get_answer_by_question_id(question_id)
    if answer is None:
        raise HTTPException(status_code=404, detail="Pregunta no encontrada")

    # 4. Save assistant's answer
    assistant_msg_result = conversation_service.save_message(
        conversation_id, "assistant", answer, "faq"
    )
    if not assistant_msg_result.get("success"):
        raise HTTPException(status_code=500, detail="Failed to save assistant message")

    # 5. Auto-generate title if needed
    conversation_service.auto_generate_title_if_needed(conversation_id)

    # 6. Return response with conversation tracking
    return {
        "answer": answer,
        "conversation_id": conversation_id,
        "user_message_id": user_msg_result.get("message_id"),
        "assistant_message_id": assistant_msg_result.get("message_id"),
    }
