"""
WebSocket routes for real-time chat when conversations are escalated
"""

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from typing import Dict, Set
import json
from datetime import datetime, timezone

from app.core.config import supabase_

router = APIRouter(prefix="/ws", tags=["websocket"])


def get_utc_timestamp() -> str:
    """
    Obtener timestamp UTC en formato compatible con Supabase.
    Supabase espera formato ISO sin timezone explícito (naive UTC).
    """
    return datetime.now(timezone.utc).replace(tzinfo=None).isoformat()


# Store active connections: conversation_id -> Set[WebSocket]
active_connections: Dict[str, Set[WebSocket]] = {}


class ConnectionManager:
    """Manage WebSocket connections for escalated conversations"""

    def __init__(self):
        self.active_connections: Dict[str, Set[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, conversation_id: str):
        """Add a new WebSocket connection to a conversation room"""
        await websocket.accept()

        if conversation_id not in self.active_connections:
            self.active_connections[conversation_id] = set()

        self.active_connections[conversation_id].add(websocket)
        print(f"✅ WebSocket connected to conversation {conversation_id[:8]}...")

    def disconnect(self, websocket: WebSocket, conversation_id: str):
        """Remove a WebSocket connection from a conversation room"""
        if conversation_id in self.active_connections:
            self.active_connections[conversation_id].discard(websocket)

            # Remove empty conversation rooms
            if not self.active_connections[conversation_id]:
                del self.active_connections[conversation_id]

        print(f"❌ WebSocket disconnected from conversation {conversation_id[:8]}...")

    async def broadcast_to_conversation(
        self, conversation_id: str, message: dict, exclude: WebSocket = None
    ):
        """Broadcast a message to all connections in a conversation room"""
        if conversation_id not in self.active_connections:
            return

        # Create a copy to avoid modification during iteration
        connections = self.active_connections[conversation_id].copy()

        for connection in connections:
            if connection != exclude:
                try:
                    await connection.send_json(message)
                except Exception as e:
                    print(f"⚠️ Error sending message to WebSocket: {e}")
                    # Remove dead connections
                    self.disconnect(connection, conversation_id)


manager = ConnectionManager()


@router.websocket("/chat/{conversation_id}")
async def websocket_chat(
    websocket: WebSocket,
    conversation_id: str,
):
    """
    WebSocket endpoint for real-time chat in escalated conversations.

    Both users and agents connect to the same conversation_id.
    Messages are broadcasted to all connected clients in that conversation.
    """
    # Note: Authentication is tricky with WebSockets
    # For now, we rely on the conversation_id being hard to guess (UUID)
    # In production, you should validate the token sent in the connection

    await manager.connect(websocket, conversation_id)

    try:
        while True:
            # Receive message from client
            data = await websocket.receive_text()

            try:
                message_data = json.loads(data)

                # Validate required fields
                if "role" not in message_data or "content" not in message_data:
                    await websocket.send_json(
                        {
                            "type": "error",
                            "message": "Missing required fields: role and content",
                        }
                    )
                    continue

                role = message_data["role"]  # 'user' or 'assistant'
                content = message_data["content"]
                user_id = message_data.get("user_id")

                # Save message to database
                try:
                    result = (
                        supabase_.table("messages")
                        .insert(
                            {
                                "conversation_id": conversation_id,
                                "role": role,
                                "content": content,
                                "response_type": "live_chat",
                                "timestamp": get_utc_timestamp(),
                            }
                        )
                        .execute()
                    )

                    if result.data and len(result.data) > 0:
                        saved_message = result.data[0]

                        # Broadcast to all connected clients (except sender)
                        broadcast_data = {
                            "type": "message",
                            "message": {
                                "id": saved_message["id"],
                                "role": role,
                                "content": content,
                                "timestamp": saved_message["timestamp"],
                            },
                        }

                        await manager.broadcast_to_conversation(
                            conversation_id, broadcast_data, exclude=websocket
                        )

                        # Confirm to sender
                        await websocket.send_json(
                            {
                                "type": "message_sent",
                                "message_id": saved_message["id"],
                            }
                        )

                        print(
                            f"💬 Message saved and broadcasted in conversation {conversation_id[:8]}..."
                        )
                    else:
                        raise Exception("Failed to save message")

                except Exception as db_error:
                    print(f"❌ Error saving message to database: {db_error}")
                    await websocket.send_json(
                        {"type": "error", "message": "Failed to save message"}
                    )

            except json.JSONDecodeError:
                await websocket.send_json(
                    {"type": "error", "message": "Invalid JSON format"}
                )

    except WebSocketDisconnect:
        manager.disconnect(websocket, conversation_id)
        print(f"🔌 Client disconnected from conversation {conversation_id[:8]}...")
    except Exception as e:
        print(f"❌ WebSocket error: {e}")
        manager.disconnect(websocket, conversation_id)
