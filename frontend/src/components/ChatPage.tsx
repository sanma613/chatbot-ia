'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { useConversation } from '@/hooks/useConversation';
import ChatInterface from './ChatInterface';
import { LoadingState, ErrorState } from './chat/ConversationStates';
import { Message as ConversationMessage } from '@/app/types/chat';

// Tipo de mensaje que usa ChatInterface
type ChatMessage = {
  id: number | string;
  sender: 'UniBot' | 'user';
  text: string;
  timestamp: string;
  avatar?: string;
  rating?: 'up' | 'down' | null;
};

interface ChatPageProps {
  conversationId?: string;
}

export default function ChatPage({
  conversationId: propConversationId,
}: ChatPageProps) {
  const params = useParams();
  const conversationId = propConversationId || (params?.id as string);

  const { conversation, loading, error } = useConversation(conversationId);

  // Si no hay conversationId, mostrar chat nuevo
  if (!conversationId) {
    return <ChatInterface />;
  }

  // Mostrar loading mientras carga
  if (loading) {
    return <LoadingState />;
  }

  // Mostrar error si algo salió mal
  if (error || !conversation) {
    return <ErrorState error={error || 'Conversación no encontrada'} />;
  }

  // Convertir mensajes del historial al formato de ChatInterface
  const convertMessages = (messages: ConversationMessage[]): ChatMessage[] => {
    return messages.map((msg) => ({
      id: msg.id, // Keep as string (UUID) - ChatInterface handles both types
      sender: msg.role === 'user' ? 'user' : 'UniBot',
      text: msg.content,
      timestamp:
        typeof msg.timestamp === 'string'
          ? msg.timestamp
          : msg.timestamp.toLocaleTimeString('es-ES', {
              hour: '2-digit',
              minute: '2-digit',
            }),
      avatar: msg.role === 'assistant' ? '/images/logo_uni.png' : undefined,
      rating: msg.rating,
    }));
  };

  const initialMessages = convertMessages(conversation.messages);

  return (
    <ChatInterface
      initialMessages={initialMessages}
      conversationId={conversation.id}
      conversationTitle={conversation.title}
    />
  );
}
