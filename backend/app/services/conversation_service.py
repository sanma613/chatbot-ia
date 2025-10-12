from typing import Any, Dict, List, Optional
from datetime import datetime
from openai import OpenAI
from app.core.config import supabase_, Config

client = OpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key=Config.OPENROUTER_API_KEY,
)


def create_conversation(user_id: str) -> Dict[str, Any]:
    """
    Create a new conversation for a user.
    Returns the conversation_id and created_at timestamp.
    """
    try:
        response = (
            supabase_.table("conversations")
            .insert(
                {
                    "user_id": user_id,
                    "title": "Nueva conversación",  # Default title (will be auto-generated later)
                    "is_escalated": False,
                }
            )
            .execute()
        )

        if response.data:
            return {
                "conversation_id": response.data[0]["id"],
                "created_at": response.data[0]["created_at"],
                "success": True,
            }
        else:
            return {"success": False, "error": "Failed to create conversation"}

    except Exception as e:
        print(f"Error creating conversation: {e}")
        return {"success": False, "error": str(e)}


def get_conversation(conversation_id: str, user_id: str) -> Optional[Dict[str, Any]]:
    """
    Retrieve a specific conversation by ID.
    Validates that the conversation belongs to the user.
    """
    try:
        response = (
            supabase_.table("conversations")
            .select("*")
            .eq("id", conversation_id)
            .eq("user_id", user_id)
            .single()
            .execute()
        )

        return response.data if response.data else None

    except Exception as e:
        print(f"Error getting conversation: {e}")
        return None


def get_user_conversations(user_id: str, limit: int = 50) -> List[Dict[str, Any]]:
    """
    Get all conversations for a user, ordered by most recent.
    Includes message count and last message preview.
    """
    try:
        response = (
            supabase_.table("conversations")
            .select("*")
            .eq("user_id", user_id)
            .order("last_message_at", desc=True)
            .limit(limit)
            .execute()
        )

        conversations = response.data if response.data else []

        # Enrich each conversation with message count and last message
        for conv in conversations:
            conv_id = conv["id"]

            # Get message count
            count_response = (
                supabase_.table("messages")
                .select("id", count="exact")
                .eq("conversation_id", conv_id)
                .execute()
            )
            conv["message_count"] = count_response.count if count_response.count else 0

            # Get last message preview (excluding greeting)
            last_msg_response = (
                supabase_.table("messages")
                .select("content, role")
                .eq("conversation_id", conv_id)
                .neq("response_type", "greeting")  # Exclude welcome messages
                .order("timestamp", desc=True)
                .limit(1)
                .execute()
            )

            if last_msg_response.data and len(last_msg_response.data) > 0:
                last_msg = last_msg_response.data[0]
                # Truncate to 100 chars for preview
                conv["last_message"] = (
                    last_msg["content"][:100] + "..."
                    if len(last_msg["content"]) > 100
                    else last_msg["content"]
                )
            else:
                conv["last_message"] = None

        return conversations

    except Exception as e:
        print(f"Error getting user conversations: {e}")
        return []


def save_message(
    conversation_id: str,
    role: str,
    content: str,
    response_type: str = "general",
) -> Dict[str, Any]:
    """
    Save a message to the database.
    role: 'user' or 'assistant'
    response_type: 'faq', 'academic_chatbot', 'escalation', 'general', 'support'
    """
    try:
        response = (
            supabase_.table("messages")
            .insert(
                {
                    "conversation_id": conversation_id,
                    "role": role,
                    "content": content,
                    "response_type": response_type,
                    "timestamp": datetime.utcnow().isoformat(),
                }
            )
            .execute()
        )

        if response.data:
            return {
                "message_id": response.data[0]["id"],
                "timestamp": response.data[0]["timestamp"],
                "success": True,
            }
        else:
            return {"success": False, "error": "Failed to save message"}

    except Exception as e:
        print(f"Error saving message: {e}")
        return {"success": False, "error": str(e)}


def get_conversation_messages(
    conversation_id: str, limit: int = 50
) -> List[Dict[str, Any]]:
    """
    Retrieve messages for a conversation, ordered by timestamp.
    """
    try:
        response = (
            supabase_.table("messages")
            .select("*")
            .eq("conversation_id", conversation_id)
            .order("timestamp", desc=False)
            .limit(limit)
            .execute()
        )

        return response.data if response.data else []

    except Exception as e:
        print(f"Error getting conversation messages: {e}")
        return []


def count_user_messages(conversation_id: str) -> int:
    """
    Count the number of user messages in a conversation.
    Used to determine when to generate a title (after 3rd user message).
    """
    try:
        response = (
            supabase_.table("messages")
            .select("id", count="exact")
            .eq("conversation_id", conversation_id)
            .eq("role", "user")
            .execute()
        )

        return response.count if response.count else 0

    except Exception as e:
        print(f"Error counting user messages: {e}")
        return 0


