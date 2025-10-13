import clsx from 'clsx';
import { TicketStatus, TicketPriority, TicketCategory, EscalatedTicket } from '@/types/escalation';

interface EscalationFiltersProps {
    statusFilter: TicketStatus;
    priorityFilter: TicketPriority;
    categoryFilter: TicketCategory;
    onStatusChange: (status: TicketStatus) => void;
    onPriorityChange: (priority: TicketPriority) => void;
    onCategoryChange: (category: TicketCategory) => void;
    tickets: EscalatedTicket[];
}

export default function EscalationFilters({
    statusFilter,
    priorityFilter,
    categoryFilter,
    onStatusChange,
    onPriorityChange,
    onCategoryChange,
    tickets
}: EscalationFiltersProps) {
    
    // Contadores por estado
    const statusCounts = {
        all: tickets.length,
        pending: tickets.filter(t => t.status === 'pending').length,
        in_progress: tickets.filter(t => t.status === 'in_progress').length,
        resolved: tickets.filter(t => t.status === 'resolved').length,
        closed: tickets.filter(t => t.status === 'closed').length
    };

    // Contadores por prioridad
    const priorityCounts = {
        all: tickets.length,
        urgent: tickets.filter(t => t.priority === 'urgent').length,
        high: tickets.filter(t => t.priority === 'high').length,
        medium: tickets.filter(t => t.priority === 'medium').length,
        low: tickets.filter(t => t.priority === 'low').length
    };

    return (
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
            <h3 className="text-lg font-semibold text-primary mb-4">Filtros</h3>
            
            <div className="space-y-6">
                {/* Filtros por estado */}
                <div>
                    <h4 className="text-sm font-medium text-dark mb-3">Estado</h4>
                    <div className="flex flex-wrap gap-2">
                        <button
                            onClick={() => onStatusChange('all')}
                            className={clsx(
                                'px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                                {
                                    'bg-blue-600 text-white': statusFilter === 'all',
                                    'bg-gray-100 text-dark hover:bg-gray-200': statusFilter !== 'all'
                                }
                            )}
                        >
                            Todos ({statusCounts.all})
                        </button>
                        <button
                            onClick={() => onStatusChange('pending')}
                            className={clsx(
                                'px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                                {
                                    'bg-yellow-600 text-white': statusFilter === 'pending',
                                    'bg-yellow-100 text-yellow-800 hover:bg-yellow-200': statusFilter !== 'pending'
                                }
                            )}
                        >
                            Pendientes ({statusCounts.pending})
                        </button>
                        <button
                            onClick={() => onStatusChange('in_progress')}
                            className={clsx(
                                'px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                                {
                                    'bg-blue-600 text-white': statusFilter === 'in_progress',
                                    'bg-blue-100 text-blue-800 hover:bg-blue-200': statusFilter !== 'in_progress'
                                }
                            )}
                        >
                            En progreso ({statusCounts.in_progress})
                        </button>
                        <button
                            onClick={() => onStatusChange('resolved')}
                            className={clsx(
                                'px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                                {
                                    'bg-green-600 text-white': statusFilter === 'resolved',
                                    'bg-green-100 text-green-800 hover:bg-green-200': statusFilter !== 'resolved'
                                }
                            )}
                        >
                            Resueltos ({statusCounts.resolved})
                        </button>
                        <button
                            onClick={() => onStatusChange('closed')}
                            className={clsx(
                                'px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                                {
                                    'bg-dark text-white': statusFilter === 'closed',
                                    'bg-gray-100 text-dark hover:bg-gray-200': statusFilter !== 'closed'
                                }
                            )}
                        >
                            Cerrados ({statusCounts.closed})
                        </button>
                    </div>
                </div>

                {/* Filtros por prioridad */}
                <div>
                    <h4 className="text-sm font-medium text-dark mb-3">Prioridad</h4>
                    <div className="flex flex-wrap gap-2">
                        <button
                            onClick={() => onPriorityChange('all')}
                            className={clsx(
                                'px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                                {
                                    'bg-blue-600 text-white': priorityFilter === 'all',
                                    'bg-gray-100 text-dark hover:bg-gray-200': priorityFilter !== 'all'
                                }
                            )}
                        >
                            Todas ({priorityCounts.all})
                        </button>
                        <button
                            onClick={() => onPriorityChange('urgent')}
                            className={clsx(
                                'px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                                {
                                    'bg-red-600 text-white': priorityFilter === 'urgent',
                                    'bg-red-100 text-red-800 hover:bg-red-200': priorityFilter !== 'urgent'
                                }
                            )}
                        >
                            Urgente ({priorityCounts.urgent})
                        </button>
                        <button
                            onClick={() => onPriorityChange('high')}
                            className={clsx(
                                'px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                                {
                                    'bg-orange-600 text-white': priorityFilter === 'high',
                                    'bg-orange-100 text-orange-800 hover:bg-orange-200': priorityFilter !== 'high'
                                }
                            )}
                        >
                            Alta ({priorityCounts.high})
                        </button>
                        <button
                            onClick={() => onPriorityChange('medium')}
                            className={clsx(
                                'px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                                {
                                    'bg-blue-600 text-white': priorityFilter === 'medium',
                                    'bg-blue-100 text-blue-800 hover:bg-blue-200': priorityFilter !== 'medium'
                                }
                            )}
                        >
                            Media ({priorityCounts.medium})
                        </button>
                        <button
                            onClick={() => onPriorityChange('low')}
                            className={clsx(
                                'px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                                {
                                    'bg-dark text-white': priorityFilter === 'low',
                                    'bg-gray-100 text-dark hover:bg-gray-200': priorityFilter !== 'low'
                                }
                            )}
                        >
                            Baja ({priorityCounts.low})
                        </button>
                    </div>
                </div>

                {/* Filtros por categoría */}
                <div>
                    <h4 className="text-sm font-medium text-dark mb-3">Categoría</h4>
                    <div className="flex flex-wrap gap-2">
                        <button
                            onClick={() => onCategoryChange('all')}
                            className={clsx(
                                'px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                                {
                                    'bg-blue-600 text-white': categoryFilter === 'all',
                                    'bg-gray-100 text-dark hover:bg-gray-200': categoryFilter !== 'all'
                                }
                            )}
                        >
                            Todas
                        </button>
                        <button
                            onClick={() => onCategoryChange('academic')}
                            className={clsx(
                                'px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                                {
                                    'bg-purple-600 text-white': categoryFilter === 'academic',
                                    'bg-purple-100 text-purple-800 hover:bg-purple-200': categoryFilter !== 'academic'
                                }
                            )}
                        >
                            Académico
                        </button>
                        <button
                            onClick={() => onCategoryChange('technical')}
                            className={clsx(
                                'px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                                {
                                    'bg-indigo-600 text-white': categoryFilter === 'technical',
                                    'bg-indigo-100 text-indigo-800 hover:bg-indigo-200': categoryFilter !== 'technical'
                                }
                            )}
                        >
                            Técnico
                        </button>
                        <button
                            onClick={() => onCategoryChange('administrative')}
                            className={clsx(
                                'px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                                {
                                    'bg-emerald-600 text-white': categoryFilter === 'administrative',
                                    'bg-emerald-100 text-emerald-800 hover:bg-emerald-200': categoryFilter !== 'administrative'
                                }
                            )}
                        >
                            Administrativo
                        </button>
                        <button
                            onClick={() => onCategoryChange('general')}
                            className={clsx(
                                'px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                                {
                                    'bg-dark text-white': categoryFilter === 'general',
                                    'bg-gray-100 textdark hover:bg-gray-200': categoryFilter !== 'general'
                                }
                            )}
                        >
                            General
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}