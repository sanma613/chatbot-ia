import { useState } from 'react';
import { EscalatedTicket, TicketStatus, TicketPriority, TicketCategory } from '@/types/escalation';
import { useToast } from '@/hooks/useToast';
import { mockEscalatedTickets, currentAdmin } from '@/lib/mockEscalationData';

export function useEscalation() {
    const { showSuccess } = useToast();
    const [tickets, setTickets] = useState<EscalatedTicket[]>(mockEscalatedTickets);

    // Manejar tomar ticket
    const handleTakeTicket = (ticketId: string) => {
        setTickets(prev => 
            prev.map(ticket => 
                ticket.id === ticketId 
                    ? { ...ticket, assignedToAdmin: currentAdmin.id, status: 'in_progress' }
                    : ticket
            )
        );
        
        showSuccess('Ticket Asignado', 'Has tomado este ticket exitosamente');
    };

    // Manejar cambio de estado
    const handleUpdateStatus = (ticketId: string, newStatus: EscalatedTicket['status']) => {
        setTickets(prev => 
            prev.map(ticket => 
                ticket.id === ticketId 
                    ? { 
                        ...ticket, 
                        status: newStatus,
                        ...(newStatus === 'closed' && { resolvedAt: new Date().toISOString() })
                    }
                    : ticket
            )
        );

        const statusMessages = {
            'pending': 'Ticket marcado como pendiente',
            'in_progress': 'Ticket en progreso',
            'resolved': 'Ticket resuelto exitosamente',
            'closed': 'Ticket cerrado'
        };

        showSuccess('Estado Actualizado', statusMessages[newStatus]);
    };

    // Manejar agregar resolución
    const handleAddResolution = (ticketId: string, resolution: string) => {
        setTickets(prev => 
            prev.map(ticket => 
                ticket.id === ticketId 
                    ? { 
                        ...ticket, 
                        resolution,
                        resolvedAt: new Date().toISOString()
                    }
                    : ticket
            )
        );

        showSuccess('Resolución Agregada', 'La resolución se ha guardado exitosamente');
    };

    // Filtrar tickets
    const filterTickets = (
        statusFilter: TicketStatus,
        priorityFilter: TicketPriority,
        categoryFilter: TicketCategory
    ) => {
        return tickets.filter(ticket => {
            const statusMatch = statusFilter === 'all' || ticket.status === statusFilter;
            const priorityMatch = priorityFilter === 'all' || ticket.priority === priorityFilter;
            const categoryMatch = categoryFilter === 'all' || ticket.category === categoryFilter;
            
            return statusMatch && priorityMatch && categoryMatch;
        });
    };

    return {
        tickets,
        handleTakeTicket,
        handleUpdateStatus,
        handleAddResolution,
        filterTickets
    };
}