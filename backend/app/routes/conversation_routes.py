from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from app.routes.auth import get_current_user
from app.services import conversation_service

router = APIRouter()


class CreateConversationResponse(BaseModel):
    conversation_id: str
    created_at: str


class MessageRequest(BaseModel):
    role: str
    content: str
    response_type: Optional[str] = "general"


class RatingRequest(BaseModel):
    rating: str  # 'up' or 'down'


class EscalateRequest(BaseModel):
    message: Optional[str] = None


class UpdateTitleRequest(BaseModel):
    title: str


@router.post("/conversations", response_model=CreateConversationResponse)
def create_conversation(user: Any = Depends(get_current_user)) -> Dict[str, Any]:
    """
    Create a new conversation for the authenticated user.
    """
    user_id = user.id
    if not user_id:
        raise HTTPException(status_code=401, detail="User not authenticated")

    result = conversation_service.create_conversation(user_id)

    if not result.get("success"):
        raise HTTPException(
            status_code=500, detail=result.get("error", "Failed to create conversation")
        )

    return {
        "conversation_id": result["conversation_id"],
        "created_at": result["created_at"],
    }


@router.get("/conversations")
def get_user_conversations(user: Any = Depends(get_current_user)) -> Dict[str, Any]:
    """
    Get all conversations for the authenticated user.
    """
    user_id = user.id
    if not user_id:
        raise HTTPException(status_code=401, detail="User not authenticated")

    conversations = conversation_service.get_user_conversations(user_id)

    return {"conversations": conversations, "count": len(conversations)}


