'use client';

import React, { useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { ThumbsUpIcon, ThumbsDownIcon } from 'lucide-react';
import { cn } from '@/lib/Utils';
import { rateMessage as rateMessageAPI } from '@/lib/conversationApi';

// Unified Message type that supports both live chat and history preview
export interface ChatMessage {
  id: number | string;
  sender?: 'UniBot' | 'user'; // For ChatInterface format
  role?: 'user' | 'assistant'; // For Conversation history format
  text?: string; // For ChatInterface format
  content?: string; // For Conversation history format
  timestamp: string | Date;
  avatar?: string;
  imageUrl?: string; // 🔹 NUEVO: URL de imagen adjunta (ChatInterface)
  image_url?: string; // 🔹 Soporte para formato de BD
}

interface ChatBaseProps {
  messages: ChatMessage[];
  messageRatings?: Record<number | string, 'up' | 'down' | null>;
  onRateMessage?: (id: number | string, rating: 'up' | 'down' | null) => void;
  readonly?: boolean;
  showRatings?: boolean;
  agentView?: boolean; // 🔹 NUEVO: indica si es vista de agente
}

export default function ChatBase({
  messages,
  messageRatings = {},
  onRateMessage,
  readonly = false,
  showRatings = true,
  agentView = false, // 🔹 NUEVO: default false (vista estudiante)
}: ChatBaseProps) {
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  // Track if this is the first render to do instant scroll (same as agent)
  const isFirstRenderRef = useRef(true);
  const prevMessagesLengthRef = useRef(0); // 🟢 NUEVO: Trackear cantidad anterior

  const scrollToBottom = (instant = false) => {
    messagesEndRef.current?.scrollIntoView({
      behavior: instant ? 'auto' : 'smooth',
    });
  };

  // 🟢 Scroll inicial (solo primera vez)
  useEffect(() => {
    if (isFirstRenderRef.current && messages.length > 0) {
      setTimeout(() => {
        scrollToBottom(true); // Instant scroll
        isFirstRenderRef.current = false;
        prevMessagesLengthRef.current = messages.length;
      }, 100);
    }
  }, [messages.length]);

  // 🟢 Auto-scroll para mensajes nuevos (solo si está cerca del fondo)
  useEffect(() => {
    // Skip si es primera carga
    if (isFirstRenderRef.current) return;

    // Skip si no hay mensajes nuevos
    if (messages.length <= prevMessagesLengthRef.current) {
      prevMessagesLengthRef.current = messages.length;
      return;
    }

    prevMessagesLengthRef.current = messages.length;

    const chatContainer = messagesEndRef.current?.parentElement;
    if (!chatContainer) return;

    // Check if user is near bottom (within 150px)
    const isNearBottom =
      chatContainer.scrollHeight -
      chatContainer.scrollTop -
      chatContainer.clientHeight -
      150;

    // Only auto-scroll if user is near bottom
    if (isNearBottom) {
      setTimeout(() => {
        scrollToBottom(false); // Smooth scroll
      }, 50);
    }
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
    // Use crypto.randomUUID() for truly unique IDs, with fallback for older browsers
    let uniqueId: string;
    const hasValidId =
      msg.id != null &&
      msg.id !== '' &&
      !isNaN(Number(msg.id)) &&
      String(msg.id) !== 'NaN';

    if (hasValidId) {
      uniqueId = String(msg.id);
    } else if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      uniqueId = crypto.randomUUID();
    } else {
      // Fallback: combine index, timestamp, and random number
      uniqueId = `msg-${index}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    }

    const finalImageUrl = msg.imageUrl || msg.image_url || null;

    return {
      id: uniqueId,
      originalId: msg.id, // Keep original for ratings
      isUser,
      isBot,
      content,
      timestamp: formattedTime,
      avatar: msg.avatar,
      imageUrl: finalImageUrl, // 🔹 NUEVO: Soporte para ambos formatos
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

    // Send to backend (only in interactive mode and only for non-null ratings)
    if (!readonly && finalRating) {
      try {
        await rateMessageAPI(String(messageId), finalRating);
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
              className={cn('flex items-start', {
                'justify-end': normalized.isUser,
              })}
            >
              {/* Message Bubble - No avatars */}
              <div
                className={cn('relative max-w-md p-4 rounded-2xl break-words', {
                  // Mensaje del estudiante en su vista O mensaje del agente en su vista (ambos azul derecha)
                  'bg-primary text-white rounded-tr-none shadow-md':
                    (normalized.isUser && !agentView) ||
                    (!normalized.isUser && agentView),
                  // Mensaje del bot en vista estudiante (gris izquierda)
                  'bg-gray-100 text-dark rounded-tl-none border border-gray shadow-sm':
                    !normalized.isUser && !agentView,
                  // Mensaje del usuario en vista agente (blanco izquierda)
                  'bg-white text-dark rounded-tl-none border border-gray shadow-sm':
                    normalized.isUser && agentView,
                })}
              >
                {/* Renderizar imagen si existe (ARRIBA del texto) */}
                {normalized.imageUrl ? (
                  <div className="mb-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={normalized.imageUrl}
                      alt="Imagen adjunta"
                      className="max-w-full rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                      style={{ maxHeight: '400px', objectFit: 'contain' }}
                      onClick={() => {
                        window.open(normalized.imageUrl!, '_blank');
                      }}
                      onError={(e) =>
                        console.error(
                          '❌ Error cargando imagen:',
                          normalized.imageUrl,
                          e
                        )
                      }
                    />
                  </div>
                ) : null}

                {/* Render content (texto en medio) - TODOS los mensajes usan Markdown */}
                {normalized.content ? (
                  <div
                    className={cn(
                      'prose prose-sm max-w-none prose-headings:mt-2 prose-headings:mb-2 prose-p:my-1 prose-ul:my-1 prose-ol:my-1 prose-li:my-0.5',
                      {
                        // 🔹 Fondos con texto oscuro (gris claro del bot en vista estudiante, o blanco del usuario en vista agente)
                        'prose-headings:text-dark prose-p:text-dark prose-strong:text-dark prose-em:text-dark prose-li:text-dark':
                          (!normalized.isUser && !agentView) ||
                          (normalized.isUser && agentView),
                        // 🔹 Fondos con texto blanco (azul del agente en vista agente, o azul del usuario en vista estudiante)
                        'prose-headings:text-white prose-p:text-white prose-strong:text-white prose-em:text-white prose-li:text-white':
                          (!normalized.isUser && agentView) ||
                          (normalized.isUser && !agentView),
                      }
                    )}
                  >
                    <ReactMarkdown
                      components={{
                        h1: ({ children }) => (
                          <h1
                            className={cn('text-xl font-bold mb-2 mt-2', {
                              'text-dark':
                                (!normalized.isUser && !agentView) ||
                                (normalized.isUser && agentView),
                              'text-white':
                                (!normalized.isUser && agentView) ||
                                (normalized.isUser && !agentView),
                            })}
                          >
                            {children}
                          </h1>
                        ),
                        h2: ({ children }) => (
                          <h2
                            className={cn('text-lg font-bold mb-2 mt-2', {
                              'text-dark':
                                (!normalized.isUser && !agentView) ||
                                (normalized.isUser && agentView),
                              'text-white':
                                (!normalized.isUser && agentView) ||
                                (normalized.isUser && !agentView),
                            })}
                          >
                            {children}
                          </h2>
                        ),
                        h3: ({ children }) => (
                          <h3
                            className={cn('text-base font-bold mb-2 mt-2', {
                              'text-dark':
                                (!normalized.isUser && !agentView) ||
                                (normalized.isUser && agentView),
                              'text-white':
                                (!normalized.isUser && agentView) ||
                                (normalized.isUser && !agentView),
                            })}
                          >
                            {children}
                          </h3>
                        ),
                        p: ({ children }) => (
                          <p
                            className={cn(
                              'mb-2 leading-relaxed whitespace-pre-wrap',
                              {
                                'text-dark':
                                  (!normalized.isUser && !agentView) ||
                                  (normalized.isUser && agentView),
                                'text-white':
                                  (!normalized.isUser && agentView) ||
                                  (normalized.isUser && !agentView),
                              }
                            )}
                          >
                            {children}
                          </p>
                        ),
                        strong: ({ children }) => (
                          <strong
                            className={cn('font-bold', {
                              'text-dark':
                                (!normalized.isUser && !agentView) ||
                                (normalized.isUser && agentView),
                              'text-white':
                                (!normalized.isUser && agentView) ||
                                (normalized.isUser && !agentView),
                            })}
                          >
                            {children}
                          </strong>
                        ),
                        em: ({ children }) => (
                          <em
                            className={cn('italic', {
                              'text-dark':
                                (!normalized.isUser && !agentView) ||
                                (normalized.isUser && agentView),
                              'text-white':
                                (!normalized.isUser && agentView) ||
                                (normalized.isUser && !agentView),
                            })}
                          >
                            {children}
                          </em>
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
                          <li
                            className={cn({
                              'text-dark':
                                (!normalized.isUser && !agentView) ||
                                (normalized.isUser && agentView),
                              'text-white':
                                (!normalized.isUser && agentView) ||
                                (normalized.isUser && !agentView),
                            })}
                          >
                            {children}
                          </li>
                        ),
                        blockquote: ({ children }) => (
                          <blockquote
                            className={cn('border-l-4 pl-4 py-2 my-2 rounded', {
                              // Fondos claros con texto oscuro (bot en vista estudiante o usuario en vista agente)
                              'border-primary bg-blue-50 text-dark':
                                (!normalized.isUser && !agentView) ||
                                (normalized.isUser && agentView),
                              // Fondos oscuros con texto blanco (agente en vista agente o usuario en vista estudiante)
                              'border-white/50 bg-blue-700 text-white':
                                (!normalized.isUser && agentView) ||
                                (normalized.isUser && !agentView),
                            })}
                          >
                            {children}
                          </blockquote>
                        ),
                        code: ({ children }) => (
                          <code
                            className={cn(
                              'px-2 py-1 rounded text-sm font-mono',
                              {
                                // Fondos claros → código con fondo gris
                                'bg-gray-200 text-primary':
                                  (!normalized.isUser && !agentView) ||
                                  (normalized.isUser && agentView),
                                // Fondos oscuros → código con fondo azul oscuro
                                'bg-blue-700 text-white':
                                  (!normalized.isUser && agentView) ||
                                  (normalized.isUser && !agentView),
                              }
                            )}
                          >
                            {children}
                          </code>
                        ),
                        pre: ({ children }) => (
                          <pre
                            className={cn(
                              'p-3 rounded-lg overflow-x-auto my-2',
                              {
                                // Fondos claros → pre con fondo gris oscuro
                                'bg-gray-800 text-gray-100':
                                  (!normalized.isUser && !agentView) ||
                                  (normalized.isUser && agentView),
                                // Fondos oscuros → pre con fondo azul muy oscuro
                                'bg-blue-900 text-white':
                                  (!normalized.isUser && agentView) ||
                                  (normalized.isUser && !agentView),
                              }
                            )}
                          >
                            {children}
                          </pre>
                        ),
                      }}
                    >
                      {normalized.content}
                    </ReactMarkdown>
                  </div>
                ) : null}

                {/* Timestamp (DEBAJO del texto) */}
                <span
                  className={cn('text-xs mt-2 block', {
                    'text-blue-200':
                      (normalized.isUser && !agentView) ||
                      (!normalized.isUser && agentView), // Mensajes azules
                    'text-gray-500':
                      (normalized.isUser && agentView) ||
                      (!normalized.isUser && !agentView), // Mensajes grises/blancos
                  })}
                >
                  {normalized.timestamp}
                </span>
              </div>
            </div>

            {/* Rating buttons - Only for bot messages and when not readonly */}
            {normalized.isBot && !readonly && showRatings && onRateMessage && (
              <div className="flex items-center gap-2 mt-2 mb-2">
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
