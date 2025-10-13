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
  };
}

export function useConversation(conversationId: string): UseConversationReturn {
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadConversation = async () => {
      if (!conversationId) {
        setError('ID de conversación no válido');
        setLoading(false);
        return;
      }

      try {
        const data = await getConversationByIdAPI(conversationId);

        if (data && data.conversation) {
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
        } else {
          setError('Conversación no encontrada');
        }
      } catch (err) {
        console.error('Error al cargar conversación:', err);
        setError('Error al cargar la conversación');
      } finally {
        setLoading(false);
      }
    };

    loadConversation();
  }, [conversationId]);

  return { conversation, loading, error };
}
