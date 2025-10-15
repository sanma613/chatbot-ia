// Componente de lista de solicitudes para agentes
'use client';

import React, { useState } from 'react';
import { Clock, User, Mail, AlertCircle, MessageSquare } from 'lucide-react';
import type { AgentRequest } from '@/types/agentRequest';
import { cn } from '@/lib/Utils';

interface RequestListProps {
  requests: AgentRequest[];
  onTakeRequest: (requestId: string) => Promise<void>;
  loading?: boolean;
}

export default function RequestList({
  requests,
  onTakeRequest,
  loading,
}: RequestListProps) {
  const [takingId, setTakingId] = useState<string | null>(null);

  const handleTake = async (requestId: string) => {
    setTakingId(requestId);
    try {
      await onTakeRequest(requestId);
    } catch (error) {
      console.error('Error al tomar solicitud:', error);
    } finally {
      setTakingId(null);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Hace un momento';
    if (diffMins < 60) return `Hace ${diffMins} min`;

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `Hace ${diffHours}h`;

    const diffDays = Math.floor(diffHours / 24);
    return `Hace ${diffDays}d`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <span className="ml-2 text-dark">Cargando solicitudes...</span>
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-dark">
        <AlertCircle size={48} className="mb-4 text-primary opacity-50" />
        <p className="text-lg font-semibold text-dark">
          No hay solicitudes pendientes
        </p>
        <p className="text-sm text-dark opacity-70">
          Las nuevas solicitudes aparecerán aquí
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {requests.map((request) => (
        <div
          key={request.id}
          className={cn(
            'block p-6 bg-white rounded-lg border border-gray-200',
            'hover:border-primary hover:shadow-lg transition-all duration-200',
            'group'
          )}
        >
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                <User size={24} className="text-white" />
              </div>
              <div className="min-w-0">
                <h3 className="text-lg font-semibold text-dark truncate">
                  {request.user_name || 'Usuario'}
                </h3>
                <div className="flex items-center gap-1 text-sm text-dark opacity-70">
                  <Mail size={14} />
                  <span className="truncate">{request.user_email}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Preview del último mensaje */}
          {request.last_message && (
            <div className="mb-4 p-3 bg-light rounded-md border border-gray-200">
              <p className="text-sm text-dark line-clamp-2">
                {request.last_message}
              </p>
            </div>
          )}

          {/* Metadatos */}
          <div className="flex items-center gap-4 text-sm text-dark mb-4">
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              <span>{formatDate(request.escalated_at)}</span>
            </div>
            <div className="flex items-center gap-1">
              <MessageSquare className="w-4 h-4" />
              <span>
                {request.message_count ? request.message_count + 1 : 0} mensaje
                {(request.message_count ? request.message_count + 1 : 0) !== 1
                  ? 's'
                  : ''}
              </span>
            </div>
          </div>

          {/* Footer: Badge de estado y botón de acción */}
          <div className="flex items-center justify-between pt-3 border-t border-gray-200">
            <span
              className={cn(
                'px-3 py-1 rounded-full text-xs font-semibold',
                request.status === 'pending'
                  ? 'bg-warning bg-opacity-20 text-warning'
                  : request.status === 'in_progress'
                    ? 'bg-info bg-opacity-20 text-info'
                    : 'bg-success bg-opacity-20 text-success'
              )}
            >
              {request.status === 'pending'
                ? 'Pendiente'
                : request.status === 'in_progress'
                  ? 'En Progreso'
                  : 'Resuelta'}
            </span>

            {request.status === 'pending' && (
              <button
                onClick={() => handleTake(request.id)}
                disabled={takingId === request.id}
                className={cn(
                  'px-4 py-2 rounded-lg font-semibold transition-colors text-sm',
                  takingId === request.id
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-primary text-white hover:bg-primary-dark shadow-md hover:shadow-lg'
                )}
              >
                {takingId === request.id ? 'Tomando...' : 'Tomar caso'}
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
