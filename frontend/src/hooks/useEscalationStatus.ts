import { useState, useEffect } from 'react';
import { getEscalationStatus, EscalationStatus } from '@/lib/conversationApi';

interface UseEscalationStatusOptions {
  /**
   * Si es true, hace polling cada 3 segundos para detectar cambios
   * Si es false, solo carga una vez
   * Por defecto: false (para optimizar performance en listas)
   */
  enablePolling?: boolean;
}

export function useEscalationStatus(
  conversationId?: string,
  options: UseEscalationStatusOptions = {}
) {
  const { enablePolling = false } = options;
  const [status, setStatus] = useState<EscalationStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!conversationId) {
      setStatus(null);
      return;
    }

    let mounted = true;

    async function fetchStatus() {
      if (!conversationId) return;

      setLoading(true);
      setError(null);

      try {
        const data = await getEscalationStatus(conversationId);
        if (mounted) {
          setStatus(data);
        }
      } catch (err) {
        if (mounted) {
          setError(
            err instanceof Error
              ? err.message
              : 'Error loading escalation status'
          );
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    // Primera carga
    fetchStatus();

    // Solo hacer polling si está habilitado (para chat activo)
    let intervalId: NodeJS.Timeout | null = null;
    if (enablePolling) {
      intervalId = setInterval(() => {
        fetchStatus();
      }, 3000);
    }

    return () => {
      mounted = false;
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [conversationId, enablePolling]);

  return { status, loading, error };
}
