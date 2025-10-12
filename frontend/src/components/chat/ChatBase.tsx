'use client';

import React, { useRef, useEffect } from 'react';
import Image from 'next/image';
import ReactMarkdown from 'react-markdown';
import { ThumbsUpIcon, ThumbsDownIcon } from 'lucide-react';
import { cn } from '@/lib/Utils';

// Unified Message type that supports both live chat and history preview
export interface ChatMessage {
  id: number | string;
  sender?: 'UniBot' | 'user'; // For ChatInterface format
  role?: 'user' | 'assistant'; // For Conversation history format
  text?: string; // For ChatInterface format
  content?: string; // For Conversation history format
  timestamp: string | Date;
  avatar?: string;
}

interface ChatBaseProps {
  messages: ChatMessage[];
  messageRatings?: Record<number | string, 'up' | 'down' | null>;
  onRateMessage?: (id: number | string, rating: 'up' | 'down' | null) => void;
  readonly?: boolean;
  userFullName?: string;
  showRatings?: boolean;
}

const UserAvatar = ({ fullName }: { fullName?: string }) => {
  const firstLetter = fullName?.charAt(0)?.toUpperCase() || 'U';
  return (
    <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-white font-bold">
      {firstLetter}
    </div>
  );
};

export default function ChatBase({
  messages,
  messageRatings = {},
  onRateMessage,
  readonly = false,
  userFullName,
  showRatings = true,
}: ChatBaseProps) {
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Normalize message format to handle both ChatInterface and Conversation formats
  const normalizeMessage = (msg: ChatMessage, index: number) => {
    const isUser = msg.sender === 'user' || msg.role === 'user';
    const isBot = msg.sender === 'UniBot' || msg.role === 'assistant';
    const content = msg.text || msg.content || '';

    let formattedTime: string;
    if (typeof msg.timestamp === 'string') {
      formattedTime = msg.timestamp;
    } else {
      formattedTime = msg.timestamp.toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit',
      });
    }

    // Ensure unique ID: use original id if valid, otherwise generate one
    const uniqueId =
      msg.id != null && !isNaN(Number(msg.id))
        ? String(msg.id)
        : `msg-${index}-${Date.now()}`;

    return {
      id: uniqueId,
      originalId: msg.id, // Keep original for ratings
      isUser,
      isBot,
      content,
      timestamp: formattedTime,
      avatar: msg.avatar,
    };
  };

  const handleRating = async (
    messageId: number | string,
    currentRating: 'up' | 'down' | null,
    newRating: 'up' | 'down'
  ) => {
    const finalRating = currentRating === newRating ? null : newRating;

    // Call the callback if provided
    if (onRateMessage) {
      onRateMessage(messageId, finalRating);
    }

    // Send to backend (only in interactive mode)
    if (!readonly) {
      try {
        await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/chatbot/rate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            messageId,
            rating: finalRating,
          }),
        });
      } catch (err) {
        console.warn('Failed to send rating:', err);
      }
    }
  };

  return (
    <div className="space-y-4">
      {messages.map((msg, index) => {
        const normalized = normalizeMessage(msg, index);
        const rating = messageRatings[normalized.originalId] || null;

        return (
          <div
            key={normalized.id}
            className={cn('flex flex-col group', {
              'items-end': normalized.isUser,
              'items-start': !normalized.isUser,
            })}
          >
            <div
              className={cn('flex items-start gap-4', {
                'justify-end': normalized.isUser,
              })}
            >
              {/* Bot Avatar (left side) */}
              {normalized.isBot && normalized.avatar && (
                <Image
                  src={normalized.avatar}
                  alt="Bot Avatar"
                  width={50}
                  height={40}
                  className="rounded-full object-cover"
                />
              )}

              {/* Message Bubble */}
              <div
                className={cn('relative max-w-lg p-4 rounded-2xl break-words', {
                  'bg-primary text-white rounded-tr-none shadow-md':
                    normalized.isUser,
                  'bg-gray-100 text-dark rounded-tl-none border border-gray shadow-sm':
                    !normalized.isUser,
                })}
              >
                {/* Render bot messages with Markdown */}
                {normalized.isBot ? (
                  <div className="prose prose-sm max-w-none prose-headings:mt-2 prose-headings:mb-2 prose-p:my-1 prose-ul:my-1 prose-ol:my-1 prose-li:my-0.5">
                    <ReactMarkdown
                      components={{
                        h1: ({ children }) => (
                          <h1 className="text-xl font-bold text-dark mb-2 mt-2">
                            {children}
                          </h1>
                        ),
                        h2: ({ children }) => (
                          <h2 className="text-lg font-bold text-dark mb-2 mt-2">
                            {children}
                          </h2>
                        ),
                        h3: ({ children }) => (
                          <h3 className="text-base font-bold text-dark mb-2 mt-2">
                            {children}
                          </h3>
                        ),
                        p: ({ children }) => (
                          <p className="text-dark mb-2 leading-relaxed whitespace-pre-wrap">
                            {children}
                          </p>
                        ),
                        strong: ({ children }) => (
                          <strong className="font-bold text-dark">
                            {children}
                          </strong>
                        ),
                        em: ({ children }) => (
                          <em className="italic text-dark">{children}</em>
                        ),
                        ul: ({ children }) => (
                          <ul className="list-disc list-inside space-y-1 my-2">
                            {children}
                          </ul>
                        ),
                        ol: ({ children }) => (
                          <ol className="list-decimal list-inside space-y-1 my-2">
                            {children}
                          </ol>
                        ),
                        li: ({ children }) => (
                          <li className="text-dark">{children}</li>
                        ),
                        blockquote: ({ children }) => (
                          <blockquote className="border-l-4 border-primary pl-4 py-2 my-2 bg-blue-50 rounded">
                            {children}
                          </blockquote>
                        ),
                        code: ({ children }) => (
                          <code className="bg-gray-200 px-2 py-1 rounded text-sm font-mono text-primary">
                            {children}
                          </code>
                        ),
                        pre: ({ children }) => (
                          <pre className="bg-gray-800 text-gray-100 p-3 rounded-lg overflow-x-auto my-2">
                            {children}
                          </pre>
                        ),
                      }}
                    >
                      {normalized.content}
                    </ReactMarkdown>
                  </div>
                ) : (
                  <p className="whitespace-pre-wrap">{normalized.content}</p>
                )}

                {/* Timestamp */}
                <span
                  className={cn('text-xs mt-2 block', {
                    'text-blue-200': normalized.isUser,
                    'text-gray-500': !normalized.isUser,
                  })}
                >
                  {normalized.timestamp}
                </span>
              </div>

              {/* User Avatar (right side) */}
              {normalized.isUser && <UserAvatar fullName={userFullName} />}
            </div>

            {/* Rating buttons - Only for bot messages and when not readonly */}
            {normalized.isBot && !readonly && showRatings && onRateMessage && (
              <div className="flex items-center gap-2 mt-2 mb-2 ml-16">
                <button
                  onClick={() =>
                    handleRating(normalized.originalId, rating, 'up')
                  }
                  className={cn('transition-all', {
                    'text-black': rating !== 'up',
                    'text-blue-500': rating === 'up',
                    'hover:text-blue-500': rating !== 'up',
                  })}
                  title="Me gusta"
                >
                  <ThumbsUpIcon size={18} strokeWidth={2} />
                </button>
                <button
                  onClick={() =>
                    handleRating(normalized.originalId, rating, 'down')
                  }
                  className={cn('transition-all', {
                    'text-black': rating !== 'down',
                    'text-red-500': rating === 'down',
                    'hover:text-red-500': rating !== 'down',
                  })}
                  title="No me gusta"
                >
                  <ThumbsDownIcon size={18} strokeWidth={2} />
                </button>
              </div>
            )}
          </div>
        );
      })}
      <div ref={messagesEndRef}></div>
    </div>
  );
}
