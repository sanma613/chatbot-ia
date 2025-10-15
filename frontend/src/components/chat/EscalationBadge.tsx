import React from 'react';
import { AlertCircle, Clock, UserCheck, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/Utils';
import { EscalationStatus } from '@/lib/conversationApi';

interface EscalationBadgeProps {
  status: EscalationStatus | null;
  className?: string;
}

export default function EscalationBadge({
  status,
  className,
}: EscalationBadgeProps) {
  if (!status) return null;

  // No escalada
  if (!status.is_escalated) {
    return null; // No mostrar badge si no está escalada
  }

  const agentRequest = status.agent_request;

  // Resuelta
  if (status.resolved) {
    return (
      <div
        className={cn(
          'inline-flex items-center gap-1.5 px-2.5 py-1',
          'bg-green-100 text-green-700 rounded-full',
          'text-xs font-medium',
          className
        )}
        title="Esta conversación ha sido resuelta"
      >
        <CheckCircle2 className="w-3.5 h-3.5" />
        Resuelta
      </div>
    );
  }

  // En proceso (asignada a un agente)
  if (agentRequest?.status === 'in_progress') {
    return (
      <div
        className={cn(
          'inline-flex items-center gap-1.5 px-2.5 py-1',
          'bg-blue-100 text-blue-700 rounded-full',
          'text-xs font-medium',
          className
        )}
        title={`En proceso - Agente: ${agentRequest.agent_name || 'Asignado'}`}
      >
        <UserCheck className="w-3.5 h-3.5" />
        En proceso
      </div>
    );
  }

  // Pendiente (escalada pero sin asignar)
  if (agentRequest?.status === 'pending' || !agentRequest) {
    return (
      <div
        className={cn(
          'inline-flex items-center gap-1.5 px-2.5 py-1',
          'bg-amber-100 text-amber-700 rounded-full',
          'text-xs font-medium',
          className
        )}
        title="Esperando a que un agente tome el caso"
      >
        <Clock className="w-3.5 h-3.5" />
        Pendiente
      </div>
    );
  }

  // Por defecto (escalada)
  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1',
        'bg-gray-100 text-gray-700 rounded-full',
        'text-xs font-medium',
        className
      )}
      title="Escalada a agente de soporte"
    >
      <AlertCircle className="w-3.5 h-3.5" />
      Escalada
    </div>
  );
}
