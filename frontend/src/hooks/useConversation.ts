import { useState, useEffect } from 'react';
import { Conversation } from '@/app/types/chat';
import { getConversationById } from '@/lib/mockChatData';

interface UseConversationReturn {
    conversation: Conversation | null;
    loading: boolean;
    error: string | null;
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
                const conv = await getConversationById(conversationId);
                if (conv) {
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