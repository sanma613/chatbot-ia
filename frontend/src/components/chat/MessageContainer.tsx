import React from 'react';
import { Message } from '@/app/types/chat';
import MessageBubble from './MessageBubble';
import ConversationActions from './ConversationActions';

interface MessageContainerProps {
  messages: Message[];
}

export default function MessageContainer({ messages }: MessageContainerProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm flex flex-col h-full">
      {/* Header */}
      <div className="p-6 pb-4 border-b border-gray-100">
        <h2 className="text-lg font-semibold text-dark">Conversación</h2>
      </div>

      {/* Contenedor de mensajes con scroll */}
      <div className="flex-1 overflow-hidden">
        <div className="relative h-full">
          <div
            className="h-full overflow-y-auto p-6 pt-4 space-y-6 scroll-smooth"
            style={{
              scrollbarWidth: 'thin',
              scrollbarColor: '#d1d5db #f3f4f6',
            }}
          >
            {messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))}
          </div>

          {/* Gradiente indicador de scroll */}
          {messages.length > 3 && (
            <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-white to-transparent pointer-events-none" />
          )}
        </div>
      </div>

      {/* Acciones fijas en la parte inferior */}
      <div className="border-t border-gray-200">
        <ConversationActions />
      </div>
    </div>
  );
}
