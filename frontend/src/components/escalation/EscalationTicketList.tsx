import { Shield } from 'lucide-react';
import { EscalatedTicket, TicketStatus, TicketPriority, TicketCategory } from '@/types/escalation';
import EscalatedTicketCard from './EscalatedTicketCard';

interface EscalationTicketListProps {
    tickets: EscalatedTicket[];
    filteredTickets: EscalatedTicket[];
    statusFilter: TicketStatus;
    priorityFilter: TicketPriority;
    categoryFilter: TicketCategory;
    onTakeTicket: (ticketId: string) => void;
    onUpdateStatus: (ticketId: string, status: EscalatedTicket['status']) => void;
    onAddResolution: (ticketId: string, resolution: string) => void;
    currentAdminId: string;
}

export default function EscalationTicketList({
    tickets,
    filteredTickets,
    statusFilter,
    priorityFilter,
    categoryFilter,
    onTakeTicket,
    onUpdateStatus,
    onAddResolution,
    currentAdminId
}: EscalationTicketListProps) {
    
    const hasActiveFilters = statusFilter !== 'all' || priorityFilter !== 'all' || categoryFilter !== 'all';

    return (
        <div className="space-y-4">
            {filteredTickets.length === 0 ? (
                <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
                    <Shield className="w-16 h-16 text-dark mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-dark mb-2">
                        No hay tickets para mostrar
                    </h3>
                    <p className="text-dark">
                        {hasActiveFilters
                            ? 'No se encontraron tickets que coincidan con los filtros seleccionados.'
                            : 'No hay tickets escalados en este momento.'
                        }
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <p className="text-sm text-dark">
                            Mostrando {filteredTickets.length} de {tickets.length} tickets
                        </p>
                    </div>
                    
                    {filteredTickets.map((ticket) => (
                        <EscalatedTicketCard
                            key={ticket.id}
                            ticket={ticket}
                            onTakeTicket={onTakeTicket}
                            onUpdateStatus={onUpdateStatus}
                            onAddResolution={onAddResolution}
                            currentAdminId={currentAdminId}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}