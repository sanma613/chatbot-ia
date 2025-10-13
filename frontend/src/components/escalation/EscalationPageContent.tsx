'use client';

import React, { useState } from 'react';
import { TicketStatus, TicketPriority, TicketCategory } from '@/types/escalation';
import EscalationHeader from '@/components/escalation/EscalationHeader';
import EscalationStats from '@/components/escalation/EscalationStats';
import EscalationFilters from '@/components/escalation/EscalationFilters';
import EscalationTicketList from '@/components/escalation/EscalationTicketList';
import Toast from '@/components/Toast';
import { useEscalation } from '@/hooks/useEscalation';
import { useToast } from '@/hooks/useToast';
import { currentAdmin } from '@/lib/mockEscalationData';

interface EscalationPageContentProps {
    isDevMode?: boolean;
}

export default function EscalationPageContent({ isDevMode = false }: EscalationPageContentProps) {
    const { toast, hideToast } = useToast();
    const { tickets, handleTakeTicket, handleUpdateStatus, handleAddResolution, filterTickets } = useEscalation();
    
    // Estados de filtros
    const [statusFilter, setStatusFilter] = useState<TicketStatus>('all');
    const [priorityFilter, setPriorityFilter] = useState<TicketPriority>('all');
    const [categoryFilter, setCategoryFilter] = useState<TicketCategory>('all');

    // Obtener tickets filtrados
    const filteredTickets = filterTickets(statusFilter, priorityFilter, categoryFilter);

    return (
        <div className="min-h-screen bg-white">
            <div className="max-w-7xl mx-auto p-6 space-y-6">
                {/* Header */}
                <EscalationHeader isDevMode={isDevMode} />

                {/* Estadísticas */}
                <EscalationStats tickets={tickets} />

                {/* Filtros */}
                <EscalationFilters
                    statusFilter={statusFilter}
                    priorityFilter={priorityFilter}
                    categoryFilter={categoryFilter}
                    onStatusChange={setStatusFilter}
                    onPriorityChange={setPriorityFilter}
                    onCategoryChange={setCategoryFilter}
                    tickets={tickets}
                />

                {/* Lista de tickets */}
                <EscalationTicketList
                    tickets={tickets}
                    filteredTickets={filteredTickets}
                    statusFilter={statusFilter}
                    priorityFilter={priorityFilter}
                    categoryFilter={categoryFilter}
                    onTakeTicket={handleTakeTicket}
                    onUpdateStatus={handleUpdateStatus}
                    onAddResolution={handleAddResolution}
                    currentAdminId={currentAdmin.id}
                />
            </div>

            {/* Toast */}
            {toast && (
                <Toast
                    title={toast.title}
                    message={toast.message}
                    type={toast.type}
                    isVisible={toast.isVisible}
                    onClose={hideToast}
                    autoClose={true}
                    duration={4000}
                />
            )}
        </div>
    );
}