// Tipos para el sistema de escalación
export interface EscalatedTicket {
    id: string;
    studentId: string;
    studentName: string;
    studentEmail: string;
    originalQuestion: string;
    chatbotResponse: string;
    category: 'academic' | 'technical' | 'administrative' | 'general';
    status: 'pending' | 'in_progress' | 'resolved' | 'closed';
    priority: 'low' | 'medium' | 'high' | 'urgent';
    escalatedAt: string;
    assignedToAdmin?: string;
    adminNotes?: string;
    resolution?: string;
    resolvedAt?: string;
    estimatedResolutionTime?: string;
}

export interface AdminUser {
    id: string;
    name: string;
    email: string;
    role: 'admin' | 'super_admin';
    department: string;
}

export type TicketStatus = 'all' | 'pending' | 'in_progress' | 'resolved' | 'closed';
export type TicketPriority = 'all' | 'low' | 'medium' | 'high' | 'urgent';
export type TicketCategory = 'all' | 'academic' | 'technical' | 'administrative' | 'general';