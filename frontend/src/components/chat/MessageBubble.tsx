import React from 'react';
import { Message } from '@/app/types/chat';
import { User, Bot } from 'lucide-react';
import { cn } from '@/lib/Utils';

interface MessageBubbleProps {
  message: Message;
}

export default function MessageBubble({ message }: MessageBubbleProps) {
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div
      className={cn(
        'flex gap-4',
        message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
      )}
    >
      {/* Avatar */}
      <div
        className={cn(
          'flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center',
          message.role === 'user'
            ? 'bg-primary text-white'
            : 'bg-secondary text-white'
        )}
      >
        {message.role === 'user' ? (
          <User className="w-5 h-5" />
        ) : (
          <Bot className="w-5 h-5" />
        )}
      </div>

      {/* Message content */}
      <div
        className={cn(
          'flex-1 max-w-3xl',
          message.role === 'user' ? 'text-right' : 'text-left'
        )}
      >
        <div
          className={cn(
            'inline-block p-4 rounded-lg shadow-sm',
            message.role === 'user'
              ? 'bg-primary text-white rounded-br-sm'
              : 'bg-gray-100 text-dark rounded-bl-sm'
          )}
        >
          <p className="whitespace-pre-wrap leading-relaxed">
            {message.content}
          </p>
        </div>

        <div
          className={cn(
            'mt-2 text-xs text-dark',
            message.role === 'user' ? 'text-right' : 'text-left'
          )}
        >
          {formatTime(message.timestamp)}
        </div>
      </div>
    </div>
  );
}
