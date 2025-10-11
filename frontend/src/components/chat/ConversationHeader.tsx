import React from 'react';
import Link from 'next/link';
import { Conversation } from '@/app/types/chat';
import { ArrowLeft, Calendar, Clock, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/Utils';

interface ConversationHeaderProps {
  conversation: Conversation;
}

export default function ConversationHeader({
  conversation,
}: ConversationHeaderProps) {
  const formatDateTime = (date: Date) => {
    return date.toLocaleString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="mb-6">
      <div className="flex items-center gap-4 mb-4">
        <Link
          href="/history"
          className={cn(
            'flex items-center gap-2 px-3 py-2',
            'text-dark hover:text-primary',
            'hover:bg-gray-100 rounded-lg transition-colors'
          )}
        >
          <ArrowLeft className="w-5 h-5" />
          Volver
        </Link>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-dark mb-3">
          {conversation.title}
        </h1>

        <div className="flex items-center gap-6 text-sm text-dark">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            <span>Creada: {formatDateTime(conversation.createdAt)}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            <span>Actualizada: {formatDateTime(conversation.updatedAt)}</span>
          </div>
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            <span>{conversation.messageCount} mensajes</span>
          </div>
        </div>
      </div>
    </div>
  );
}
