import clsx from 'clsx';
import { useState } from 'react';
import { 
    User, 
    Mail, 
    AlertCircle, 
    CheckCircle, 
    PlayCircle, 
    XCircle,
    ChevronDown,
    ChevronUp,
    Calendar
} from 'lucide-react';
import { EscalatedTicket } from '@/types/escalation';

interface EscalatedTicketCardProps {
    ticket: EscalatedTicket;
    onTakeTicket: (ticketId: string) => void;
    onUpdateStatus: (ticketId: string, status: EscalatedTicket['status']) => void;
    onAddResolution: (ticketId: string, resolution: string) => void;
    currentAdminId: string;
}

export default function EscalatedTicketCard({
    ticket,
    onTakeTicket,
    onUpdateStatus,
    onAddResolution,
    currentAdminId
}: EscalatedTicketCardProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [showResolutionForm, setShowResolutionForm] = useState(false);
    const [resolutionText, setResolutionText] = useState('');

    // Obtener estilos según el estado
    const getStatusStyles = (status: EscalatedTicket['status']) => {
        switch (status) {
            case 'pending':
                return {
                    bg: 'bg-yellow-100',
                    text: 'text-yellow-800',
                    border: 'border-yellow-200',
                    icon: AlertCircle
                };
            case 'in_progress':
                return {
                    bg: 'bg-blue-100',
                    text: 'text-blue-800',
                    border: 'border-blue-200',
                    icon: PlayCircle
                };
            case 'resolved':
                return {
                    bg: 'bg-green-100',
                    text: 'text-green-800',
                    border: 'border-green-200',
                    icon: CheckCircle
                };
            case 'closed':
                return {
                    bg: 'bg-gray-100',
                    text: 'text-dark',
                    border: 'border-gray-200',
                    icon: XCircle
                };
        }
    };

    // Obtener estilos según la prioridad
    const getPriorityStyles = (priority: EscalatedTicket['priority']) => {
        switch (priority) {
            case 'low':
                return 'bg-gray-100 text-dark';
            case 'medium':
                return 'bg-blue-100 text-blue-800';
            case 'high':
                return 'bg-orange-100 text-orange-800';
            case 'urgent':
                return 'bg-red-100 text-red-800';
        }
    };

    const statusStyles = getStatusStyles(ticket.status);
    const StatusIcon = statusStyles.icon;

    // Formatear fecha
    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Manejar envío de resolución
    const handleSubmitResolution = () => {
        if (resolutionText.trim()) {
            onAddResolution(ticket.id, resolutionText);
            onUpdateStatus(ticket.id, 'resolved');
            setResolutionText('');
            setShowResolutionForm(false);
        }
    };

    const canTakeTicket = ticket.status === 'pending' && !ticket.assignedToAdmin;
    const isAssignedToCurrentAdmin = ticket.assignedToAdmin === currentAdminId;
    const canUpdateTicket = isAssignedToCurrentAdmin || ticket.status === 'pending';

    return (
        <div className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow">
            {/* Header del ticket */}
            <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                    {/* Info principal */}
                    <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                            <span className="text-sm font-mono text-dark">#{ticket.id}</span>
                            <span className={clsx(
                                'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium',
                                statusStyles.bg,
                                statusStyles.text
                            )}>
                                <StatusIcon className="w-3 h-3 mr-1" />
                                {ticket.status.replace('_', ' ').toUpperCase()}
                            </span>
                            <span className={clsx(
                                'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium',
                                getPriorityStyles(ticket.priority)
                            )}>
                                {ticket.priority.toUpperCase()}
                            </span>
                        </div>

                        <div className="flex items-center gap-4 text-sm text-dark mb-3">
                            <div className="flex items-center gap-1">
                                <User className="w-4 h-4" />
                                <span className="font-medium">{ticket.studentName}</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <Mail className="w-4 h-4" />
                                <span>{ticket.studentEmail}</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                <span>{formatDate(ticket.escalatedAt)}</span>
                            </div>
                        </div>

                        {/* Pregunta original (truncada) */}
                        <div className="mb-3">
                            <h4 className="text-sm font-medium text-dark mb-1">Pregunta del estudiante:</h4>
                            <p className="text-dark bg-gray-50 rounded-lg p-3 text-sm">
                                {isExpanded 
                                    ? ticket.originalQuestion 
                                    : `${ticket.originalQuestion.slice(0, 150)}${ticket.originalQuestion.length > 150 ? '...' : ''}`
                                }
                            </p>
                        </div>
                    </div>

                    {/* Botón expandir/contraer */}
                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="flex-shrink-0 p-2 text-dark hover:text-dark rounded-lg hover:bg-gray-100 transition-colors"
                    >
                        {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </button>
                </div>

                {/* Información expandida */}
                {isExpanded && (
                    <div className="space-y-4 border-t pt-4">
                        {/* Respuesta del chatbot */}
                        <div>
                            <h4 className="text-sm font-medium text-dark mb-2">Respuesta del chatbot:</h4>
                            <div className="bg-blue-50 rounded-lg p-3 text-sm text-dark">
                                {ticket.chatbotResponse}
                            </div>
                        </div>

                        {/* Admin asignado */}
                        {ticket.assignedToAdmin && (
                            <div>
                                <h4 className="text-sm font-medium text-dark mb-1">Asignado a:</h4>
                                <p className="text-sm text-dark">{ticket.assignedToAdmin}</p>
                            </div>
                        )}

                        {/* Notas del admin */}
                        {ticket.adminNotes && (
                            <div>
                                <h4 className="text-sm font-medium text-dark mb-1">Notas del administrador:</h4>
                                <p className="text-sm text-dark bg-yellow-50 rounded-lg p-3">{ticket.adminNotes}</p>
                            </div>
                        )}

                        {/* Resolución */}
                        {ticket.resolution && (
                            <div>
                                <h4 className="text-sm font-medium text-dark mb-1">Resolución:</h4>
                                <div className="bg-green-50 rounded-lg p-3 text-sm text-dark">
                                    {ticket.resolution}
                                    {ticket.resolvedAt && (
                                        <p className="text-xs text-gray-600 mt-2">
                                            Resuelto el {formatDate(ticket.resolvedAt)}
                                        </p>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Acciones */}
                <div className="flex items-center gap-2 mt-4 pt-4 border-t">
                    {canTakeTicket && (
                        <button
                            onClick={() => onTakeTicket(ticket.id)}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                        >
                            Tomar ticket
                        </button>
                    )}

                    {canUpdateTicket && ticket.status === 'pending' && ticket.assignedToAdmin && (
                        <button
                            onClick={() => onUpdateStatus(ticket.id, 'in_progress')}
                            className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm font-medium"
                        >
                            Marcar en progreso
                        </button>
                    )}

                    {canUpdateTicket && ticket.status === 'in_progress' && (
                        <button
                            onClick={() => setShowResolutionForm(!showResolutionForm)}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                        >
                            Resolver ticket
                        </button>
                    )}

                    {canUpdateTicket && ticket.status === 'resolved' && (
                        <button
                            onClick={() => onUpdateStatus(ticket.id, 'closed')}
                            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm font-medium"
                        >
                            Cerrar ticket
                        </button>
                    )}
                </div>

                {/* Formulario de resolución */}
                {showResolutionForm && (
                    <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                        <h5 className="text-sm font-medium text-dark mb-3">Agregar resolución:</h5>
                        <textarea
                            value={resolutionText}
                            onChange={(e) => setResolutionText(e.target.value)}
                            className="w-full text-dark p-3 border rounded-lg focus:outline-none focus:border-gray-400"
                            rows={4}
                            placeholder="Describe la resolución del problema..."
                        />
                        <div className="flex items-center gap-2 mt-3">
                            <button
                                onClick={handleSubmitResolution}
                                disabled={!resolutionText.trim()}
                                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                            >
                                Enviar resolución
                            </button>
                            <button
                                onClick={() => {
                                    setShowResolutionForm(false);
                                    setResolutionText('');
                                }}
                                className="px-4 py-2 bg-gray-300 text-dark rounded-lg hover:bg-gray-400 transition-colors text-sm font-medium"
                            >
                                Cancelar
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}