import { useState, useEffect } from 'react';
import { Conversation } from '@/app/types/chat';
import { getUserConversations } from '@/lib/conversationApi';
import type { Conversation as ApiConversation } from '@/lib/conversationApi';

interface UseConversationsReturn {
  conversations: Conversation[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Convert API conversation format to frontend format for list view
 */
function convertApiConversation(apiConv: ApiConversation): Conversation {
  return {
    id: apiConv.id,
    title: apiConv.title || 'Nueva conversación',
    createdAt: new Date(apiConv.created_at),
    updatedAt: new Date(apiConv.updated_at),
    messageCount: apiConv.message_count || 0,
    lastMessage: apiConv.last_message || undefined,
    messages: [],
  };
}

/**
 * Hook to fetch and manage user's conversations
 */
export function useConversations(): UseConversationsReturn {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchConversations = async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await getUserConversations();

      // Convert and sort conversations by most recent
      const converted = data.conversations
        .map(convertApiConversation)
        .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());

      setConversations(converted);
    } catch (err) {
      console.error('Error fetching conversations:', err);
      setError('No se pudo cargar el historial de conversaciones');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, []);

  return {
    conversations,
    loading,
    error,
    refetch: fetchConversations,
  };
}
