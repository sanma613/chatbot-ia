'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Mic, MicOff, Paperclip, Send, X } from 'lucide-react';
import removeMarkdown from 'remove-markdown';
import { useUser } from '@/hooks/useUser';
import { cn } from '@/lib/Utils';
import ChatBase from './chat/ChatBase';
import {
  sendChatMessage,
  rateMessage as rateMessageAPI,
} from '@/lib/conversationApi';
import { useEscalationStatus } from '@/hooks/useEscalationStatus';
import { useWebSocketChat, WebSocketMessage } from '@/hooks/useWebSocketChat';
import { useImageUpload } from '@/hooks/useImageUpload';

type Question = {
  id: number;
  question: string;
};

type Message = {
  id: number | string; // Support both number (local) and string (UUID from API)
  sender: 'UniBot' | 'user';
  text: string;
  timestamp: string;
  avatar?: string;
  rating?: 'up' | 'down' | null;
  imageUrl?: string; // 🔹 NUEVO: URL de imagen adjunta
};

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

interface ChatInterfaceProps {
  initialMessages?: Message[];
  conversationId?: string;
  conversationTitle?: string;
}

export default function ChatInterface({
  initialMessages = [],
  conversationId: propConversationId,
  conversationTitle,
}: ChatInterfaceProps) {
  // 🔹 DEBUG: Log al recibir initialMessages
  useEffect(() => {
    console.log('📥 ChatInterface - Recibió initialMessages:', {
      count: initialMessages.length,
      withImages: initialMessages.filter((m) => m.imageUrl).length,
      sample: initialMessages[0]
        ? {
            id: initialMessages[0].id,
            sender: initialMessages[0].sender,
            hasImageUrl: !!initialMessages[0].imageUrl,
            imageUrl: initialMessages[0].imageUrl,
          }
        : null,
    });
  }, [initialMessages]);

  const { user, loading } = useUser();
  const [inputValue, setInputValue] = useState('');
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [messageRatings, setMessageRatings] = useState<
    Record<number | string, 'up' | 'down' | null>
  >({});
  const [questions, setQuestions] = useState<Question[]>([]);
  const [faqsLoaded, setFaqsLoaded] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeechSupported, setIsSpeechSupported] = useState(true);
  const [voiceMode, setVoiceMode] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const recognitionRef = useRef<ISpeechRecognition | null>(null);
  const [speakResponses, setSpeakResponses] = useState(false);
  // Conversation tracking
  const [conversationId, setConversationId] = useState<string | undefined>(
    propConversationId
  );
  // Store latest assistant message ID for potential future features (e.g., message actions)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [assistantMessageId, setAssistantMessageId] = useState<
    string | undefined
  >();
  // Track if we're creating the first conversation
  const [isCreatingConversation, setIsCreatingConversation] = useState(false);
  // Track if we're waiting for bot response (cooldown)
  const [isWaitingForResponse, setIsWaitingForResponse] = useState(false);
  // Refs to hold latest values for callbacks (avoid stale closures)
  const speakResponsesRef = useRef<boolean>(speakResponses);
  const voiceModeRef = useRef<boolean>(voiceMode);
  const ttsPlayingRef = useRef<boolean>(false);
  const waitingForResponseRef = useRef<boolean>(false);
  const blockedRef = useRef<boolean>(blocked);
  const hasActiveAgentRef = useRef<boolean>(false); // 🔹 NUEVO: Track agent status
  // Store welcome message with fixed timestamp (created once)
  const welcomeMessageRef = useRef<Message | null>(null);
  const welcomeTimestampRef = useRef<string>(
    new Date().toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    })
  );
  // Image attachment state
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const { uploadImage, uploading: uploadingImage } = useImageUpload();

  // Helper function to create welcome message with FAQs (with fixed timestamp)
  const createWelcomeMessage = useCallback(
    (questionsArray: Question[]): Message => {
      // Return cached message if it exists and has the same FAQ count
      if (welcomeMessageRef.current && questionsArray.length > 0) {
        const currentFaqCount =
          welcomeMessageRef.current.text
            ?.split('\n')
            .filter((line) => /^\d+\./.test(line)).length || 0;
        if (currentFaqCount === questionsArray.length) {
          return welcomeMessageRef.current;
        }
      }

      if (questionsArray.length > 0) {
        const enumerated = questionsArray
          .map((q: Question, i: number) => `${i + 1}. ${q.question}`)
          .join('\n');

        const greetingWithFAQs = `¡Hola! Soy UniBot 🤖. Estas son algunas preguntas frecuentes que puedo responder:\n\n${enumerated}\n\nTambién puedes hacerme cualquier pregunta sobre la universidad o escribir 'Agente' para hablar con un agente de soporte.`;

        const message = {
          id: 'welcome-local',
          sender: 'UniBot' as const,
          avatar: '/images/logo_uni.png',
          text: greetingWithFAQs,
          timestamp: welcomeTimestampRef.current,
        };

        welcomeMessageRef.current = message;
        return message;
      } else {
        // Fallback simple greeting
        const message = {
          id: 'welcome-local',
          sender: 'UniBot' as const,
          avatar: '/images/logo_uni.png',
          text: '¡Hola! Soy UniBot 🤖. ¿En qué puedo ayudarte hoy?',
          timestamp: welcomeTimestampRef.current,
        };

        welcomeMessageRef.current = message;
        return message;
      }
    },
    []
  );

  // Sync messages when initialMessages change (for conversation history)
  // Don't regenerate welcome message if conversation already has messages
  useEffect(() => {
    if (initialMessages.length > 0 && faqsLoaded) {
      // Check if first message is already a welcome message from backend
      const firstMsg = initialMessages[0];
      const isWelcomeFromBackend =
        firstMsg &&
        firstMsg.sender === 'UniBot' &&
        (firstMsg.text?.includes('¡Hola! Soy UniBot') ||
          firstMsg.text?.includes('Estas son algunas preguntas frecuentes'));

      if (isWelcomeFromBackend) {
        // Use original messages with their original timestamps
        setMessages(initialMessages);
      } else {
        // Only prepend welcome if it doesn't exist
        const welcomeMsg = createWelcomeMessage(questions);
        setMessages([welcomeMsg, ...initialMessages]);
      }
    }
  }, [initialMessages, questions, createWelcomeMessage, faqsLoaded]);

  // Initialize messageRatings from loaded messages
  useEffect(() => {
    if (initialMessages.length > 0) {
      const ratings: Record<number | string, 'up' | 'down' | null> = {};
      initialMessages.forEach((msg) => {
        if (msg.rating) {
          ratings[msg.id] = msg.rating;
        }
      });
      setMessageRatings(ratings);
    }
  }, [initialMessages]);

  useEffect(() => {
    speakResponsesRef.current = speakResponses;
  }, [speakResponses]);

  useEffect(() => {
    voiceModeRef.current = voiceMode;
  }, [voiceMode]);

  useEffect(() => {
    blockedRef.current = blocked;
  }, [blocked]);

  // Monitor escalation status and unblock chat when agent takes the case
  // Enable polling for active chat to detect when agent takes the case
  const { status: escalationStatus } = useEscalationStatus(
    conversationId || undefined,
    { enablePolling: true }
  );

  // 🔹 Update hasActiveAgentRef when escalation status changes
  useEffect(() => {
    const hasActive =
      (escalationStatus?.is_escalated &&
        escalationStatus?.agent_request?.status === 'in_progress') ||
      false;
    hasActiveAgentRef.current = hasActive;
  }, [escalationStatus]);

  useEffect(() => {
    if (escalationStatus) {
      if (escalationStatus.is_escalated) {
        const agentRequest = escalationStatus.agent_request;

        // If agent has taken the case (status = 'in_progress'), unblock the chat
        if (agentRequest && agentRequest.status === 'in_progress') {
          setBlocked(false);
          console.log('✅ Agent took the case - Chat unblocked');
        }
        // If case is resolved, keep blocked (conversation ended)
        else if (agentRequest && agentRequest.status === 'resolved') {
          setBlocked(true);
          console.log('⚠️ Case resolved - Chat remains blocked');
        }
        // If pending (waiting for agent), keep blocked
        else if (agentRequest && agentRequest.status === 'pending') {
          setBlocked(true);
          console.log('⏳ Waiting for agent - Chat blocked');
        }
      }
    }
  }, [escalationStatus]);

  // Check if agent is actively chatting (for WebSocket)
  const hasActiveAgent =
    escalationStatus?.is_escalated &&
    escalationStatus?.agent_request?.status === 'in_progress';

  // Autofocus input after cooldown ends
  useEffect(() => {
    if (!isWaitingForResponse && !blocked && !voiceMode && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isWaitingForResponse, blocked, voiceMode]);

  // TTS helper: uses SpeechSynthesis and restarts recognition when finished
  const speakText = useCallback((text: string) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    if (!speakResponsesRef.current) return;

    try {
      const synth = window.speechSynthesis;
      // stop any ongoing speech
      try {
        synth.cancel();
      } catch {
        // ignore
      }

      // stop any ongoing recognition to avoid self-pickup
      try {
        recognitionRef.current?.abort();
      } catch {
        // ignore
      }

      // mark that we're about to play TTS so recognition.onend won't restart the mic
      ttsPlayingRef.current = true;

      const cleanText = removeMarkdown(text);

      const utter = new SpeechSynthesisUtterance(cleanText);
      utter.lang = 'es-ES';
      // choose spanish voice if available
      const voices = synth.getVoices();
      const spanish = voices.find((v) => v.lang?.startsWith('es')) || voices[0];
      if (spanish) utter.voice = spanish;

      utter.onend = () => {
        // TTS finished
        ttsPlayingRef.current = false;
        // After speaking, if voice mode still active and not blocked, restart recognition
        setTimeout(() => {
          if (
            voiceModeRef.current &&
            speakResponsesRef.current &&
            !blockedRef.current
          ) {
            try {
              recognitionRef.current?.start();
            } catch {
              // some browsers throw if start called too quickly; ignore
            }
          }
        }, 250);
      };

      synth.speak(utter);
    } catch (e) {
      console.warn('TTS failed', e);
    }
  }, []);

  // � WebSocket message handler for real-time chat with agent
  const handleWebSocketMessage = useCallback(
    (wsMessage: WebSocketMessage) => {
      // Only add messages from the agent (not our own)
      if (wsMessage.role === 'assistant') {
        const newMessage: Message = {
          id: wsMessage.id,
          sender: 'UniBot',
          avatar: '/images/logo_uni.png',
          text: wsMessage.content,
          timestamp: new Date(wsMessage.timestamp).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          }),
          imageUrl: wsMessage.image_url, // 🔹 Mapear image_url a imageUrl
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

        // 🔹 NO llamar speakText cuando hay agente activo (TTS deshabilitado en chat con agente)
        // El agente está respondiendo en tiempo real, no queremos lectura automática
      }
    },
    [] // 🔹 Removido speakText de las dependencias
  );

  // 🔌 WebSocket for real-time chat with agent
  const { isConnected: wsConnected, sendMessage: wsSendMessage } =
    useWebSocketChat({
      conversationId,
      userId: user?.id,
      role: 'user',
      onMessage: handleWebSocketMessage,
      enabled: hasActiveAgent,
    });

  // �🔹 Enviar pregunta de FAQ (memoized) - WITH CONVERSATION TRACKING
  const sendFaqToBackend = useCallback(
    async (questionId: number) => {
      const url = process.env.NEXT_PUBLIC_BACKEND_URL;
      try {
        // DECISION POINT: Does conversation exist?
        const isFirstMessage = !conversationId;

        if (isFirstMessage) {
          setIsCreatingConversation(true);
        }

        // Use POST endpoint with conversation tracking
        const res = await fetch(`${url}/faq/get_answer/${questionId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            conversation_id: conversationId || null,
          }),
        });

        if (res.ok) {
          const data = await res.json();

          const answerText = data.answer ?? '';

          // Update conversation ID if this is a new conversation
          if (data.conversation_id && !conversationId) {
            setConversationId(data.conversation_id);
            localStorage.setItem('currentConversationId', data.conversation_id);

            // If it was first message, fetch full conversation to get all messages
            if (isFirstMessage) {
              const { getConversationById } = await import(
                '@/lib/conversationApi'
              );
              const conversationData = await getConversationById(
                data.conversation_id
              );

              // Convert messages to UI format
              const convertedMessages: Message[] =
                conversationData.messages.map((msg) => ({
                  id: msg.id,
                  sender: msg.role === 'user' ? 'user' : 'UniBot',
                  text: msg.content,
                  timestamp:
                    typeof msg.timestamp === 'string'
                      ? new Date(msg.timestamp).toLocaleTimeString('es-ES', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : new Date().toLocaleTimeString('es-ES', {
                          hour: '2-digit',
                          minute: '2-digit',
                        }),
                  avatar:
                    msg.role === 'assistant'
                      ? '/images/logo_uni.png'
                      : undefined,
                  rating: msg.rating,
                  imageUrl: msg.image_url, // 🔹 Mapear image_url a imageUrl
                }));

              // Prepend welcome message and set messages
              const welcomeMsg = createWelcomeMessage(questions);
              setMessages([welcomeMsg, ...convertedMessages]);

              setIsCreatingConversation(false);
            } else {
              // Existing conversation - just append the response
              setMessages((prev: Message[]) => [
                ...prev,
                {
                  id: data.assistant_message_id || Date.now(),
                  sender: 'UniBot',
                  avatar: '/images/logo_uni.png',
                  text: answerText,
                  timestamp: new Date().toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  }),
                },
              ]);
            }
          } else {
            // Existing conversation - just append the response
            setMessages((prev: Message[]) => [
              ...prev,
              {
                id: data.assistant_message_id || Date.now(),
                sender: 'UniBot',
                avatar: '/images/logo_uni.png',
                text: answerText,
                timestamp: new Date().toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                }),
              },
            ]);
          }

          // Store assistant message ID for potential rating
          if (data.assistant_message_id) {
            setAssistantMessageId(data.assistant_message_id);
          }

          // chatbot responded: we're no longer waiting
          waitingForResponseRef.current = false;
          setIsWaitingForResponse(false);

          // speak and auto-restart mic
          // 🔹 SOLO hablar si NO hay agente activo
          const hasActiveAgent =
            escalationStatus?.is_escalated &&
            escalationStatus?.agent_request?.status === 'in_progress';
          if (!hasActiveAgent) {
            speakText(answerText);
          }
        }
      } catch (error) {
        console.error('Error fetching FAQ answer:', error);
        setIsCreatingConversation(false);
        waitingForResponseRef.current = false;
        setIsWaitingForResponse(false);
      }
    },
    [
      speakText,
      conversationId,
      createWelcomeMessage,
      questions,
      escalationStatus?.is_escalated,
      escalationStatus?.agent_request?.status,
    ]
  );

  // 🔹 Enviar pregunta libre al chatbot académico (memoized) - WITH AUTOMATIC CONVERSATION CREATION
  const sendToAcademicChatbot = useCallback(
    async (question: string) => {
      try {
        // DECISION POINT: Does conversation exist?
        if (!conversationId) {
          // ===== FIRST MESSAGE - CREATE CONVERSATION (WITHOUT WELCOME MESSAGE) =====
          setIsCreatingConversation(true);

          // Import the new API function
          const { startConversation } = await import('@/lib/conversationApi');

          // Create conversation with user message + AI response
          // Welcome message is NOT stored - added dynamically in UI
          const conversationData = await startConversation(question);

          setIsCreatingConversation(false);

          // Update conversation ID
          setConversationId(conversationData.conversation.id);

          // Store in localStorage for persistence
          localStorage.setItem(
            'currentConversationId',
            conversationData.conversation.id
          );

          // Convert messages to UI format
          const convertedMessages: Message[] = conversationData.messages.map(
            (msg) => ({
              id: msg.id,
              sender: msg.role === 'user' ? 'user' : 'UniBot',
              text: msg.content,
              timestamp:
                typeof msg.timestamp === 'string'
                  ? new Date(msg.timestamp).toLocaleTimeString('es-ES', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  : new Date().toLocaleTimeString('es-ES', {
                      hour: '2-digit',
                      minute: '2-digit',
                    }),
              avatar:
                msg.role === 'assistant' ? '/images/logo_uni.png' : undefined,
              imageUrl: msg.image_url, // 🔹 Mapear image_url a imageUrl
            })
          );

          // Prepend welcome message and set messages
          const welcomeMsg = createWelcomeMessage(questions);
          setMessages([welcomeMsg, ...convertedMessages]);

          // Speak the AI response (last message)
          const aiResponse =
            conversationData.messages[conversationData.messages.length - 1];
          if (aiResponse && aiResponse.role === 'assistant') {
            // 🔹 SOLO hablar si NO hay agente activo
            const hasActiveAgent =
              escalationStatus?.is_escalated &&
              escalationStatus?.agent_request?.status === 'in_progress';
            if (!hasActiveAgent) {
              speakText(aiResponse.content);
            }
          }

          // Store latest assistant message ID
          if (aiResponse) {
            setAssistantMessageId(aiResponse.id);
          }

          // Check if conversation was escalated
          if (conversationData.conversation.is_escalated) {
            setBlocked(true);
            setVoiceMode(false);
            setSpeakResponses(false);
          }

          waitingForResponseRef.current = false;
          setIsWaitingForResponse(false);
        } else {
          // ===== SUBSEQUENT MESSAGE - USE EXISTING CONVERSATION =====
          const data = await sendChatMessage(question, conversationId);

          const answerText = data.answer ?? '';

          // Store the assistant message ID for potential rating
          if (data.assistant_message_id) {
            setAssistantMessageId(data.assistant_message_id);
          }

          // chatbot responded: we're no longer waiting
          waitingForResponseRef.current = false;
          setIsWaitingForResponse(false);

          setMessages((prev: Message[]) => [
            ...prev,
            {
              id: data.assistant_message_id || Date.now(),
              sender: 'UniBot',
              avatar: '/images/logo_uni.png',
              text: answerText,
              timestamp: new Date().toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              }),
            },
          ]);

          // 🔹 SOLO hablar si NO hay agente activo
          const hasActiveAgent =
            escalationStatus?.is_escalated &&
            escalationStatus?.agent_request?.status === 'in_progress';
          if (!hasActiveAgent) {
            speakText(answerText);
          }

          // Check if conversation was escalated
          if (data.escalated) {
            setBlocked(true);
            setVoiceMode(false);
            setSpeakResponses(false);
          }
        }
      } catch (error: unknown) {
        console.error('Error sending message to academic chatbot:', error);
        setIsCreatingConversation(false);
        waitingForResponseRef.current = false;
        setIsWaitingForResponse(false);

        // If conversation not found (404), clear the invalid conversation ID
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        const is404 =
          errorMessage.includes('404') || errorMessage.includes('not found');

        if (is404) {
          console.warn(
            'Conversation not found. Clearing stored conversation ID.'
          );
          setConversationId(undefined);
          localStorage.removeItem('currentConversationId');
        }

        const errorMsg = is404
          ? 'La conversación no existe. Por favor, inicia una nueva conversación.'
          : 'Hubo un problema al procesar tu consulta. Intenta nuevamente más tarde.';
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now(),
            sender: 'UniBot',
            avatar: '/images/logo_uni.png',
            text: errorMsg,
            timestamp: new Date().toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            }),
          },
        ]);

        speakText(errorMsg);
      }
    },
    [
      speakText,
      conversationId,
      createWelcomeMessage,
      questions,
      escalationStatus?.is_escalated,
      escalationStatus?.agent_request?.status,
    ]
  );
  // 🔹 Manejo del envío de mensajes (texto) - usa las funciones memoizadas
  const handleSendMessageWithText = useCallback(
    (text: string) => {
      // Check if agent is actively chatting (no cooldown needed)
      const hasActiveAgent =
        escalationStatus?.is_escalated &&
        escalationStatus?.agent_request?.status === 'in_progress';

      // If there's an active agent, don't apply cooldown check
      if (text.trim() === '' || blocked) return;
      if (!hasActiveAgent && isWaitingForResponse) return;

      const newMessage: Message = {
        id: Date.now(),
        sender: 'user',
        text: text,
        timestamp: new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        }),
      };

      // Only add if message doesn't already exist (check by id)
      setMessages((prev: Message[]) => {
        if (prev.some((m) => m.id === newMessage.id)) {
          console.log(
            '⚠️ Duplicate message detected, skipping:',
            newMessage.id
          );
          return prev;
        }
        return [...prev, newMessage];
      });

      const trimmed = text.trim().toLowerCase();

      // ✅ REMOVED: Local "agente" detection - let backend handle escalation
      // Now the message will be sent to backend, which will detect and escalate properly

      const selectedNumber = parseInt(trimmed, 10);

      // Only apply cooldown if there's NO active agent
      if (!hasActiveAgent) {
        waitingForResponseRef.current = true;
        setIsWaitingForResponse(true);
      }

      if (
        !isNaN(selectedNumber) &&
        selectedNumber > 0 &&
        selectedNumber <= questions.length
      ) {
        const selectedQuestion = questions[selectedNumber - 1];
        sendFaqToBackend(selectedQuestion.id);
      } else {
        // Check if we should use WebSocket or HTTP
        if (hasActiveAgent && wsConnected) {
          // Send via WebSocket for real-time chat with agent
          const sent = wsSendMessage(text);
          if (sent) {
            console.log('📤 Message sent via WebSocket');
            // Message will be saved by backend and broadcasted
          } else {
            console.error(
              '❌ Failed to send via WebSocket, falling back to HTTP'
            );
            sendToAcademicChatbot(text);
          }
        } else {
          // Normal chatbot flow
          sendToAcademicChatbot(text);
        }
      }

      setInputValue('');
    },
    [
      blocked,
      isWaitingForResponse,
      questions,
      sendFaqToBackend,
      sendToAcademicChatbot,
      escalationStatus,
      wsConnected,
      wsSendMessage,
    ]
  );

  // Note: Auto-scroll is handled by ChatBase component
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
          console.log('✅ Recognition started', {
            hasActiveAgent: hasActiveAgentRef.current,
          });
        };

        recognition.onend = () => {
          setIsRecording(false);
          console.log('🎤 Grabación finalizada', {
            hasActiveAgent: hasActiveAgentRef.current,
          });

          // 🔹 Si hay agente activo, NO reiniciar reconocimiento automáticamente
          if (hasActiveAgentRef.current) {
            console.log('✅ Modo agente: No reiniciar reconocimiento');
            return; // Salir aquí - cada grabación es independiente en modo agente
          }

          // 🔹 Comportamiento original para modo bot (reinicio automático)
          // If TTS is playing (we intentionally aborted recognition before speaking), or
          // we're waiting for the chatbot response, don't auto-restart here.
          if (ttsPlayingRef.current || waitingForResponseRef.current) {
            console.log('🎧 TTS is playing — not restarting recognition now');
            return;
          }
          // If voiceMode is active, try to restart recognition to keep the loop
          if (voiceModeRef.current && !blockedRef.current) {
            try {
              recognitionRef.current?.start();
              console.log('🔄 Reiniciando reconocimiento (modo voz continuo)');
            } catch (e) {
              console.warn('No se pudo reiniciar reconocimiento:', e);
            }
          }
        };

        recognition.onerror = (event: unknown) => {
          const ev = event as { error?: string } | undefined;
          // If the error is 'aborted' it's likely from our own recognitionRef.current.abort()
          // (we abort before TTS or when stopping voiceMode). Ignore that to avoid noisy logs.
          if (ev?.error === 'aborted') {
            setIsRecording(false);
            return;
          }

          console.error('❌ Error en reconocimiento:', ev?.error ?? 'unknown');
          setIsRecording(false);

          const errorMessages: { [key: string]: string } = {
            'no-speech': 'No se detectó voz. Por favor, intenta de nuevo.',
            'audio-capture': 'No se pudo acceder al micrófono.',
            'not-allowed':
              'Permiso de micrófono denegado. Verifica la configuración de tu navegador.',
            network: 'Error de red. Verifica tu conexión a internet.',
            aborted: 'Grabación cancelada.',
          };

          // Only log the audio error to console (do not show any message in chat)
          console.warn(
            'Audio recognition issue:',
            errorMessages[ev?.error || ''] || ev?.error || 'unknown'
          );
          // For certain errors (permission/network), disable continuous voice mode
          const critical = ['not-allowed', 'audio-capture', 'network'];
          if (ev?.error && critical.includes(ev.error)) {
            // disable voice mode silently
            setVoiceMode(false);
            setSpeakResponses(false);
            try {
              recognitionRef.current?.abort();
            } catch {
              // ignore
            }
            console.warn(
              'Voice mode disabled due to critical audio error:',
              ev.error
            );
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
          console.log('📝 Transcripción recibida:', transcript, {
            hasActiveAgent: hasActiveAgentRef.current,
          });

          // Actualizar input con el texto transcrito
          setInputValue(transcript);

          // 🔹 Si hay agente activo, enviar inmediatamente SIN cooldown
          if (hasActiveAgentRef.current) {
            console.log('� Enviando mensaje en modo agente (sin cooldown)');
            setTimeout(() => {
              handleSendMessageWithText(transcript);
            }, 300); // Reducido a 300ms para mejor UX
            return;
          }

          // 🔹 Comportamiento original (con cooldown para bot)
          setTimeout(() => {
            // mark that we're waiting for the chatbot's response so the mic doesn't restart
            try {
              waitingForResponseRef.current = true;
            } catch {
              // ignore
            }
            handleSendMessageWithText(transcript);
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
  }, [
    handleSendMessageWithText,
    escalationStatus?.is_escalated,
    escalationStatus?.agent_request?.status,
  ]);

  // 🎤 Toggle grabación de audio
  const toggleRecording = () => {
    console.log('🎙️ toggleRecording llamado', {
      isRecording,
      hasActiveAgent: hasActiveAgentRef.current,
      blocked,
      voiceMode,
    });

    if (!isSpeechSupported || !recognitionRef.current) {
      console.warn(
        'SpeechRecognition not supported in this browser. Voice mode unavailable.'
      );
      return;
    }

    if (blocked) {
      console.log('⚠️ Chat bloqueado, no se puede grabar');
      return;
    }

    // 🔹 MODO AGENTE: Comportamiento simple como AgentChatInterface
    if (hasActiveAgentRef.current) {
      // Si ya está grabando, detener manualmente
      if (isRecording) {
        try {
          recognitionRef.current.stop();
          console.log('� Deteniendo grabación manualmente (modo agente)');
        } catch (e) {
          console.error('Error stopping recognition:', e);
        }
        return;
      }

      // Si NO está grabando, iniciar
      try {
        console.log('🎤 Iniciando grabación (modo agente)');
        recognitionRef.current.start();
      } catch (e) {
        console.error('Error starting recognition:', e);
        // Si falla (ej: ya está iniciado), intentar reiniciar
        try {
          recognitionRef.current.stop();
          setTimeout(() => {
            try {
              recognitionRef.current?.start();
              console.log('� Reintentando inicio de grabación');
            } catch (retryError) {
              console.error('Error en reintento:', retryError);
            }
          }, 100);
        } catch (stopError) {
          console.error('Error al intentar detener para reiniciar:', stopError);
        }
      }
      return; // 🔹 CRÍTICO: return aquí para no ejecutar código del modo bot
    }

    // 🔹 MODO BOT: Modo voz continuo (comportamiento original - NO MODIFICAR)
    if (voiceMode) {
      // stop voice mode
      setVoiceMode(false);
      setSpeakResponses(false);
      try {
        recognitionRef.current?.abort();
      } catch {
        // ignore
      }
      setIsRecording(false);
      // stop any ongoing TTS immediately
      try {
        if (typeof window !== 'undefined' && window.speechSynthesis) {
          window.speechSynthesis.cancel();
        }
      } catch {
        // ignore
      }
      ttsPlayingRef.current = false;
      waitingForResponseRef.current = false;
    } else {
      // start voice mode: enable TTS and start recognition
      setVoiceMode(true);
      setSpeakResponses(true);
      try {
        recognitionRef.current?.start();
      } catch {
        console.error('Error starting recognition');
        console.warn('Could not start voice recognition. Voice mode disabled.');
        setVoiceMode(false);
        setSpeakResponses(false);
      }
    }
  };

  // 🔹 Función para manejar selección de imagen
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

  // 🔹 Función para abrir selector de archivos
  const handleAttachClick = () => {
    const hasActiveAgent =
      escalationStatus?.is_escalated &&
      escalationStatus?.agent_request?.status === 'in_progress';

    if (hasActiveAgent && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // 🔹 Cargar FAQs desde el backend (siempre, para poder responder a números)
  // Note: Removed localStorage conversation loading - conversations should be accessed via /chat/{id} route
  // When user goes to /chat, it should always start a fresh conversation

  useEffect(() => {
    const isExistingConversation = initialMessages.length > 0;

    async function fetchQuestions() {
      const url = process.env.NEXT_PUBLIC_BACKEND_URL;

      // Si no hay URL del backend, salir silenciosamente
      if (!url) {
        console.warn('Backend URL no configurada - modo sin conexión');
        return;
      }

      try {
        const res = await fetch(`${url}/faq/list-questions`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
        });

        if (res.ok) {
          const data = await res.json();
          setQuestions(data.questions);
          setFaqsLoaded(true); // Mark FAQs as loaded

          // Solo mostrar el mensaje de bienvenida si es un chat nuevo
          if (!isExistingConversation) {
            // Show welcome message with FAQs
            const welcomeMsg = createWelcomeMessage(data.questions);
            setMessages([welcomeMsg]);

            // speak greeting if hands-free mode active
            speakText(welcomeMsg.text);
          }
        }
      } catch {
        console.warn(
          'No se pudieron cargar las FAQs - trabajando en modo sin conexión'
        );
        setFaqsLoaded(true); // Mark as loaded even on error
        // En modo desarrollo/sin backend, mostrar mensaje simple solo en chat nuevo
        if (!isExistingConversation) {
          const welcomeMsg = createWelcomeMessage([]);
          setMessages([welcomeMsg]);
        }
      }
    }

    fetchQuestions();
  }, [speakText, initialMessages.length, createWelcomeMessage]);

  // 🔹 Manejo de calificación de mensajes - WITH API INTEGRATION
  const handleRateMessage = useCallback(
    async (id: number | string, rating: 'up' | 'down' | null) => {
      // Update local state immediately for responsive UI
      setMessageRatings((prev) => ({
        ...prev,
        [id]: rating,
      }));

      // If it's a string (UUID from API), send rating to backend
      if (typeof id === 'string' && rating) {
        try {
          await rateMessageAPI(id, rating);
          console.log('Message rated successfully');
        } catch (error) {
          console.error('Failed to rate message:', error);
          // Optionally revert the rating in case of error
          setMessageRatings((prev) => ({
            ...prev,
            [id]: null,
          }));
        }
      }
    },
    []
  );

  // 🔹 Manejo del envío de mensajes
  const handleSendMessage = async () => {
    const hasActiveAgent =
      escalationStatus?.is_escalated &&
      escalationStatus?.agent_request?.status === 'in_progress';

    // Si hay imagen seleccionada, enviar con imagen
    if (selectedImage && conversationId) {
      try {
        const result = await uploadImage({
          conversationId,
          image: selectedImage,
          content: inputValue.trim(),
        });

        if (result) {
          // Agregar mensaje a la UI
          const newMessage: Message = {
            id: result.message.id,
            sender: 'user',
            text: result.message.content || '📷 Imagen',
            timestamp: new Date(result.message.timestamp).toLocaleTimeString(
              [],
              {
                hour: '2-digit',
                minute: '2-digit',
              }
            ),
            imageUrl: result.image_url, // 🔹 NUEVO campo
          };

          setMessages((prev) => [...prev, newMessage]);

          // Limpiar estados
          setInputValue('');
          handleCancelImage();

          // Si usa WebSocket, notificar al agente
          if (hasActiveAgent && wsConnected) {
            // El mensaje ya está guardado en BD, el WebSocket lo transmitirá
            console.log('📤 Imagen enviada y guardada en BD');
          }
        }
      } catch (error) {
        console.error('Error enviando imagen:', error);
        alert('Error al enviar imagen. Intenta nuevamente.');
      }
      return;
    }

    // Comportamiento normal sin imagen
    handleSendMessageWithText(inputValue);
  };

  const handleKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') handleSendMessage();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-12 h-12 border-4 border-black border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // 🔹 Handle new conversation button
  const handleNewConversation = () => {
    // Clear current conversation
    setConversationId(undefined);
    localStorage.removeItem('currentConversationId');

    // Show welcome message
    const welcomeMsg = createWelcomeMessage(questions);
    setMessages([welcomeMsg]);

    // Reset other states
    setBlocked(false);
    setVoiceMode(false);
    setSpeakResponses(false);
    setMessageRatings({});

    // Trigger FAQ reload to show welcome message
    window.location.href = '/chat';
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header de conversación */}
      {(conversationTitle || conversationId) && (
        <div className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-semibold text-dark">
              {conversationTitle || 'Conversación en curso'}
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              {conversationTitle
                ? 'Continuando conversación anterior'
                : 'Conversación activa'}
            </p>
          </div>
          <button
            onClick={handleNewConversation}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-secondary transition-colors text-sm font-medium"
          >
            Nueva Conversación
          </button>
        </div>
      )}

      {/* Loading indicator when creating conversation */}
      {isCreatingConversation && (
        <div className="bg-blue-50 border-b border-blue-200 px-6 py-3">
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-sm text-blue-700">
              Creando conversación y guardando mensajes...
            </p>
          </div>
        </div>
      )}

      {/* Chat messages */}
      <div className="flex-1 p-6 overflow-y-auto">
        {initialMessages.length > 0 && !faqsLoaded ? (
          // Show loader while FAQs are loading for existing conversations
          <div className="flex flex-col items-center justify-center h-full gap-4">
            <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin"></div>
            <p className="text-dark text-sm">Cargando conversación...</p>
          </div>
        ) : (
          <ChatBase
            messages={messages}
            messageRatings={messageRatings}
            onRateMessage={handleRateMessage}
            readonly={false}
          />
        )}
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

      {/* Input */}
      <div className="p-4 bg-white border-t border-gray-200">
        <div className="relative flex items-center">
          <div className="absolute left-5 flex gap-3">
            {/* 🎤 Botón de Micrófono con animación */}
            <button
              onClick={toggleRecording}
              disabled={
                blocked || isCreatingConversation || isWaitingForResponse
              }
              className={cn('transition-all duration-200', {
                'text-red-500 animate-pulse': isRecording || voiceMode,
                'text-primary hover:text-secondary':
                  !isRecording &&
                  !blocked &&
                  !voiceMode &&
                  !isCreatingConversation &&
                  !isWaitingForResponse,
                'text-gray-400 cursor-not-allowed':
                  blocked || isCreatingConversation || isWaitingForResponse,
              })}
              title={
                voiceMode
                  ? 'Modo voz activo: click para detener'
                  : 'Click para activar modo de voz (manos libres)'
              }
            >
              {voiceMode || isRecording ? (
                <MicOff size={22} />
              ) : (
                <Mic size={22} />
              )}
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
                  hasActiveAgent &&
                  !blocked &&
                  !isCreatingConversation &&
                  !isWaitingForResponse &&
                  !uploadingImage,
                'text-gray-400 cursor-not-allowed':
                  !hasActiveAgent ||
                  blocked ||
                  isCreatingConversation ||
                  isWaitingForResponse ||
                  uploadingImage,
              })}
              disabled={
                !hasActiveAgent ||
                blocked ||
                isCreatingConversation ||
                isWaitingForResponse ||
                uploadingImage
              }
              title={
                uploadingImage
                  ? 'Subiendo imagen...'
                  : hasActiveAgent
                    ? 'Adjuntar imagen'
                    : 'Disponible solo en chat con agente'
              }
            >
              <Paperclip size={22} />
            </button>
          </div>

          <input
            ref={inputRef}
            type="text"
            placeholder={
              isWaitingForResponse && !hasActiveAgent
                ? 'Esperando respuesta...'
                : isCreatingConversation
                  ? 'Creando conversación...'
                  : blocked
                    ? 'Chat bloqueado: estás en espera de un agente humano...'
                    : 'Escribe tu mensaje o usa el micrófono...'
            }
            className="w-full pl-24 pr-14 py-3 border-2 border-gray-200 rounded-full focus:outline-none focus:border-primary transition-colors text-dark"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyPress}
            disabled={
              blocked ||
              (isRecording && !hasActiveAgent) || // Solo bloquear si graba en modo bot
              (voiceMode && !hasActiveAgent) || // Solo bloquear modo voz si no hay agente
              isCreatingConversation ||
              (isWaitingForResponse && !hasActiveAgent) // Solo aplicar cooldown sin agente
            }
          />

          <button
            className={cn(
              'absolute right-3 p-2.5 rounded-full transition-colors',
              blocked ||
                isRecording ||
                isCreatingConversation ||
                isWaitingForResponse
                ? 'bg-gray-300 text-white cursor-not-allowed'
                : 'bg-primary text-white hover:bg-secondary'
            )}
            onClick={handleSendMessage}
            disabled={
              blocked ||
              isRecording ||
              isCreatingConversation ||
              isWaitingForResponse
            }
          >
            <Send size={20} />
          </button>
        </div>

        {/* Indicador de grabación */}
        {/* Recording indicator removed: internal audio state is only logged to console */}

        {/* Advertencia de soporte de navegador removed — internal only (console warnings) */}
      </div>
    </div>
  );
}
