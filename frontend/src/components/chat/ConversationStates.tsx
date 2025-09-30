import React from 'react';
import Link from 'next/link';
import { MessageSquare } from 'lucide-react';
import { cn } from '@/lib/Utils';

interface LoadingStateProps {
    message?: string;
}

interface ErrorStateProps {
    error: string;
}

export function LoadingState({ message = "Cargando conversación..." }: LoadingStateProps) {
    return (
        <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-2 text-dark">{message}</span>
        </div>
    );
}

export function ErrorState({ error }: ErrorStateProps) {
    return (
        <div className="max-w-2xl mx-auto p-6 text-center">
            <MessageSquare className="w-16 h-16 text-dark mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-dark mb-2">
                {error}
            </h2>
            <p className="text-dark mb-6">
                La conversación que buscas no existe o ha sido eliminada.
            </p>
            <Link
                href="/history"
                className={cn(
                    "inline-flex items-center gap-2 px-6 py-3",
                    "bg-primary text-white rounded-lg",
                    "hover:bg-primary-dark transition-colors"
                )}
            >
                Volver al Historial
            </Link>
        </div>
    );
}