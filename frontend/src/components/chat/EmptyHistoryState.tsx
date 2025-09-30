import React from 'react';
import Link from 'next/link';
import { MessageSquare, Plus } from 'lucide-react';
import { cn } from '@/lib/Utils';

interface EmptyHistoryStateProps {
    searchTerm?: string;
}

export default function EmptyHistoryState({ searchTerm }: EmptyHistoryStateProps) {
    const isSearching = !!searchTerm;

    return (
        <div className="text-center py-12">
            <MessageSquare className="w-16 h-16 text-dark mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-dark mb-2">
                {isSearching ? 'No se encontraron conversaciones' : 'No tienes conversaciones aún'}
            </h2>
            <p className="text-dark mb-6">
                {isSearching 
                    ? 'Intenta con otros términos de búsqueda'
                    : 'Inicia tu primera conversación con el chatbot'
                }
            </p>
            {!isSearching && (
                <Link
                    href="/chat"
                    className={cn(
                        "inline-flex items-center gap-2 px-6 py-3",
                        "bg-primary text-white rounded-lg",
                        "hover:bg-primary-dark transition-colors"
                    )}
                >
                    <Plus className="w-5 h-5" />
                    Comenzar Conversación
                </Link>
            )}
        </div>
    );
}