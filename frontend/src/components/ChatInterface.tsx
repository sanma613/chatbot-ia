'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Mic, MicOff, Paperclip, Send } from 'lucide-react';
import Image from 'next/image';
import ReactMarkdown from 'react-markdown';
import { ThumbsDownIcon, ThumbsUpIcon } from 'lucide-react';
import removeMarkdown from 'remove-markdown';
import { useUser } from '@/hooks/useUser';
import { cn } from '@/lib/Utils';

type Question = {
  id: number;
  question: string;
};

type Message = {
  id: number;
  sender: 'UniBot' | 'user';
  text: string;
  timestamp: string;
  avatar?: string;
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

const UserAvatar = ({ fullName }: { fullName?: string }) => {
  const firstLetter = fullName?.charAt(0)?.toUpperCase() || 'U';
  return (
    <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-white font-bold">
      {firstLetter}
    </div>
  );
};

export default function ChatInterface() {
  const { user, loading } = useUser();
  const [inputValue, setInputValue] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageRatings, setMessageRatings] = useState<
    Record<number, 'up' | 'down' | null>
  >({});
  const [questions, setQuestions] = useState<Question[]>([]);
  const [blocked, setBlocked] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeechSupported, setIsSpeechSupported] = useState(true);
  const [voiceMode, setVoiceMode] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const recognitionRef = useRef<ISpeechRecognition | null>(null);
  const [speakResponses, setSpeakResponses] = useState(false);
  // Refs to hold latest values for callbacks (avoid stale closures)
  const speakResponsesRef = useRef<boolean>(speakResponses);
  const voiceModeRef = useRef<boolean>(voiceMode);
  const ttsPlayingRef = useRef<boolean>(false);
  const waitingForResponseRef = useRef<boolean>(false);
  const blockedRef = useRef<boolean>(blocked);

  useEffect(() => {
    speakResponsesRef.current = speakResponses;
  }, [speakResponses]);

  useEffect(() => {
    voiceModeRef.current = voiceMode;
  }, [voiceMode]);

  useEffect(() => {
    blockedRef.current = blocked;
  }, [blocked]);

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

  // 🔹 Enviar pregunta de FAQ (memoized)
  const sendFaqToBackend = useCallback(
    async (questionId: number) => {
      const url = process.env.NEXT_PUBLIC_BACKEND_URL;
      try {
        const res = await fetch(`${url}/faq/get_answer/${questionId}`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
        });

        if (res.ok) {
          const data = await res.json();

          const answerText = data.answer ?? '';

          // chatbot responded: we're no longer waiting
          waitingForResponseRef.current = false;

          setMessages((prev: Message[]) => [
            ...prev,
            {
              id: Date.now(),
              sender: 'UniBot',
              avatar: '/images/logo_uni.png',
              text: answerText,
              timestamp: new Date().toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              }),
            },
          ]);

          // speak and auto-restart mic
          speakText(answerText);
        }
      } catch (error) {
        console.error('Error fetching FAQ answer:', error);
        waitingForResponseRef.current = false;
      }
    },
    [speakText]
  );

  // 🔹 Enviar pregunta libre al chatbot académico (memoized)
  const sendToAcademicChatbot = useCallback(
    async (question: string) => {
      const url = process.env.NEXT_PUBLIC_BACKEND_URL;
      try {
        const res = await fetch(`${url}/chatbot/ask`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ question }),
        });

        if (res.ok) {
          const data = await res.json();
          const answerText = data.answer ?? '';

          // chatbot responded: we're no longer waiting
          waitingForResponseRef.current = false;

          setMessages((prev: Message[]) => [
            ...prev,
            {
              id: Date.now(),
              sender: 'UniBot',
              avatar: '/images/logo_uni.png',
              text: answerText,
              timestamp: new Date().toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              }),
            },
          ]);

          speakText(answerText);
        } else {
          const errorMsg =
            'Hubo un problema al procesar tu consulta. Intenta nuevamente más tarde.';
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
      } catch (error) {
        console.error('Error sending message to academic chatbot:', error);
        waitingForResponseRef.current = false;
      }
    },
    [speakText]
  );
  // 🔹 Manejo del envío de mensajes (texto) - usa las funciones memoizadas
  const handleSendMessageWithText = useCallback(
    (text: string) => {
      if (text.trim() === '' || blocked) return;

      const newMessage: Message = {
        id: Date.now(),
        sender: 'user',
        text: text,
        timestamp: new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        }),
      };

      setMessages((prev: Message[]) => [...prev, newMessage]);

      const trimmed = text.trim().toLowerCase();

      if (trimmed === 'agente') {
        // escalate to human: disable voice mode and block chat
        setBlocked(true);
        setVoiceMode(false);
        setSpeakResponses(false);
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now() + 1,
            sender: 'UniBot',
            avatar: '/images/logo_uni.png',
            text: 'Has solicitado hablar con un agente humano. Por favor espera mientras te conectamos...',
            timestamp: new Date().toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            }),
          },
        ]);
        setInputValue('');
        return;
      }

      const selectedNumber = parseInt(trimmed, 10);

      // mark waiting for response so mic doesn't auto-restart
      waitingForResponseRef.current = true;

      if (
        !isNaN(selectedNumber) &&
        selectedNumber > 0 &&
        selectedNumber <= questions.length
      ) {
        const selectedQuestion = questions[selectedNumber - 1];
        sendFaqToBackend(selectedQuestion.id);
      } else {
        sendToAcademicChatbot(text);
      }

      setInputValue('');
    },
    [blocked, questions, sendFaqToBackend, sendToAcademicChatbot]
  );

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  useEffect(() => {
    scrollToBottom();
  }, [messages]);
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
          console.log('🎤 Grabación iniciada');
        };

        recognition.onend = () => {
          setIsRecording(false);
          console.log('🎤 Grabación finalizada');
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
            } catch {
              // ignore
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
          console.log('📝 Transcripción:', transcript);

          // Actualizar input con el texto transcrito
          setInputValue(transcript);

          // Opcional: Enviar automáticamente después de transcribir
          // Descomenta las siguientes líneas si quieres envío automático:
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
  }, [handleSendMessageWithText]);

  // 🎤 Toggle grabación de audio
  const toggleRecording = () => {
    if (!isSpeechSupported || !recognitionRef.current) {
      console.warn(
        'SpeechRecognition not supported in this browser. Voice mode unavailable.'
      );
      return;
    }

    if (blocked) {
      return;
    }

    // In voiceMode the mic button toggles the entire continuous voice conversation
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

  // 🔹 Cargar FAQs desde el backend
  useEffect(() => {
    async function fetchQuestions() {
      const url = process.env.NEXT_PUBLIC_BACKEND_URL;
      try {
        const res = await fetch(`${url}/faq/list-questions`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
        });

        if (res.ok) {
          const data = await res.json();
          setQuestions(data.questions);

          const enumerated = data.questions
            .map((q: Question, i: number) => `${i + 1}. ${q.question}`)
            .join('\n');

          const greeting = `¡Hola! Soy UniBot 🤖. Estas son algunas preguntas frecuentes que puedo responder:\n\n${enumerated}\n`;

          setMessages([
            {
              id: Date.now(),
              sender: 'UniBot',
              avatar: '/images/logo_uni.png',
              text: greeting,
              timestamp: new Date().toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              }),
            },
          ]);

          // speak greeting if hands-free mode active
          speakText(greeting);
        }
      } catch (err) {
        console.error('Error fetching questions:', err);
      }
    }

    fetchQuestions();
  }, [speakText]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-12 h-12 border-4 border-black border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // 🔹 Función auxiliar para enviar mensajes (usado por el botón y por voz)

  // 🔹 Manejo del envío de mensajes
  const handleSendMessage = () => {
    handleSendMessageWithText(inputValue);
  };

  const handleKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') handleSendMessage();
  };

  return (
    <div className="flex flex-col h-full">
      {/* Chat messages */}
      <div className="flex-1 p-6 overflow-y-auto">
        <div className="space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={cn('flex flex-col group', {
                'items-end': msg.sender === 'user',
                'items-start': msg.sender !== 'user',
              })}
            >
              <div
                className={cn('flex items-start gap-4', {
                  'justify-end': msg.sender === 'user',
                })}
              >
                {msg.sender !== 'user' && msg.avatar && (
                  <Image
                    src={msg.avatar}
                    alt="Bot Avatar"
                    width={50}
                    height={40}
                    className="rounded-full object-cover"
                  />
                )}

                <div
                  className={cn(
                    'relative max-w-lg p-4 rounded-2xl break-words',
                    {
                      'bg-primary text-white rounded-tr-none shadow-md':
                        msg.sender === 'user',
                      'bg-gray-100 text-dark rounded-tl-none border border-gray shadow-sm':
                        msg.sender !== 'user',
                    }
                  )}
                >
                  {msg.sender === 'UniBot' ? (
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
                        {msg.text}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    <p className="whitespace-pre-wrap">{msg.text}</p>
                  )}
                  <span
                    className={cn('text-xs mt-2 block', {
                      'text-blue-200': msg.sender === 'user',
                      'text-gray-500': msg.sender !== 'user',
                    })}
                  >
                    {msg.timestamp}
                  </span>
                </div>

                {msg.sender === 'user' && (
                  <UserAvatar fullName={user?.full_name} />
                )}
              </div>

              {/* Rating buttons - Only for bot messages */}
              {msg.sender === 'UniBot' && (
                <div className="flex items-center gap-2 mt-2 mb-2 ml-16">
                  <button
                    onClick={async () => {
                      const current = messageRatings[msg.id] || null;
                      const newVal: 'up' | null =
                        current === 'up' ? null : 'up';
                      setMessageRatings((prev) => ({
                        ...prev,
                        [msg.id]: newVal,
                      }));
                      try {
                        await fetch(
                          `${process.env.NEXT_PUBLIC_BACKEND_URL}/chatbot/rate`,
                          {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            credentials: 'include',
                            body: JSON.stringify({
                              messageId: msg.id,
                              sender: msg.sender,
                              rating: newVal,
                            }),
                          }
                        );
                      } catch (err) {
                        console.warn('Failed to send rating:', err);
                      }
                    }}
                    className={cn('transition-all', {
                      'text-black': messageRatings[msg.id] !== 'up',
                      'text-blue-500': messageRatings[msg.id] === 'up',
                      'hover:text-blue-500': messageRatings[msg.id] !== 'up',
                    })}
                    title="Me gusta"
                  >
                    <ThumbsUpIcon size={18} strokeWidth={2} />
                  </button>
                  <button
                    onClick={async () => {
                      const current = messageRatings[msg.id] || null;
                      const newVal: 'down' | null =
                        current === 'down' ? null : 'down';
                      setMessageRatings((prev) => ({
                        ...prev,
                        [msg.id]: newVal,
                      }));
                      try {
                        await fetch(
                          `${process.env.NEXT_PUBLIC_BACKEND_URL}/chatbot/rate`,
                          {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            credentials: 'include',
                            body: JSON.stringify({
                              messageId: msg.id,
                              sender: msg.sender,
                              rating: newVal,
                            }),
                          }
                        );
                      } catch (err) {
                        console.warn('Failed to send rating:', err);
                      }
                    }}
                    className={cn('transition-all', {
                      'text-black': messageRatings[msg.id] !== 'down',
                      'text-red-500': messageRatings[msg.id] === 'down',
                      'hover:text-red-500': messageRatings[msg.id] !== 'down',
                    })}
                    title="No me gusta"
                  >
                    <ThumbsDownIcon size={18} strokeWidth={2} />
                  </button>
                </div>
              )}
            </div>
          ))}
          <div ref={messagesEndRef}></div>
        </div>
      </div>

      {/* Input */}
      <div className="p-4 bg-white border-t border-gray-200">
        <div className="relative flex items-center">
          <div className="absolute left-5 flex gap-3">
            {/* 🎤 Botón de Micrófono con animación */}
            <button
              onClick={toggleRecording}
              disabled={blocked}
              className={cn('transition-all duration-200', {
                'text-red-500 animate-pulse': isRecording || voiceMode,
                'text-primary hover:text-secondary':
                  !isRecording && !blocked && !voiceMode,
                'text-gray-400 cursor-not-allowed': blocked,
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

            <button
              className={cn('transition-colors', {
                'text-primary hover:text-secondary': !blocked,
                'text-gray-400 cursor-not-allowed': blocked,
              })}
              disabled={blocked}
              title="Adjuntar archivo (próximamente)"
            >
              <Paperclip size={22} />
            </button>
          </div>

          <input
            type="text"
            placeholder={
              blocked
                ? 'Chat bloqueado: estás en espera de un agente humano...'
                : 'Escribe tu mensaje o usa el micrófono...'
            }
            className="w-full pl-24 pr-14 py-3 border-2 border-gray-200 rounded-full focus:outline-none focus:border-primary transition-colors text-dark"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyPress}
            disabled={blocked || isRecording || voiceMode}
          />

          <button
            className={cn(
              'absolute right-3 p-2.5 rounded-full transition-colors',
              blocked || isRecording
                ? 'bg-gray-300 text-white cursor-not-allowed'
                : 'bg-primary text-white hover:bg-secondary'
            )}
            onClick={handleSendMessage}
            disabled={blocked || isRecording}
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
