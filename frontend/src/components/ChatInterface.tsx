// frontend/src/app/components/ChatInterface.tsx

'use client';

import React, { useState } from 'react';
import { Mic, Paperclip, Send } from 'lucide-react';
import Image from 'next/image';

// Mock data for chat messages
const messages = [
  {
    id: 1,
    sender: 'UniBot',
    avatar: '/images/logo_uni.png',
    text: '¡Hola! Soy UniBot, tu asistente universitario. ¿En qué puedo ayudarte hoy?',
    timestamp: '10:30 AM',
  },
  {
    id: 2,
    sender: 'user',
    avatar: '/images/user_avatar.png',
    text: 'Hola, necesito información sobre las fechas de inscripción para el próximo semestre.',
    timestamp: '10:31 AM',
  },
  {
    id: 3,
    sender: 'UniBot',
    avatar: '/images/logo_uni.png',
    text: 'Claro, las inscripciones para el próximo semestre comienzan el 15 de Octubre y finalizan el 30 de Octubre. Puedes encontrar más detalles en el portal del estudiante.',
    timestamp: '10:32 AM',
  },
];

// Placeholder for user avatar (Hacer lógica para que tome la primer letra del nombre del usuario de la sesión)
const UserAvatarPlaceholder = () => (
  <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-white font-bold">
    E
  </div>
);

export default function ChatInterface() {
  const [inputValue, setInputValue] = useState('');
  const handleSendMessage = () => {
    if (inputValue.trim() === '') {
      return;
    }
    console.log('Mensaje enviado: ', inputValue);
    // Aqui iría la lógica para mandar a la ia y guardar en el historial de mensajes
    setInputValue('');
    // Ponemos el input en blando
  };

  // Cuando presione enter enviar
  const handleKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      handleSendMessage();
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Chat Messages Area */}
      <div className="flex-1 p-6 overflow-y-auto">
        <div className="space-y-6">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex items-start gap-4 ${
                msg.sender === 'user' ? 'justify-end' : ''
              }`}
            >
              {msg.sender !== 'user' && (
                <Image
                  src={msg.avatar}
                  alt="Bot Avatar"
                  width={40}
                  height={40}
                  className="rounded-full"
                />
              )}
              <div
                className={`max-w-lg p-4 rounded-2xl ${
                  msg.sender === 'user'
                    ? 'bg-primary text-white rounded-br-none'
                    : 'bg-gray-100 text-dark rounded-bl-none'
                }`}
              >
                <p>{msg.text}</p>
                <span
                  className={`text-xs mt-2 block ${msg.sender === 'user' ? 'text-blue-200' : 'text-gray-500'}`}
                >
                  {msg.timestamp}
                </span>
              </div>
              {msg.sender === 'user' && <UserAvatarPlaceholder />}
            </div>
          ))}
        </div>
      </div>

      {/* Chat Input Area */}
      <div className="p-4 bg-white border-t border-gray-200">
        <div className="relative flex items-center">
          {/* Cont de Iconos Izquierdos */}
          <div className="absolute left-5 flex gap-3">
            <button className="text-primary hover:text-secondary transition-colors">
              <Mic size={22} />
            </button>
            <button className="text-primary hover:text-secondary transition-colors">
              <Paperclip size={22} />
            </button>
          </div>

          {/* Campo de Texto */}
          <input
            type="text"
            placeholder="Escribe tu mensaje aquí..."
            className="w-full pl-24 pr-14 py-3 border-2 border-gray-200 rounded-full focus:outline-none focus:border-primary transition-colors text-dark"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
          />

          {/* Botón de Enviar */}
          <button
            className="absolute right-3 bg-primary text-white p-2.5 rounded-full hover:bg-primary-dark transition-colors"
            onClick={handleSendMessage}
          >
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}
