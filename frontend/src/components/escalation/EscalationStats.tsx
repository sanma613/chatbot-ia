import { Clock, AlertCircle, CheckCircle, TrendingUp, Users } from 'lucide-react';
import { EscalatedTicket } from '@/types/escalation';

interface EscalationStatsProps {
    tickets: EscalatedTicket[];
}

export default function EscalationStats({ tickets }: EscalationStatsProps) {
    // Calcular estadísticas
    const totalTickets = tickets.length;
    const pendingTickets = tickets.filter(t => t.status === 'pending').length;
    const inProgressTickets = tickets.filter(t => t.status === 'in_progress').length;
    const resolvedTickets = tickets.filter(t => t.status === 'resolved').length;
    const urgentTickets = tickets.filter(t => t.priority === 'urgent').length;
    
    // Calcular tiempo promedio de resolución (simulado)
    // const avgResolutionTime = resolvedTickets > 0 ? '2.5h' : 'N/A';
    
    // Tasa de resolución
    const resolutionRate = totalTickets > 0 
        ? Math.round((resolvedTickets / totalTickets) * 100) 
        : 0;

    const stats = [
        {
            label: 'Total de Tickets',
            value: totalTickets,
            icon: AlertCircle,
            color: 'text-blue-500',
            bgColor: 'bg-blue-100'
        },
        {
            label: 'Pendientes',
            value: pendingTickets,
            icon: Clock,
            color: 'text-yellow-500',
            bgColor: 'bg-yellow-100'
        },
        {
            label: 'En Progreso',
            value: inProgressTickets,
            icon: Users,
            color: 'text-orange-500',
            bgColor: 'bg-orange-100'
        },
        {
            label: 'Resueltos',
            value: resolvedTickets,
            icon: CheckCircle,
            color: 'text-green-500',
            bgColor: 'bg-green-100'
        },
        {
            label: 'Urgentes',
            value: urgentTickets,
            icon: AlertCircle,
            color: 'text-red-500',
            bgColor: 'bg-red-100'
        },
        {
            label: 'Tasa de Resolución',
            value: `${resolutionRate}%`,
            icon: TrendingUp,
            color: 'text-purple-500',
            bgColor: 'bg-purple-100'
        }
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
            {stats.map((stat) => (
                <div key={stat.label} className="bg-white rounded-lg shadow-sm border p-4">
                    <div className="flex items-center">
                        <div className={`flex-shrink-0 ${stat.bgColor} rounded-lg p-2`}>
                            <stat.icon className={`w-6 h-6 ${stat.color}`} />
                        </div>
                        <div className="ml-3 flex-1 min-w-0">
                            <p className="text-sm font-medium text-dark truncate">
                                {stat.label}
                            </p>
                            <p className="text-2xl font-semibold text-dark">
                                {stat.value}
                            </p>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}