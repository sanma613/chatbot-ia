import React from 'react';
import Link from 'next/link';
import { Conversation } from '@/app/types/chat';
import { MessageSquare, Calendar, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/Utils';

interface ConversationCardProps {
    conversation: Conversation;
}

export default function ConversationCard({ conversation }: ConversationCardProps) {
    // Formatear fecha para mostrar
    const formatDate = (date: Date) => {
        const now = new Date();
        const diffTime = now.getTime() - date.getTime();
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 0) {
            return date.toLocaleTimeString('es-ES', { 
                hour: '2-digit', 
                minute: '2-digit' 
            });
        } else if (diffDays === 1) {
            return 'Ayer';
        } else if (diffDays < 7) {
            return `Hace ${diffDays} días`;
        } else {
            return date.toLocaleDateString('es-ES', { 
                day: '2-digit', 
                month: '2-digit', 
                year: '2-digit' 
            });
        }
    };

    return (
        <Link
            href={`/chat/${conversation.id}`}
            className={cn(
                "block p-6 bg-white rounded-lg border border-gray-200",
                "hover:border-primary hover:shadow-lg transition-all duration-200",
                "group cursor-pointer"
            )}
        >
            <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                    {/* Título */}
                    <h3 className={cn(
                        "text-lg font-semibold text-dark mb-2",
                        "group-hover:text-primary transition-colors",
                        "truncate"
                    )}>
                        {conversation.title}
                    </h3>

                    {/* Último mensaje */}
                    {conversation.lastMessage && (
                        <p className="text-dark text-sm mb-3 line-clamp-2">
                            {conversation.lastMessage}
                        </p>
                    )}

                    {/* Metadatos */}
                    <div className="flex items-center gap-4 text-sm text-dark">
                        <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {formatDate(conversation.updatedAt)}
                        </div>
                        <div className="flex items-center gap-1">
                            <MessageSquare className="w-4 h-4" />
                            {conversation.messageCount} mensajes
                        </div>
                    </div>
                </div>

                {/* Icono de navegación */}
                <div className={cn(
                    "flex-shrink-0 ml-4",
                    "text-dark group-hover:text-primary",
                    "transition-all duration-200",
                    "group-hover:translate-x-1"
                )}>
                    <ArrowRight className="w-5 h-5" />
                </div>
            </div>
        </Link>
    );
}