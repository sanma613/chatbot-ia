'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Plus, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/Utils';
import {
  ConversationCard,
  ChatSearchBar,
  EmptyHistoryState,
  HistoryStats,
} from '@/components/chat';
import { useConversations } from '@/hooks/useConversations';

export default function HistoryPage() {
  const { conversations, loading, error, refetch } = useConversations();
  const [searchTerm, setSearchTerm] = useState('');

  // Handle title update
  const handleTitleUpdate = () => {
    // Trigger a refetch to update the list
    refetch();
  };

  // Handle conversation deletion
  const handleDelete = () => {
    // Trigger a refetch to update the list
    refetch();
  };

  // Filtrar conversaciones por término de búsqueda
  const filteredConversations = conversations.filter(
    (conv) =>
      conv.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      conv.lastMessage?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <span className="ml-2 text-dark">Cargando historial...</span>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto bg-white">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-dark mb-2">
                Historial de Conversaciones
              </h1>
              <p className="text-dark">
                Revisa todas tus conversaciones anteriores con el asistente IA
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={refetch}
                disabled={loading}
                className={cn(
                  'flex items-center gap-2 px-4 py-2',
                  'bg-white border border-gray-300 text-dark rounded-lg',
                  'hover:bg-gray-50 transition-colors',
                  'disabled:opacity-50 disabled:cursor-not-allowed'
                )}
                title="Actualizar historial"
              >
                <RefreshCw
                  className={cn('w-5 h-5', loading && 'animate-spin')}
                />
                Actualizar
              </button>
              <Link
                href="/chat"
                className={cn(
                  'flex items-center gap-2 px-4 py-2',
                  'bg-primary text-white rounded-lg',
                  'hover:bg-primary-dark transition-colors',
                  'shadow-md hover:shadow-lg'
                )}
              >
                <Plus className="w-5 h-5" />
                Nueva Conversación
              </Link>
            </div>
          </div>

          {/* Barra de búsqueda */}
          <ChatSearchBar
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            placeholder="Buscar en el historial..."
          />
        </div>

        {/* Mensaje de error */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                <svg
                  className="w-5 h-5 text-red-600"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-red-800 text-sm font-medium mb-1">
                  Error al cargar el historial
                </p>
                <p className="text-red-700 text-sm">{error}</p>
                <button
                  onClick={refetch}
                  disabled={loading}
                  className="mt-2 text-red-600 hover:text-red-800 text-sm font-medium underline disabled:opacity-50"
                >
                  {loading ? 'Cargando...' : 'Intentar nuevamente'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Contenido principal */}
        {filteredConversations.length === 0 ? (
          <EmptyHistoryState searchTerm={searchTerm} />
        ) : (
          <div className="space-y-4">
            {filteredConversations.map((conversation) => (
              <ConversationCard
                key={conversation.id}
                conversation={conversation}
                onTitleUpdate={handleTitleUpdate}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}

        {/* Estadísticas */}
        <HistoryStats
          totalConversations={conversations.length}
          filteredCount={filteredConversations.length}
          hasSearchTerm={!!searchTerm}
        />
      </div>
    </div>
  );
}
