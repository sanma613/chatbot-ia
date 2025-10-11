from typing import Any, Dict
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from app.routes.auth import get_current_user
from app.services.academic_chatbot_service import academic_chatbot

router = APIRouter()


class ChatRequest(BaseModel):
    question: str


@router.post("/ask")
def ask_chatbot(
    req: ChatRequest, user: Any = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Endpoint principal del chatbot académico.
    Integra DeepSeek + Supabase para responder consultas en español.
    """
    question = req.question.encode("utf-8", errors="ignore").decode("utf-8")
    response = academic_chatbot(question)
    return response
