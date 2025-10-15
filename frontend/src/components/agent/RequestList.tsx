// Componente de lista de solicitudes para agentes
'use client';

import React, { useState } from 'react';
import { Clock, User, Mail, AlertCircle } from 'lucide-react';
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-500">
        <AlertCircle size={48} className="mb-4" />
        <p className="text-lg font-semibold">No hay solicitudes pendientes</p>
        <p className="text-sm">Las nuevas solicitudes aparecerán aquí</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {requests.map((request) => (
        <div
          key={request.id}
          className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
        >
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
                <User size={20} className="text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">
                  {request.user_name || 'Usuario'}
                </h3>
                <div className="flex items-center gap-1 text-sm text-gray-500">
                  <Mail size={14} />
                  <span>{request.user_email}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <Clock size={14} />
              <span>{formatDate(request.escalated_at)}</span>
            </div>
          </div>

          {/* Preview del último mensaje */}
          {request.last_message && (
            <div className="mb-3 p-3 bg-gray-50 rounded-md">
              <p className="text-sm text-gray-700 line-clamp-2">
                {request.last_message}
              </p>
            </div>
          )}

          {/* Info adicional */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 text-xs text-gray-500">
              <span>
                {request.message_count || 0} mensaje
                {(request.message_count || 0) !== 1 ? 's' : ''}
              </span>
              <span
                className={cn(
                  'px-2 py-1 rounded-full font-semibold',
                  request.status === 'pending'
                    ? 'bg-warning bg-opacity-20 text-warning'
                    : request.status === 'in_progress'
                      ? 'bg-primary bg-opacity-20 text-primary'
                      : 'bg-success bg-opacity-20 text-success'
                )}
              >
                {request.status === 'pending'
                  ? 'Pendiente'
                  : request.status === 'in_progress'
                    ? 'En Progreso'
                    : 'Resuelta'}
              </span>
            </div>

            {request.status === 'pending' && (
              <button
                onClick={() => handleTake(request.id)}
                disabled={takingId === request.id}
                className={cn(
                  'px-4 py-2 rounded-lg font-semibold transition-colors',
                  takingId === request.id
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-primary text-white hover:bg-secondary'
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
