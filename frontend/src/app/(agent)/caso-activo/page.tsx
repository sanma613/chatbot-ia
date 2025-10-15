// Página del caso activo para agentes
'use client';

import React from 'react';
import { useAgentRequests } from '@/hooks/useAgentRequests';
import AgentChatInterface from '@/components/agent/AgentChatInterface';
import { MessageSquareOff } from 'lucide-react';
import Link from 'next/link';

export default function CasoActivoPage() {
  const { activeCase, loading, error, refetch, resolveRequest } =
    useAgentRequests();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando caso activo...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <MessageSquareOff size={48} className="mx-auto mb-4 text-red-500" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Error al cargar el caso
          </h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={refetch}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-secondary transition-colors"
          >
            Intentar de nuevo
          </button>
        </div>
      </div>
    );
  }

  if (!activeCase) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center max-w-md">
          <MessageSquareOff size={64} className="mx-auto mb-4 text-gray-400" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            No tienes un caso activo
          </h2>
          <p className="text-gray-600 mb-6">
            Actualmente no tienes ningún caso asignado. Ve a la sección de
            solicitudes para tomar un nuevo caso.
          </p>
          <Link
            href="/solicitudes"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg hover:bg-secondary font-semibold transition-colors"
          >
            Ver Solicitudes
          </Link>
        </div>
      </div>
    );
  }

  return (
    <AgentChatInterface
      activeCase={activeCase}
      onResolve={resolveRequest}
      onRefresh={refetch}
    />
  );
}
