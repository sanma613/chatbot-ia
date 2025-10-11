from typing import Any, Dict, List, Optional
from app.core.config import supabase_


def get_questions_from_db() -> List[Dict[str, Any]]:
    response = supabase_.table("faqs").select("id, question").execute()
    return response.data or []


def get_answer_by_question_id(question_id: int) -> Optional[str]:
    response = supabase_.table("faqs").select("answer").eq("id", question_id).execute()
    data = response.data or []
    if data:
        return data[0]["answer"]
    return None
