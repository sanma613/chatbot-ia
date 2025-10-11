'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Conversation } from '@/app/types/chat';
import { getChatHistory } from '@/lib/mockChatData';
import { Plus } from 'lucide-react';
import { cn } from '@/lib/Utils';
import {
  ConversationCard,
  ChatSearchBar,
  EmptyHistoryState,
  HistoryStats,
} from '@/components/chat';

export default function HistoryPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const loadChatHistory = async () => {
      try {
        const history = await getChatHistory();
        setConversations(history);
      } catch (error) {
        console.error('Error al cargar historial:', error);
      } finally {
        setLoading(false);
      }
    };

    loadChatHistory();
  }, []);

  // Filtrar conversaciones por término de búsqueda
  const filteredConversations = conversations.filter(
    (conv) =>
      conv.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      conv.lastMessage?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <span className="ml-2 text-dark">Cargando historial...</span>
      </div>
    );
  }

  return (
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

        {/* Barra de búsqueda */}
        <ChatSearchBar
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          placeholder="Buscar en el historial..."
        />
      </div>

      {/* Contenido principal */}
      {filteredConversations.length === 0 ? (
        <EmptyHistoryState searchTerm={searchTerm} />
      ) : (
        <div className="space-y-4">
          {filteredConversations.map((conversation) => (
            <ConversationCard
              key={conversation.id}
              conversation={conversation}
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
  );
}
