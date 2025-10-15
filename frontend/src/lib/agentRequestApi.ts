// API para gestionar solicitudes de agentes

import { handleError } from './errors';
import type {
  AgentRequest,
  AgentActiveCase,
  AgentMessage,
} from '@/types/agentRequest';

const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

/**
 * Obtener todas las solicitudes pendientes y la solicitud activa del agente
 */
export async function getAgentRequests(): Promise<AgentRequest[]> {
  try {
    const response = await fetch(`${API_URL}/agent/requests`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });

    if (!response.ok) {
      let errorMsg = 'Error al obtener solicitudes';
      try {
        const errorData = await response.json();
        errorMsg = errorData.detail || errorMsg;
      } catch {
        // Si no se puede parsear el JSON, usar mensaje por defecto
      }
      console.error(
        `getAgentRequests failed: ${response.status} - ${errorMsg}`
      );
      throw new Error(errorMsg);
    }

    const data = await response.json();
    return data.requests || [];
  } catch (error) {
    handleError(error);
    throw error;
  }
}

/**
 * Obtener el caso activo del agente (si tiene uno)
 */
export async function getActiveCase(): Promise<AgentActiveCase | null> {
  try {
    const response = await fetch(`${API_URL}/agent/active-case`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });

    if (response.status === 404) {
      return null; // No hay caso activo
    }

    if (!response.ok) {
      let errorMsg = 'Error al obtener caso activo';
      try {
        const errorData = await response.json();
        errorMsg = errorData.detail || errorMsg;
      } catch {
        // Si no se puede parsear el JSON, usar mensaje por defecto
      }
      console.error(`getActiveCase failed: ${response.status} - ${errorMsg}`);
      throw new Error(errorMsg);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    handleError(error);
    throw error;
  }
}

/**
 * Tomar una solicitud pendiente (asignarla al agente)
 */
export async function takeRequest(requestId: string): Promise<void> {
  try {
    const response = await fetch(
      `${API_URL}/agent/requests/${requestId}/take`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Error al tomar la solicitud');
    }
  } catch (error) {
    handleError(error);
    throw error;
  }
}

/**
 * Resolver una solicitud (marcarla como resuelta)
 */
export async function resolveRequest(requestId: string): Promise<void> {
  try {
    const response = await fetch(
      `${API_URL}/agent/requests/${requestId}/resolve`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Error al resolver la solicitud');
    }
  } catch (error) {
    handleError(error);
    throw error;
  }
}

/**
 * Enviar un mensaje como agente en una conversación
 */
export async function sendAgentMessage(
  conversationId: string,
  content: string
): Promise<AgentMessage> {
  try {
    const response = await fetch(
      `${API_URL}/agent/conversations/${conversationId}/messages`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ content }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Error al enviar mensaje');
    }

    const data = await response.json();
    return data.message;
  } catch (error) {
    handleError(error);
    throw error;
  }
}

/**
 * Obtener mensajes de una conversación
 */
export async function getConversationMessages(
  conversationId: string
): Promise<AgentMessage[]> {
  try {
    const response = await fetch(
      `${API_URL}/agent/conversations/${conversationId}/messages`,
      {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      }
    );

    if (!response.ok) {
      throw new Error('Error al obtener mensajes');
    }

    const data = await response.json();
    return data.messages || [];
  } catch (error) {
    handleError(error);
    throw error;
  }
}