def generate_conversation_title(conversation_id: str) -> Optional[str]:
    """
    Generate a concise, descriptive title for a conversation based on its messages.
    Uses OpenAI to analyze the conversation context.
    """
    try:
        # Get the first few messages for context
        messages = get_conversation_messages(conversation_id, limit=6)

        if len(messages) < 2:
            return None

        # Build conversation context
        conversation_context = "\n".join(
            [f"{msg['role']}: {msg['content']}" for msg in messages[:6]]
        )

        # Use OpenAI to generate a title
        response = client.chat.completions.create(
            model="deepseek/deepseek-chat",
            messages=[
                {
                    "role": "system",
                    "content": "Eres un asistente que genera títulos concisos y descriptivos para conversaciones. Genera un título de 3-7 palabras que capture el tema principal de la conversación. Responde SOLO con el título, sin puntos ni comillas.",
                },
                {
                    "role": "user",
                    "content": f"Genera un título para esta conversación:\n\n{conversation_context}",
                },
            ],
            max_tokens=50,
            temperature=0.7,
        )

        title = response.choices[0].message.content.strip()
        # Remove quotes if present
        title = title.strip('"').strip("'")

        return title[:100]  # Limit to 100 characters

    except Exception as e:
        print(f"Error generating conversation title: {e}")
        return None


def update_conversation_title(conversation_id: str, title: str) -> bool:
    """
    Update the title of a conversation.
    """
    try:
        response = (
            supabase_.table("conversations")
            .update({"title": title, "updated_at": datetime.utcnow().isoformat()})
            .eq("id", conversation_id)
            .execute()
        )

        return bool(response.data)

    except Exception as e:
        print(f"Error updating conversation title: {e}")
        return False


def auto_generate_title_if_needed(conversation_id: str) -> None:
    """
    Automatically generate and set a title after the 3rd user message.
    This should be called after saving each user message.
    """
    try:
        # Check if conversation already has a title
        conv_response = (
            supabase_.table("conversations")
            .select("title")
            .eq("id", conversation_id)
            .single()
            .execute()
        )

        if conv_response.data and conv_response.data.get("title"):
            # Title already exists, no need to generate
            return

        # Count user messages
        user_message_count = count_user_messages(conversation_id)

        # Generate title after 3rd user message
        if user_message_count == 3:
            title = generate_conversation_title(conversation_id)
            if title:
                update_conversation_title(conversation_id, title)

    except Exception as e:
        print(f"Error in auto_generate_title_if_needed: {e}")


def escalate_conversation(conversation_id: str) -> bool:
    """
    Mark a conversation as escalated (user requested human assistance).
    """
    try:
        response = (
            supabase_.table("conversations")
            .update(
                {
                    "is_escalated": True,
                    "escalated_at": datetime.utcnow().isoformat(),
                    "updated_at": datetime.utcnow().isoformat(),
                }
            )
            .eq("id", conversation_id)
            .execute()
        )

        return bool(response.data)

    except Exception as e:
        print(f"Error escalating conversation: {e}")
        return False


def rate_message(message_id: str, rating: str) -> bool:
    """
    Rate a message (thumbs up or thumbs down).
    rating: 'up' or 'down'
    """
    try:
        if rating not in ["up", "down"]:
            return False

        response = (
            supabase_.table("messages")
            .update({"rating": rating, "rated_at": datetime.utcnow().isoformat()})
            .eq("id", message_id)
            .execute()
        )

        return bool(response.data)

    except Exception as e:
        print(f"Error rating message: {e}")
        return False


def detect_escalation_request(message: str) -> bool:
    """
    Detect if the user is requesting to speak with a human agent.
    Supports multiple languages and variations.
    """
    escalation_phrases = [
        # Spanish
        "hablar con un humano",
        "hablar con una persona",
        "quiero hablar con alguien",
        "conectarme con un agente",
        "necesito ayuda humana",
        "transferirme a soporte",
        "hablar con un operador",
        "atención al cliente",
        "representante humano",
        # English
        "speak to a human",
        "talk to a person",
        "connect me with an agent",
        "human help",
        "transfer to support",
        "speak to an operator",
        "customer service",
        "human representative",
        # Common words
        "agente",
        "operador",
        "persona real",
        "real person",
    ]

    message_lower = message.lower()
    return any(phrase in message_lower for phrase in escalation_phrases)


def delete_conversation(conversation_id: str) -> bool:
    """
    Delete a conversation and all its messages.
    Messages are cascade deleted by database constraints.
    """
    try:
        # Delete messages first (if not using cascade)
        supabase_.table("messages").delete().eq(
            "conversation_id", conversation_id
        ).execute()

        # Delete conversation
        response = (
            supabase_.table("conversations")
            .delete()
            .eq("id", conversation_id)
            .execute()
        )

        return True

    except Exception as e:
        print(f"Error deleting conversation: {e}")
        return False
