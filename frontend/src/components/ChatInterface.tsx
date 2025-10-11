'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Mic, Paperclip, Send } from 'lucide-react';
import Image from 'next/image';
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
  const [blocked, setBlocked] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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

          setMessages([
            {
              id: Date.now(),
              sender: 'UniBot',
              avatar: '/images/logo_uni.png',
              text: `¡Hola! Soy UniBot 🤖. Estas son algunas preguntas frecuentes que puedo responder:\n\n${enumerated}\n\nTambién puedes escribirme "agente" para hablar con un humano. 👇`,
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

  // 🔹 Enviar pregunta de FAQ
  const sendFaqToBackend = async (questionId: number) => {
    const url = process.env.NEXT_PUBLIC_BACKEND_URL;
    try {
      const res = await fetch(`${url}/faq/get_answer/${questionId}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });

      if (res.ok) {
        const data = await res.json();

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
        ]);
      }
    } catch (error) {
      console.error('Error fetching FAQ answer:', error);
    }
  };

  // 🔹 Enviar pregunta libre al chatbot académico
  const sendToAcademicChatbot = async (question: string) => {
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
        const answerText = data.answer;

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
      } else {
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now(),
            sender: 'UniBot',
            avatar: '/images/logo_uni.png',
            text: 'Hubo un problema al procesar tu consulta. Intenta nuevamente más tarde.',
            timestamp: new Date().toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            }),
          },
        ]);
      }
    } catch (error) {
      console.error('Error sending message to academic chatbot:', error);
    }
  };

  // 🔹 Manejo del envío de mensajes
  const handleSendMessage = () => {
    if (inputValue.trim() === '' || blocked) return;

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

    if (trimmed === 'agente') {
      setBlocked(true);
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

    if (
      !isNaN(selectedNumber) &&
      selectedNumber > 0 &&
      selectedNumber <= questions.length
    ) {
      const selectedQuestion = questions[selectedNumber - 1];
      sendFaqToBackend(selectedQuestion.id);
    } else {
      // Si no es un número válido, se interpreta como pregunta académica libre
      sendToAcademicChatbot(inputValue);
    }

    setInputValue('');
  };

  const handleKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') handleSendMessage();
  };

  return (
    <div className="flex flex-col h-full">
      {/* Chat messages */}
      <div className="flex-1 p-6 overflow-y-auto">
        <div className="space-y-6">
          {messages.map((msg) => (
            <div
              key={msg.id}
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
            placeholder={
              blocked
                ? 'Chat bloqueado: estás en espera de un agente humano...'
                : 'Escribe tu mensaje aquí...'
            }
            className="w-full pl-24 pr-14 py-3 border-2 border-gray-200 rounded-full focus:outline-none focus:border-primary transition-colors text-dark"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyPress}
            disabled={blocked}
          />

          <button
            className={cn(
              'absolute right-3 p-2.5 rounded-full transition-colors',
              blocked
                ? 'bg-blue-200 text-white cursor-not-allowed'
                : 'bg-primary text-white hover:bg-primary-dark'
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
