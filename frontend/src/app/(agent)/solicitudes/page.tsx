// Página de solicitudes pendientes para agentes
'use client';

import React from 'react';
import { useAgentRequests } from '@/hooks/useAgentRequests';
import RequestList from '@/components/agent/RequestList';
import { AlertCircle, RefreshCw } from 'lucide-react';

export default function SolicitudesPage() {
  const { requests, activeCase, loading, error, refetch, takeRequest } =
    useAgentRequests();

  // Filtrar solo solicitudes pendientes
  const pendingRequests = requests.filter((req) => req.status === 'pending');

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <AlertCircle size={48} className="mx-auto mb-4 text-red-500" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Error al cargar solicitudes
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

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Solicitudes Pendientes
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              {pendingRequests.length} solicitud
              {pendingRequests.length !== 1 ? 'es' : ''} esperando ser atendida
              {pendingRequests.length !== 1 ? 's' : ''}
            </p>
          </div>
          <button
            onClick={refetch}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
            Actualizar
          </button>
        </div>
      </div>

      {/* Aviso si tiene caso activo */}
      {activeCase && (
        <div className="bg-primary-light bg-opacity-10 border-l-4 border-primary p-4 m-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertCircle className="h-5 w-5 text-primary" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-primary-dark">
                Actualmente tienes un caso activo con{' '}
                <span className="font-semibold">
                  {activeCase.user_info.name}
                </span>
                . Solo puedes tomar otro caso después de resolver el actual.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Lista de solicitudes */}
      <div className="flex-1 overflow-y-auto p-6">
        <RequestList
          requests={pendingRequests}
          onTakeRequest={takeRequest}
          loading={loading}
        />
      </div>
    </div>
  );
}
