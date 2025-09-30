import React from 'react';
import { Message } from '@/app/types/chat';
import MessageBubble from './MessageBubble';

interface MessageListProps {
    messages: Message[];
}

export default function MessageList({ messages }: MessageListProps) {
    return (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
            <div className="p-6">
                <h2 className="text-lg font-semibold text-dark mb-4">
                    Conversación
                </h2>
                
                {/* Contenedor con scroll para los mensajes */}
                <div className="relative">
                    <div 
                        className="max-h-[60vh] overflow-y-auto pr-2 space-y-6 scroll-smooth"
                        style={{
                            scrollbarWidth: 'thin',
                            scrollbarColor: '#d1d5db #f3f4f6'
                        }}
                    >
                        {messages.map((message) => (
                            <MessageBubble
                                key={message.id}
                                message={message}
                            />
                        ))}
                    </div>
                    
                    {/* Gradiente indicador de scroll (solo si hay muchos mensajes) */}
                    {messages.length > 3 && (
                        <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-white to-transparent pointer-events-none rounded-b-lg" />
                    )}
                </div>
            </div>
        </div>
    );
}