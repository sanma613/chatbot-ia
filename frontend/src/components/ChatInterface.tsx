'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Mic, Paperclip, Send } from 'lucide-react';
import Image from 'next/image';
import clsx from 'clsx';
import { useUser } from '@/hooks/useUser';

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
  const [questions, setQuestions] = useState<Question[]>([]);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const [blocked, setBlocked] = useState(false); // nuevo estado

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Traer preguntas frecuentes
  useEffect(() => {
    async function fetchQuestions() {
      const url = process.env.NEXT_PUBLIC_BACKEND_URL;
      try {
        const res = await fetch(`${url}/chatbot/list-questions`, {
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

          setMessages([
            {
              id: Date.now(),
              sender: 'UniBot',
              avatar: '/images/logo_uni.png',
              text: `¡Hola! Soy UniBot 🤖. Estas son algunas preguntas frecuentes que puedo responder:\n\n${enumerated}\n\nResponde con el número de la pregunta que te interese o escribe "agente" para hablar con un humano. 👇`,
              timestamp: new Date().toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              }),
            },
          ]);
        }
      } catch (err) {
        console.error('Error fetching questions:', err);
      }
    }

    fetchQuestions();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-12 h-12 border-4 border-black border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const sendToBackend = async (questionId: number) => {
    const url = process.env.NEXT_PUBLIC_BACKEND_URL;
    try {
      const res = await fetch(`${url}/chatbot/get_answer/${questionId}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });

      if (res.ok) {
        const data = await res.json();

        // Respuesta del bot
        setMessages((prev: Message[]) => [
          ...prev,
          {
            id: Date.now(),
            sender: 'UniBot',
            avatar: '/images/logo_uni.png',
            text: data.answer,
            timestamp: new Date().toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            }),
          },
          // Pregunta de seguimiento
          {
            id: Date.now() + 1,
            sender: 'UniBot',
            avatar: '/images/logo_uni.png',
            text: '¿Puedo ayudarte con algo más? Responde con el número de otra pregunta o escribe "agente" para hablar con un humano.',
            timestamp: new Date().toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            }),
          },
        ]);
      }
    } catch (error) {
      console.error('Error fetching answer:', error);
    }
  };

  const handleSendMessage = () => {
    if (inputValue.trim() === '' || blocked) return; // bloquea si está en true

    const newMessage: Message = {
      id: Date.now(),
      sender: 'user',
      text: inputValue,
      timestamp: new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      }),
    };

    setMessages((prev: Message[]) => [...prev, newMessage]);

    const trimmed = inputValue.trim().toLowerCase();

    // Escalar a agente
    if (trimmed === 'agente') {
      setInputValue(''); // limpia input
      setBlocked(true); // bloquea usuario
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: 'UniBot',
          avatar: '/images/logo_uni.png',
          text: 'Has decidido escalar a un agente humano. Por favor espera un momento...',
          timestamp: new Date().toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          }),
        },
      ]);
      return;
    }

    const selectedNumber = parseInt(inputValue, 10);

    if (
      !isNaN(selectedNumber) &&
      selectedNumber > 0 &&
      selectedNumber <= questions.length
    ) {
      const selectedQuestion = questions[selectedNumber - 1];
      sendToBackend(selectedQuestion.id);
    } else {
      setMessages((prev: Message[]) => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: 'UniBot',
          avatar: '/images/logo_uni.png',
          text: 'No reconozco ese número 😅. Por favor, ingresa un número válido de la lista o escribe "agente" para hablar con un humano.',
          timestamp: new Date().toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          }),
        },
      ]);
    }

    setInputValue('');
  };

  const handleKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      handleSendMessage();
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Mensajes */}
      <div className="flex-1 p-6 overflow-y-auto">
        <div className="space-y-6">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={clsx('flex items-start gap-4', {
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
                className={clsx(
                  'relative max-w-lg p-4 rounded-2xl whitespace-pre-wrap break-words',
                  {
                    'bg-primary text-white rounded-tr-none shadow-md':
                      msg.sender === 'user',
                    'bg-gray-100 text-dark rounded-tl-none border border-gray shadow-sm':
                      msg.sender !== 'user',
                  }
                )}
              >
                <p>{msg.text}</p>
                <span
                  className={clsx('text-xs mt-2 block', {
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
          ))}
          <div ref={messagesEndRef}></div>
        </div>
      </div>

      {/* Input */}
      <div className="p-4 bg-white border-t border-gray-200">
        <div className="relative flex items-center">
          <div className="absolute left-5 flex gap-3">
            <button className="text-primary hover:text-secondary transition-colors">
              <Mic size={22} />
            </button>
            <button className="text-primary hover:text-secondary transition-colors">
              <Paperclip size={22} />
            </button>
          </div>

          <input
            type="text"
            placeholder="Escribe tu mensaje aquí..."
            className="w-full pl-24 pr-14 py-3 border-2 border-gray-200 rounded-full focus:outline-none focus:border-primary transition-colors text-dark"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyPress}
          />

          <button
            className={clsx(
              'absolute right-3 p-2.5 rounded-full transition-colors',
              blocked
                ? 'bg-blue-200 text-white cursor-not-allowed' // botón deshabilitado
                : 'bg-primary text-white hover:bg-primary-dark' // botón activo
            )}
            onClick={handleSendMessage}
            disabled={blocked}
          >
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}
