// Tipos para el sistema de chat e historial

export interface Message {
    id: string;
    content: string;
    role: 'user' | 'assistant';
    timestamp: Date;
}

export interface Conversation {
    id: string;
    title: string;
    createdAt: Date;
    updatedAt: Date;
    messageCount: number;
    lastMessage?: string;
    messages: Message[];
}

export interface ChatHistory {
    conversations: Conversation[];
    totalConversations: number;
}