@router.get("/conversations/{conversation_id}")
def get_conversation(
    conversation_id: str, user: Any = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Get a specific conversation with all its messages.
    """
    user_id = user.id
    if not user_id:
        raise HTTPException(status_code=401, detail="User not authenticated")

    conversation = conversation_service.get_conversation(conversation_id, user_id)

    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")

    # Get messages for this conversation
    messages = conversation_service.get_conversation_messages(conversation_id)

    return {"conversation": conversation, "messages": messages}


@router.post("/conversations/{conversation_id}/messages")
def add_message(
    conversation_id: str,
    req: MessageRequest,
    user: Any = Depends(get_current_user),
) -> Dict[str, Any]:
    """
    Add a new message to a conversation.
    Automatically generates title after 3rd user message.
    """
    user_id = user.id
    if not user_id:
        raise HTTPException(status_code=401, detail="User not authenticated")

    # Verify conversation belongs to user
    conversation = conversation_service.get_conversation(conversation_id, user_id)
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")

    # Validate role
    if req.role not in ["user", "assistant"]:
        raise HTTPException(status_code=400, detail="Invalid role")

    # Save message
    result = conversation_service.save_message(
        conversation_id, req.role, req.content, req.response_type
    )

    if not result.get("success"):
        raise HTTPException(
            status_code=500, detail=result.get("error", "Failed to save message")
        )

    # Auto-generate title if needed (after 3rd user message)
    if req.role == "user":
        conversation_service.auto_generate_title_if_needed(conversation_id)

    return {
        "message_id": result["message_id"],
        "timestamp": result["timestamp"],
        "success": True,
    }


@router.put("/conversations/{conversation_id}/escalate")
def escalate_conversation(
    conversation_id: str,
    req: EscalateRequest,
    user: Any = Depends(get_current_user),
) -> Dict[str, Any]:
    """
    Mark a conversation as escalated (user requested human assistance).
    """
    user_id = user.id
    if not user_id:
        raise HTTPException(status_code=401, detail="User not authenticated")

    # Verify conversation belongs to user
    conversation = conversation_service.get_conversation(conversation_id, user_id)
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")

    # Escalate conversation
    success = conversation_service.escalate_conversation(conversation_id)

    if not success:
        raise HTTPException(status_code=500, detail="Failed to escalate conversation")

    # If there's a message, save it as an escalation message
    if req.message:
        conversation_service.save_message(
            conversation_id, "user", req.message, "escalation"
        )

    return {
        "success": True,
        "message": "Conversation escalated successfully. A support agent will assist you shortly.",
    }


@router.put("/conversations/{conversation_id}/title")
def update_conversation_title(
    conversation_id: str,
    req: UpdateTitleRequest,
    user: Any = Depends(get_current_user),
) -> Dict[str, Any]:
    """
    Update the title of a conversation.
    """
    user_id = user.id
    if not user_id:
        raise HTTPException(status_code=401, detail="User not authenticated")

    # Verify conversation belongs to user
    conversation = conversation_service.get_conversation(conversation_id, user_id)
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")

    # Validate title
    if not req.title or len(req.title.strip()) == 0:
        raise HTTPException(status_code=400, detail="Title cannot be empty")

    if len(req.title) > 100:
        raise HTTPException(status_code=400, detail="Title too long (max 100 chars)")

    # Update title
    success = conversation_service.update_conversation_title(
        conversation_id, req.title.strip()
    )

    if not success:
        raise HTTPException(status_code=500, detail="Failed to update title")

    return {"success": True, "title": req.title.strip()}


@router.put("/messages/{message_id}/rate")
def rate_message(
    message_id: str, req: RatingRequest, user: Any = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Rate a message (thumbs up or thumbs down).
    """
    user_id = user.id
    if not user_id:
        raise HTTPException(status_code=401, detail="User not authenticated")

    # Validate rating
    if req.rating not in ["up", "down"]:
        raise HTTPException(status_code=400, detail="Invalid rating")

    # Rate the message
    success = conversation_service.rate_message(message_id, req.rating)

    if not success:
        raise HTTPException(status_code=500, detail="Failed to rate message")

    return {
        "success": True,
        "message": (
            "Thank you for your feedback!"
            if req.rating == "up"
            else "We apologize that wasn't helpful. Let us try to assist you better."
        ),
    }


@router.get("/conversations/{conversation_id}/escalation-status")
def get_escalation_status(
    conversation_id: str, user: Any = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Get the escalation status of a conversation.
    Returns: is_escalated, agent_request status, agent info if assigned.
    """
    user_id = user.id
    if not user_id:
        raise HTTPException(status_code=401, detail="User not authenticated")

    # Verify conversation belongs to user (or user is agent)
    conversation = conversation_service.get_conversation(conversation_id, user_id)
    if not conversation:
        raise HTTPException(
            status_code=404, detail="Conversation not found or access denied"
        )

    # Get agent_request if exists
    from app.core.config import supabase_

    agent_request_response = (
        supabase_.table("agent_requests")
        .select("id, status, assigned_at, resolved_at, agent_id")
        .eq("conversation_id", conversation_id)
        .execute()
    )

    escalation_data = {
        "is_escalated": conversation.get("is_escalated", False),
        "escalated_at": conversation.get("escalated_at"),
        "resolved": conversation.get("resolved", False),
        "resolved_at": conversation.get("resolved_at"),
        "agent_request": None,
    }

    if agent_request_response.data and len(agent_request_response.data) > 0:
        agent_req = agent_request_response.data[0]

        # Get agent name if agent_id exists
        agent_name = None
        if agent_req.get("agent_id"):
            agent_profile = (
                supabase_.table("profiles")
                .select("full_name")
                .eq("id", agent_req["agent_id"])
                .execute()
            )
            if agent_profile.data and len(agent_profile.data) > 0:
                agent_name = agent_profile.data[0].get("full_name")

        escalation_data["agent_request"] = {
            "id": agent_req["id"],
            "status": agent_req["status"],
            "assigned_at": agent_req.get("assigned_at"),
            "resolved_at": agent_req.get("resolved_at"),
            "agent_name": agent_name,
        }

    return escalation_data


@router.delete("/conversations/{conversation_id}")
def delete_conversation(
    conversation_id: str, user: Any = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Delete a conversation and all its messages.
    Only the conversation owner can delete it.
    """
    user_id = user.id
    if not user_id:
        raise HTTPException(status_code=401, detail="User not authenticated")

    # Verify conversation belongs to user
    conversation = conversation_service.get_conversation(conversation_id, user_id)
    if not conversation:
        raise HTTPException(
            status_code=404, detail="Conversation not found or access denied"
        )

    # Delete the conversation (messages will be cascade deleted)
    success = conversation_service.delete_conversation(conversation_id)

    if not success:
        raise HTTPException(status_code=500, detail="Failed to delete conversation")

    return {"success": True, "message": "Conversation deleted successfully"}
