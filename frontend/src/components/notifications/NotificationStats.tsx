import { CheckCircle, Clock, AlertTriangle, Bell } from 'lucide-react';
import { ActivityStatus, Notification } from '@/types/notifications';

interface NotificationStatsProps {
    activities: ActivityStatus[];
    notifications: Notification[];
}

export default function NotificationStats({ activities, notifications }: NotificationStatsProps) {
    const stats = [
        {
            label: 'Completadas',
            value: activities.filter(a => a.status === 'completed').length,
            icon: CheckCircle,
            color: 'text-green-500'
        },
        {
            label: 'Pendientes',
            value: activities.filter(a => a.status === 'pending').length,
            icon: Clock,
            color: 'text-blue-500'
        },
        {
            label: 'Vencidas',
            value: activities.filter(a => a.status === 'overdue').length,
            icon: AlertTriangle,
            color: 'text-red-500'
        },
        {
            label: 'No leídas',
            value: notifications.filter(n => !n.isRead).length,
            icon: Bell,
            color: 'text-orange-500'
        }
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {stats.map((stat) => (
                <div key={stat.label} className="bg-white rounded-lg shadow-sm border p-4">
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <stat.icon className={`w-8 h-8 ${stat.color}`} />
                        </div>
                        <div className="ml-3">
                            <p className="text-sm font-medium text-dark">{stat.label}</p>
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