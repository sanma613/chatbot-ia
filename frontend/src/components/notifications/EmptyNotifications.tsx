import { Bell } from 'lucide-react';
import { NotificationFilter } from '@/types/notifications';

interface EmptyNotificationsProps {
  filter: NotificationFilter;
}

export default function EmptyNotifications({
  filter,
}: EmptyNotificationsProps) {
  const getEmptyMessage = () => {
    switch (filter) {
      case 'unread':
        return 'No hay notificaciones sin leer';
      case 'overdue':
        return 'No hay actividades vencidas';
      case 'upcoming':
        return 'No hay notificaciones próximas';
      case 'completed':
        return 'No hay actividades completadas';
      case 'dismissed':
        return 'No hay notificaciones descartadas';
      default:
        return 'No tienes notificaciones en este momento';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
      <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
      <h3 className="text-lg font-medium text-dark mb-2">
        No hay notificaciones
      </h3>
      <p className="text-dark">{getEmptyMessage()}</p>
    </div>
  );
}
