from typing import Any, Dict, List

from fastapi import APIRouter, Depends
from pydantic import BaseModel

from app.routes.auth import get_current_user
from app.services.chatbot_services import (
    get_answer_by_question_id,
    get_questions_from_db,
)

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


@router.get("/get_answer/{question_id}")
def get_answer(
    question_id: int, user: Any = Depends(get_current_user)
) -> Dict[str, Any]:
    """Endpoint para obtener la respuesta a una pregunta frecuente por su ID"""
    answer = get_answer_by_question_id(question_id)
    if answer is None:
        return {"error": "Pregunta no encontrada"}
    return {"answer": answer}
