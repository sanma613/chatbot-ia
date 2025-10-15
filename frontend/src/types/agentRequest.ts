// Tipos para el sistema de agentes de soporte

export interface AgentRequest {
  id: string; // UUID
  conversation_id: string; // UUID
  agent_id: string | null; // UUID
  status: 'pending' | 'in_progress' | 'resolved';
  escalated_at: string;
  assigned_at: string | null;
  resolved_at: string | null;
  // Datos adicionales de joins
  user_email?: string;
  user_name?: string;
  last_message?: string;
  message_count?: number;
}

export interface AgentConversation {
  id: string; // UUID
  user_id: string; // UUID
  created_at: string;
  updated_at: string;
  is_escalated: boolean;
  resolved: boolean;
  resolved_at: string | null;
  title?: string;
  last_message_at?: string;
  escalated_at?: string;
}

export interface AgentMessage {
  id: string; // UUID
  conversation_id: string; // UUID
  content: string;
  role: 'user' | 'assistant'; // Usar 'role' en lugar de 'sender'
  timestamp: string; // Usar 'timestamp' en lugar de 'created_at'
  image_url?: string;
  response_type?: string;
  rating?: string;
  rated_at?: string;
}

export interface AgentActiveCase {
  request: AgentRequest;
  conversation: AgentConversation;
  messages: AgentMessage[];
  user_info: {
    email: string;
    name: string;
  };
}

export type RequestStatus = 'all' | 'pending' | 'in_progress' | 'resolved';
