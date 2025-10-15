// Hook para gestionar solicitudes de agentes
'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  getAgentRequests,
  getActiveCase,
  takeRequest,
  resolveRequest,
} from '@/lib/agentRequestApi';
import type { AgentRequest, AgentActiveCase } from '@/types/agentRequest';

export function useAgentRequests() {
  const [requests, setRequests] = useState<AgentRequest[]>([]);
  const [activeCase, setActiveCase] = useState<AgentActiveCase | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRequests = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [requestsData, activeCaseData] = await Promise.all([
        getAgentRequests(),
        getActiveCase(),
      ]);
      setRequests(requestsData);
      setActiveCase(activeCaseData);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Error al cargar solicitudes'
      );
      console.error('Error fetching agent requests:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleTakeRequest = useCallback(
    async (requestId: string) => {
      try {
        await takeRequest(requestId);
        await fetchRequests(); // Recargar datos
      } catch (err) {
        console.error('Error taking request:', err);
        throw err;
      }
    },
    [fetchRequests]
  );

  const handleResolveRequest = useCallback(
    async (requestId: string) => {
      try {
        await resolveRequest(requestId);
        await fetchRequests(); // Recargar datos
      } catch (err) {
        console.error('Error resolving request:', err);
        throw err;
      }
    },
    [fetchRequests]
  );

  return {
    requests,
    activeCase,
    loading,
    error,
    refetch: fetchRequests,
    takeRequest: handleTakeRequest,
    resolveRequest: handleResolveRequest,
  };
}
