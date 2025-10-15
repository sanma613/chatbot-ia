/**
 * Hook para manejar conexiones WebSocket en conversaciones escaladas
 */
import { useEffect, useRef, useCallback, useState } from 'react';

export interface WebSocketMessage {
  id: string | number;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  image_url?: string; // 🔹 URL de imagen adjunta
}

interface UseWebSocketChatOptions {
  conversationId?: string;
  userId?: string;
  role: 'user' | 'assistant';
  onMessage?: (message: WebSocketMessage) => void;
  enabled?: boolean; // Only connect when escalated and agent is active
}

export function useWebSocketChat({
  conversationId,
  userId,
  role,
  onMessage,
  enabled = false,
}: UseWebSocketChatOptions) {
  const wsRef = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Connect to WebSocket
  useEffect(() => {
    if (!enabled || !conversationId) {
      // Disconnect if disabled or no conversation
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
        setIsConnected(false);
      }
      return;
    }

    // Create WebSocket connection
    const wsUrl = `ws://localhost:8000/ws/chat/${conversationId}`;
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log('✅ WebSocket connected to conversation:', conversationId);
      setIsConnected(true);
      setError(null);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.type === 'message' && onMessage) {
          // Received a new message from another user
          onMessage(data.message);
        } else if (data.type === 'message_sent') {
          // Confirmation that our message was sent
          console.log('📤 Message sent successfully:', data.message_id);
        } else if (data.type === 'error') {
          console.error('❌ WebSocket error:', data.message);
          setError(data.message);
        }
      } catch (err) {
        console.error('Error parsing WebSocket message:', err);
      }
    };

    ws.onerror = (event) => {
      console.error('❌ WebSocket error:', event);
      setError('Connection error');
      setIsConnected(false);
    };

    ws.onclose = () => {
      console.log('🔌 WebSocket disconnected');
      setIsConnected(false);
    };

    wsRef.current = ws;

    // Cleanup on unmount or when dependencies change
    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, [conversationId, enabled, onMessage]);

  // Send message through WebSocket
  const sendMessage = useCallback(
    (content: string) => {
      if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
        console.error('❌ WebSocket is not connected');
        return false;
      }

      try {
        const message = {
          role,
          content,
          user_id: userId,
        };

        wsRef.current.send(JSON.stringify(message));
        return true;
      } catch (err) {
        console.error('Error sending WebSocket message:', err);
        return false;
      }
    },
    [role, userId]
  );

  return {
    isConnected,
    error,
    sendMessage,
  };
}
