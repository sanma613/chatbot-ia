// Interfaz de chat para agentes
'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Send, CheckCircle, Mic, MicOff, Paperclip, X } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import type { AgentActiveCase, AgentMessage } from '@/types/agentRequest';
import { sendAgentMessage } from '@/lib/agentRequestApi';
import { cn } from '@/lib/Utils';
import { useWebSocketChat, WebSocketMessage } from '@/hooks/useWebSocketChat';
import { useUser } from '@/hooks/useUser';
import { useImageUpload } from '@/hooks/useImageUpload';

// Tipos para Web Speech API
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}

interface ISpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onstart: () => void;
  onend: () => void;
  onerror: (event: SpeechRecognitionErrorEvent) => void;
  onresult: (event: SpeechRecognitionEvent) => void;
}

declare global {
  interface Window {
    SpeechRecognition: new () => ISpeechRecognition;
    webkitSpeechRecognition: new () => ISpeechRecognition;
  }
}

interface AgentChatInterfaceProps {
  activeCase: AgentActiveCase;
  onResolve: (requestId: string) => Promise<void>;
  onRefresh: () => void;
}

export default function AgentChatInterface({
  activeCase,
  onResolve,
  onRefresh,
}: AgentChatInterfaceProps) {
  const { user } = useUser();
  const [messages, setMessages] = useState<AgentMessage[]>(activeCase.messages);
  const [inputValue, setInputValue] = useState('');
  const [sending, setSending] = useState(false);
  const [resolving, setResolving] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [faqs, setFaqs] = useState<Array<{ id: number; question: string }>>([]);
  // Image attachment state (same as student chat)
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const { uploadImage, uploading: uploadingImage } = useImageUpload();
  // Voice recording state
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeechSupported, setIsSpeechSupported] = useState(true);
  const recognitionRef = useRef<ISpeechRecognition | null>(null);

  // Fetch FAQs
  useEffect(() => {
    const fetchFaqs = async () => {
      const url = process.env.NEXT_PUBLIC_BACKEND_URL;
      if (!url) return;

      try {
        const response = await fetch(`${url}/faq/list-questions`, {
          credentials: 'include',
        });
        if (response.ok) {
          const data = await response.json();
          setFaqs(data.questions || []);
        }
      } catch (error) {
        console.error('Error fetching FAQs:', error);
      }
    };

    fetchFaqs();
  }, []);

  // Create welcome message with same format as student chat
  const createWelcomeMessage = useCallback(
    (questionsArray: Array<{ id: number; question: string }>): AgentMessage => {
      const firstTimestamp =
        activeCase.messages[0]?.timestamp || new Date().toISOString();

      if (questionsArray.length > 0) {
        const enumerated = questionsArray
          .map((q, i) => `${i + 1}. ${q.question}`)
          .join('\n');

        const greetingWithFAQs = `¡Hola! Soy UniBot 🤖. Estas son algunas preguntas frecuentes que puedo responder:\n\n${enumerated}\n\nTambién puedes hacerme cualquier pregunta sobre la universidad o escribir 'Agente' para hablar con un agente de soporte.`;

        return {
          id: 'welcome-agent-view',
          conversation_id: activeCase.conversation.id,
          content: greetingWithFAQs,
          role: 'assistant',
          timestamp: new Date(
            new Date(firstTimestamp).getTime() - 1000
          ).toISOString(),
          response_type: 'text',
        };
      } else {
        // Fallback simple greeting
        return {
          id: 'welcome-agent-view',
          conversation_id: activeCase.conversation.id,
          content: '¡Hola! Soy UniBot 🤖. ¿En qué puedo ayudarte hoy?',
          role: 'assistant',
          timestamp: new Date(
            new Date(firstTimestamp).getTime() - 1000
          ).toISOString(),
          response_type: 'text',
        };
      }
    },
    [activeCase.messages, activeCase.conversation.id]
  );

  // Initialize messages with welcome message
  useEffect(() => {
    const incomingMessages = activeCase.messages;

    // Check if first message is already a welcome message
    const firstMsg = incomingMessages[0];
    const isWelcomeMessage =
      firstMsg &&
      firstMsg.role === 'assistant' &&
      (firstMsg.content?.includes('¡Hola! Soy UniBot') ||
        firstMsg.content?.includes('Estas son algunas preguntas frecuentes'));

    if (!isWelcomeMessage && incomingMessages.length > 0) {
      // Create welcome message using same format as student chat
      const welcomeMsg = createWelcomeMessage(faqs);
      setMessages([welcomeMsg, ...incomingMessages]);
    } else {
      setMessages(incomingMessages);
    }
  }, [activeCase.messages, faqs, createWelcomeMessage]);

  // WebSocket message handler - receive messages from user
  const handleWebSocketMessage = useCallback(
    (wsMessage: WebSocketMessage) => {
      console.log('🔵 Agent received WebSocket message:', wsMessage);
      if (wsMessage.role === 'user') {
        const newMessage: AgentMessage = {
          id: String(wsMessage.id),
          conversation_id: activeCase.conversation.id,
          content: wsMessage.content,
          role: 'user',
          timestamp: wsMessage.timestamp,
          response_type: 'live_chat',
        };
        // Only add if message doesn't already exist
        setMessages((prev) => {
          if (prev.some((m) => m.id === newMessage.id)) {
            console.log(
              '⚠️ Duplicate message detected, skipping:',
              newMessage.id
            );
            return prev;
          }
          return [...prev, newMessage];
        });
      }
    },
    [activeCase.conversation.id]
  );

  // WebSocket connection - always enabled for agents
  const { isConnected: wsConnected, sendMessage: wsSendMessage } =
    useWebSocketChat({
      conversationId: activeCase.conversation.id,
      userId: user?.id,
      role: 'assistant',
      onMessage: handleWebSocketMessage,
      enabled: true, // Always enabled for agents
    });

  useEffect(() => {
    if (wsConnected) {
      console.log('✅ Agent WebSocket connected');
    } else {
      console.log('❌ Agent WebSocket disconnected');
    }
  }, [wsConnected]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Auto-scroll only if user is near bottom (to avoid interrupting manual scrolling)
  useEffect(() => {
    const chatContainer = messagesEndRef.current?.parentElement;
    if (!chatContainer) return;

    // Check if user is near bottom (within 100px)
    const isNearBottom =
      chatContainer.scrollHeight -
        chatContainer.scrollTop -
        chatContainer.clientHeight <
      100;

    // Only auto-scroll if user is near bottom
    if (isNearBottom) {
      scrollToBottom();
    }
  }, [messages]);

  // Note: Polling removed - WebSocket handles real-time updates

  // 🔹 Función para enviar mensaje con texto específico (usada por input y voz)
  const sendMessageWithText = useCallback(
    async (text: string) => {
      if (!text.trim() || sending) return;

      const messageContent = text.trim();
      setInputValue(''); // ✅ Limpiar input inmediatamente después de capturar el texto
      setSending(true);

      try {
        // Use WebSocket if connected, otherwise fall back to HTTP
        if (wsConnected) {
          console.log('📤 Agent sending message via WebSocket');
          wsSendMessage(messageContent);
          // Add message to local state immediately
          const newMessage: AgentMessage = {
            id: `temp-${Date.now()}-${Math.random()}`, // Temporary unique ID
            conversation_id: activeCase.conversation.id,
            content: messageContent,
            role: 'assistant',
            timestamp: new Date().toISOString(),
            response_type: 'live_chat',
          };
          setMessages((prev) => {
            // Check for duplicates by content and timestamp (within 1 second)
            const isDuplicate = prev.some(
              (m) =>
                m.role === 'assistant' &&
                m.content === messageContent &&
                Math.abs(
                  new Date(m.timestamp).getTime() -
                    new Date(newMessage.timestamp).getTime()
                ) < 1000
            );
            if (isDuplicate) {
              console.log('⚠️ Duplicate message detected, skipping');
              return prev;
            }
            return [...prev, newMessage];
          });
        } else {
          console.log('❌ WebSocket not connected, falling back to HTTP');
          const newMessage = await sendAgentMessage(
            activeCase.conversation.id,
            messageContent
          );
          setMessages((prev) => {
            // Check for duplicates by ID
            if (prev.some((m) => m.id === newMessage.id)) {
              console.log(
                '⚠️ Duplicate message detected, skipping:',
                newMessage.id
              );
              return prev;
            }
            return [...prev, newMessage];
          });
        }
      } catch (error) {
        console.error('Error enviando mensaje:', error);
        setInputValue(messageContent); // Restaurar mensaje si falla
      } finally {
        setSending(false);
      }
    },
    [sending, wsConnected, wsSendMessage, activeCase.conversation.id]
  );

  // Initialize Web Speech API for voice input
  useEffect(() => {
    if (typeof window !== 'undefined') {
      type RecogCtor = new () => ISpeechRecognition;
      const w = window as unknown as {
        SpeechRecognition?: RecogCtor;
        webkitSpeechRecognition?: RecogCtor;
      };
      const SpeechRecognition =
        w.SpeechRecognition || w.webkitSpeechRecognition;

      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = false; // Solo escucha una vez
        recognition.interimResults = false; // Solo resultados finales
        recognition.lang = 'es-ES'; // Español

        recognition.onstart = () => {
          setIsRecording(true);
          console.log('🎤 Agent: Grabación iniciada');
        };

        recognition.onend = () => {
          setIsRecording(false);
          console.log('🎤 Agent: Grabación finalizada');
        };

        recognition.onerror = (event: unknown) => {
          const ev = event as { error?: string } | undefined;
          console.error(
            '❌ Agent: Error en reconocimiento:',
            ev?.error ?? 'unknown'
          );
          setIsRecording(false);

          // For certain errors, show console warning
          if (ev?.error && ev.error !== 'aborted') {
            console.warn('Audio recognition issue:', ev.error);
          }
        };

        recognition.onresult = async (event: unknown) => {
          const ev = event as
            | {
                results?: {
                  [index: number]: { [index: number]: { transcript?: string } };
                };
              }
            | undefined;
          const transcript = ev?.results?.[0]?.[0]?.transcript ?? '';
          console.log('📝 Agent: Transcripción:', transcript);

          // Actualizar input con el texto transcrito
          setInputValue(transcript);

          // Enviar automáticamente después de transcribir
          setTimeout(() => {
            if (transcript.trim()) {
              sendMessageWithText(transcript);
            }
          }, 500);
        };

        recognitionRef.current = recognition;
        setIsSpeechSupported(true);
      } else {
        console.warn('⚠️ Speech Recognition no disponible en este navegador');
        setIsSpeechSupported(false);
      }
    } else {
      setIsSpeechSupported(false);
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // ignore
        }
      }
    };
  }, [sendMessageWithText]);

  const handleSendMessage = async () => {
    // Priority 1: Check for image upload
    if (selectedImage) {
      setSending(true);
      try {
        const result = await uploadImage({
          conversationId: activeCase.conversation.id,
          image: selectedImage,
          content: inputValue.trim(),
        });

        if (result) {
          const newMessage: AgentMessage = {
            id: result.message.id,
            conversation_id: activeCase.conversation.id,
            role: 'assistant',
            content: result.message.content || '📷 Imagen',
            image_url: result.image_url,
            response_type: result.message.response_type,
            timestamp: result.message.timestamp,
          };

          setMessages((prev) => [...prev, newMessage]);
          setInputValue('');
          handleCancelImage();
        }
      } catch (error) {
        console.error('Error enviando imagen:', error);
        alert('Error al enviar imagen. Intenta nuevamente.');
      } finally {
        setSending(false);
      }
      return; // Exit early - image sent
    }

    // Priority 2: Normal text message
    if (!inputValue.trim() || sending) return;

    const messageContent = inputValue.trim();
    setInputValue('');
    setSending(true);

    try {
      // Use WebSocket if connected, otherwise fall back to HTTP
      if (wsConnected) {
        console.log('📤 Agent sending message via WebSocket');
        wsSendMessage(messageContent);
        // Add message to local state immediately
        const newMessage: AgentMessage = {
          id: `temp-${Date.now()}-${Math.random()}`, // Temporary unique ID
          conversation_id: activeCase.conversation.id,
          content: messageContent,
          role: 'assistant',
          timestamp: new Date().toISOString(),
          response_type: 'live_chat',
        };
        setMessages((prev) => {
          // Check for duplicates by content and timestamp (within 1 second)
          const isDuplicate = prev.some(
            (m) =>
              m.role === 'assistant' &&
              m.content === messageContent &&
              Math.abs(
                new Date(m.timestamp).getTime() -
                  new Date(newMessage.timestamp).getTime()
              ) < 1000
          );
          if (isDuplicate) {
            console.log('⚠️ Duplicate message detected, skipping');
            return prev;
          }
          return [...prev, newMessage];
        });
      } else {
        console.log('❌ WebSocket not connected, falling back to HTTP');
        const newMessage = await sendAgentMessage(
          activeCase.conversation.id,
          messageContent
        );
        setMessages((prev) => {
          // Check for duplicates by ID
          if (prev.some((m) => m.id === newMessage.id)) {
            console.log(
              '⚠️ Duplicate message detected, skipping:',
              newMessage.id
            );
            return prev;
          }
          return [...prev, newMessage];
        });
      }
    } catch (error) {
      console.error('Error enviando mensaje:', error);
      setInputValue(messageContent); // Restaurar mensaje si falla
    } finally {
      setSending(false);
    }
  };

  const handleResolve = async () => {
    setResolving(true);
    try {
      await onResolve(activeCase.request.id);
      onRefresh();
    } catch (error) {
      console.error('Error resolviendo caso:', error);
    } finally {
      setResolving(false);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // 🔹 Función para manejar selección de imagen (same as student chat)
  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      // Validar tamaño (10MB max)
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        alert('La imagen es demasiado grande. Tamaño máximo: 10MB');
        return;
      }

      setSelectedImage(file);

      // Crear preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // 🔹 Función para cancelar imagen seleccionada
  const handleCancelImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // 🔹 Función para abrir selector de archivos (same as student chat)
  const handleAttachClick = () => {
    if (fileInputRef.current && !sending) {
      fileInputRef.current.click();
    }
  };

  // 🔹 Toggle grabación de audio (modo clásico: presionar → grabar → soltar → enviar)
  const toggleRecording = () => {
    if (!isSpeechSupported || !recognitionRef.current) {
      console.warn('SpeechRecognition not supported in this browser');
      return;
    }

    if (sending) {
      return;
    }

    if (isRecording) {
      // Detener grabación
      try {
        recognitionRef.current?.stop();
      } catch (e) {
        console.error('Error stopping recognition:', e);
      }
    } else {
      // Iniciar grabación simple
      try {
        recognitionRef.current?.start();
      } catch (e) {
        console.error('Error starting recognition:', e);
      }
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header del caso - Same style as student chat */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
        <div>
          <h1 className="text-xl font-semibold text-dark">
            Conversación con {activeCase.user_info.name}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {activeCase.user_info.email}
          </p>
        </div>
        <button
          onClick={handleResolve}
          disabled={resolving}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-colors text-sm',
            resolving
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-success text-white hover:bg-green-700'
          )}
        >
          <CheckCircle size={18} />
          {resolving ? 'Resolviendo...' : 'Marcar como Resuelto'}
        </button>
      </div>

      {/* Mensajes - Using same styles as ChatBase */}
      <div className="flex-1 overflow-y-auto p-6 bg-white">
        <div className="space-y-4">
          {messages.map((message) => {
            // Determine message type:
            // - 'user' role = student messages (LEFT side - external messages)
            // - 'assistant' role = bot OR agent (RIGHT side - internal messages, like WhatsApp)
            const isUser = message.role === 'user';
            const isAssistant = message.role === 'assistant';

            return (
              <div
                key={message.id}
                className={cn('flex flex-col group', {
                  'items-end': isAssistant, // ALL assistant messages (bot + agent) on right
                  'items-start': isUser, // Student messages on left
                })}
              >
                <div
                  className={cn('flex items-start', {
                    'justify-end': isAssistant,
                  })}
                >
                  {/* Message Bubble - No avatars */}
                  <div
                    className={cn(
                      'relative max-w-md p-4 rounded-2xl break-words',
                      {
                        'bg-primary text-white rounded-tr-none shadow-md':
                          isAssistant, // Bot + Agent = blue (right side)
                        'bg-gray-100 text-dark rounded-tl-none border border-gray shadow-sm':
                          isUser, // Student = gray (left side)
                      }
                    )}
                  >
                    {/* Image attachment (ARRIBA del texto) */}
                    {message.image_url && (
                      <div className="mb-2">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={message.image_url}
                          alt="Imagen adjunta"
                          className="max-w-full rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                          style={{ maxHeight: '400px', objectFit: 'contain' }}
                          onClick={() =>
                            window.open(message.image_url!, '_blank')
                          }
                        />
                      </div>
                    )}

                    {/* Render assistant messages (both agent and bot) with Markdown */}
                    {isAssistant ? (
                      <div className="prose prose-sm max-w-none prose-headings:mt-2 prose-headings:mb-2 prose-p:my-1 prose-ul:my-1 prose-ol:my-1 prose-li:my-0.5">
                        <ReactMarkdown
                          components={{
                            h1: ({ children }) => (
                              <h1 className="text-xl font-bold text-white mb-2 mt-2">
                                {children}
                              </h1>
                            ),
                            h2: ({ children }) => (
                              <h2 className="text-lg font-bold text-white mb-2 mt-2">
                                {children}
                              </h2>
                            ),
                            h3: ({ children }) => (
                              <h3 className="text-base font-bold text-white mb-2 mt-2">
                                {children}
                              </h3>
                            ),
                            p: ({ children }) => (
                              <p className="text-white mb-2 leading-relaxed whitespace-pre-wrap">
                                {children}
                              </p>
                            ),
                            strong: ({ children }) => (
                              <strong className="font-bold text-white">
                                {children}
                              </strong>
                            ),
                            em: ({ children }) => (
                              <em className="italic text-white">{children}</em>
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
                              <li className="text-white">{children}</li>
                            ),
                            blockquote: ({ children }) => (
                              <blockquote className="border-l-4 border-white border-opacity-50 pl-4 py-2 my-2 bg-white bg-opacity-10 rounded text-white">
                                {children}
                              </blockquote>
                            ),
                            code: ({ children }) => (
                              <code className="bg-white bg-opacity-20 px-2 py-1 rounded text-sm font-mono text-white">
                                {children}
                              </code>
                            ),
                            pre: ({ children }) => (
                              <pre className="bg-dark text-white p-3 rounded-lg overflow-x-auto my-2 border border-white border-opacity-20">
                                {children}
                              </pre>
                            ),
                          }}
                        >
                          {message.content}
                        </ReactMarkdown>
                      </div>
                    ) : (
                      <p className="whitespace-pre-wrap">{message.content}</p>
                    )}

                    {/* Timestamp (DEBAJO del texto) */}
                    <span
                      className={cn('text-xs mt-2 block', {
                        'text-blue-200': isAssistant, // All assistant messages (bot + agent) in light blue
                        'text-gray-500': isUser, // Student in gray
                      })}
                    >
                      {formatTime(message.timestamp)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Preview de imagen seleccionada */}
      {imagePreview && (
        <div className="px-4 pt-3 pb-2 bg-gray-50 border-t border-gray-200">
          <div className="flex items-center gap-2 bg-white p-2 rounded-lg border border-gray-200">
            <div className="relative w-12 h-12 flex-shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imagePreview}
                alt="Preview"
                className="w-full h-full object-cover rounded"
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-700 truncate">
                {selectedImage?.name}
              </p>
              <p className="text-xs text-slate-500">
                {selectedImage
                  ? `${(selectedImage.size / 1024).toFixed(1)} KB`
                  : ''}
              </p>
            </div>
            <button
              onClick={handleCancelImage}
              className="text-red-400 hover:text-red-600 transition-colors"
              title="Cancelar imagen"
            >
              <X size={18} />
            </button>
          </div>
        </div>
      )}

      {/* Input de mensaje - Same style as student chat */}
      <div className="p-4 bg-white border-t border-gray-200">
        <div className="relative flex items-center">
          <div className="absolute left-5 flex gap-3">
            {/* 🎤 Botón de Micrófono con animación */}
            <button
              onClick={toggleRecording}
              disabled={sending || !isSpeechSupported}
              className={cn('transition-all duration-200', {
                'text-red-500 animate-pulse': isRecording,
                'text-primary hover:text-secondary':
                  !isRecording && !sending && isSpeechSupported,
                'text-gray-400 cursor-not-allowed':
                  sending || !isSpeechSupported,
              })}
              title={
                !isSpeechSupported
                  ? 'Reconocimiento de voz no disponible en este navegador'
                  : isRecording
                    ? 'Click para detener grabación'
                    : 'Click para grabar mensaje de voz'
              }
            >
              {isRecording ? <MicOff size={22} /> : <Mic size={22} />}
            </button>

            {/* Input oculto para seleccionar archivos */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageSelect}
              className="hidden"
            />

            {/* Botón de adjuntar archivo */}
            <button
              onClick={handleAttachClick}
              className={cn('transition-colors', {
                'text-primary hover:text-secondary cursor-pointer':
                  !sending && !uploadingImage,
                'text-gray-400 cursor-not-allowed': sending || uploadingImage,
              })}
              disabled={sending || uploadingImage}
              title={uploadingImage ? 'Subiendo imagen...' : 'Adjuntar imagen'}
            >
              <Paperclip size={22} />
            </button>
          </div>

          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="Escribe tu mensaje o usa el micrófono..."
            disabled={sending}
            className="w-full pl-24 pr-14 py-3 border-2 border-gray-200 rounded-full focus:outline-none focus:border-primary transition-colors text-dark disabled:bg-gray-100"
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || sending}
            className="absolute right-3 p-2.5 rounded-full transition-colors bg-primary text-white hover:bg-secondary"
          >
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}
