import { useState, useEffect } from 'react';
import { Conversation } from '@/app/types/chat';
import { getConversationById as getConversationByIdAPI } from '@/lib/conversationApi';
import type { Message as ApiMessage } from '@/lib/conversationApi';
import type { Message as ChatMessage } from '@/app/types/chat';

interface UseConversationReturn {
  conversation: Conversation | null;
  loading: boolean;
  error: string | null;
}

/**
 * Convert API message format to frontend chat message format
 */
function convertApiMessageToChat(apiMsg: ApiMessage): ChatMessage {
  return {
    id: apiMsg.id,
    role: apiMsg.role,
    content: apiMsg.content,
    timestamp: new Date(apiMsg.timestamp),
    rating: apiMsg.rating,
    image_url: apiMsg.image_url, // 🔹 Incluir URL de imagen
  };
}

export function useConversation(
  conversationId: string,
  options?: { enablePolling?: boolean; pollingInterval?: number }
): UseConversationReturn {
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const enablePolling = options?.enablePolling ?? false;
  const pollingInterval = options?.pollingInterval ?? 3000; // 3 segundos por defecto

  useEffect(() => {
    let mounted = true;
    let intervalId: NodeJS.Timeout | null = null;

    const loadConversation = async (isInitial = false) => {
      if (!conversationId) {
        if (mounted) {
          setError('ID de conversación no válido');
          setLoading(false);
        }
        return;
      }

      try {
        const data = await getConversationByIdAPI(conversationId);

        if (data && data.conversation && mounted) {
          // Convert API format to frontend format
          const messages = data.messages.map(convertApiMessageToChat);

          const conv: Conversation = {
            id: data.conversation.id,
            title: data.conversation.title || 'Nueva conversación',
            messages: messages,
            createdAt: new Date(data.conversation.created_at),
            updatedAt: new Date(data.conversation.updated_at),
            messageCount: messages.length,
            lastMessage:
              messages.length > 0
                ? messages[messages.length - 1].content
                : undefined,
          };

          setConversation(conv);
        } else if (mounted) {
          setError('Conversación no encontrada');
        }
      } catch (err) {
        if (mounted) {
          console.error('Error al cargar conversación:', err);
          if (isInitial) {
            setError('Error al cargar la conversación');
          }
        }
      } finally {
        if (mounted && isInitial) {
          setLoading(false);
        }
      }
    };

    // Carga inicial
    loadConversation(true);

    // Configurar polling si está habilitado
    if (enablePolling) {
      intervalId = setInterval(() => {
        loadConversation(false); // No es carga inicial
      }, pollingInterval);
    }

    return () => {
      mounted = false;
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [conversationId, enablePolling, pollingInterval]);

  return { conversation, loading, error };
}
