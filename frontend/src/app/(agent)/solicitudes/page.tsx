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
          <AlertCircle size={48} className="mx-auto mb-4 text-error" />
          <h2 className="text-xl font-bold text-dark mb-2">
            Error al cargar solicitudes
          </h2>
          <p className="text-dark opacity-70 mb-4">{error}</p>
          <button
            onClick={refetch}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors shadow-md hover:shadow-lg"
          >
            Intentar de nuevo
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-dark mb-2">
                Solicitudes Pendientes
              </h1>
              <p className="text-dark opacity-70">
                {pendingRequests.length} solicitud
                {pendingRequests.length !== 1 ? 'es' : ''} esperando ser
                atendida
                {pendingRequests.length !== 1 ? 's' : ''}
              </p>
            </div>
            <button
              onClick={refetch}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-dark rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
              Actualizar
            </button>
          </div>
        </div>
      </div>

      {/* Aviso si tiene caso activo */}
      {activeCase && (
        <div className="p-6">
          <div className="max-w-4xl mx-auto">
            <div className="bg-info bg-opacity-10 border-l-4 border-info rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  <AlertCircle className="h-5 w-5 text-info mt-0.5" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-dark mb-1">
                    Tienes un caso activo
                  </p>
                  <p className="text-sm text-dark opacity-80">
                    Actualmente estás atendiendo a{' '}
                    <span className="font-semibold text-info">
                      {activeCase.user_info.name}
                    </span>
                    . Solo puedes tomar otro caso después de resolver el actual.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Lista de solicitudes */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto">
          <RequestList
            requests={pendingRequests}
            onTakeRequest={takeRequest}
            loading={loading}
          />
        </div>
      </div>
    </div>
  );
}
