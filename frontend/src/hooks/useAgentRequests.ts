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

      // Fetch requests and active case separately to handle errors independently
      const requestsPromise = getAgentRequests().catch((err) => {
        console.error('Error fetching requests:', err);
        return []; // Return empty array if requests fail
      });

      const activeCasePromise = getActiveCase().catch((err) => {
        console.error('Error fetching active case:', err);
        return null; // Return null if active case fetch fails
      });

      const [requestsData, activeCaseData] = await Promise.all([
        requestsPromise,
        activeCasePromise,
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
        // Small delay to allow backend to update state before refetching
        await new Promise((resolve) => setTimeout(resolve, 500));
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
