import clsx from 'clsx';
import { useState } from 'react';
import {
  Bell,
  Clock,
  CheckCircle,
  X,
  Calendar,
  MapPin,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import { Notification } from '@/types/notifications';

interface NotificationCardProps {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
  onMarkAsUnread?: (id: string) => void;
  onDismiss: (id: string) => void;
  onMarkCompleted: (activityId: string) => void;
  onRestore?: (id: string) => void;
  isDismissed?: boolean;
}

export default function NotificationCard({
  notification,
  onMarkAsRead,
  onMarkAsUnread,
  onDismiss,
  onMarkCompleted,
  onRestore,
  isDismissed = false,
}: NotificationCardProps) {
  const [isCompleting, setIsCompleting] = useState(false);

  // Manejar marcar como completada con estado de carga
  const handleMarkCompleted = async (activityId: string) => {
    setIsCompleting(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 500)); // Simular delay
      onMarkCompleted(activityId);
    } finally {
      setIsCompleting(false);
    }
  };

  // Obtener icono según el tipo
  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'overdue':
        return <AlertTriangle className="w-5 h-5 text-red-500" />;
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'upcoming':
        return <Clock className="w-5 h-5 text-orange-500" />;
      case 'reminder':
        return <Bell className="w-5 h-5 text-blue-500" />;
      default:
        return <Bell className="w-5 h-5 text-dark" />;
    }
  };

  // Formatear fecha relativa (convierte UTC a hora local automáticamente)
  const formatRelativeDate = (dateString: string) => {
    // JavaScript convierte automáticamente UTC a hora local del navegador
    const date = new Date(dateString);
    const now = new Date();

    // Calcular diferencia en minutos para más precisión
    const diffInMinutes = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60)
    );

    if (diffInMinutes < 1) return 'Justo ahora';
    if (diffInMinutes < 60)
      return `Hace ${diffInMinutes} minuto${diffInMinutes > 1 ? 's' : ''}`;

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24)
      return `Hace ${diffInHours} hora${diffInHours > 1 ? 's' : ''}`;

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays === 1) return 'Ayer';
    if (diffInDays < 7) return `Hace ${diffInDays} días`;

    return date.toLocaleDateString('es-ES');
  };

  return (
    <div
      className={clsx(
        'bg-white rounded-lg shadow-sm border p-6 transition-all hover:shadow-md',
        {
          'border-l-4 border-l-blue-500': !notification.isRead,
          'opacity-75': notification.isRead,
        }
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-4 flex-1">
          {/* Icono */}
          <div className="flex-shrink-0 mt-1">
            {getNotificationIcon(notification.type)}
          </div>

          {/* Contenido */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold text-dark truncate">
                {notification.title}
              </h3>
              <span className="text-sm text-dark flex-shrink-0 ml-2">
                {formatRelativeDate(notification.createdAt)}
              </span>
            </div>

            <p className="text-dark mb-3">{notification.message}</p>

            {/* Detalles de la actividad */}
            <div className="bg-gray-50 rounded-lg p-3 mb-4">
              <h4 className="font-medium text-dark mb-2">
                {notification.activityTitle}
              </h4>
              <div className="flex flex-wrap gap-4 text-sm text-dark">
                <div className="flex items-center">
                  <Calendar className="w-4 h-4 mr-1" />
                  {notification.date.split('-').reverse().join('/')} a las{' '}
                  {notification.time}
                </div>
                {notification.location && (
                  <div className="flex items-center">
                    <MapPin className="w-4 h-4 mr-1" />
                    {notification.location}
                  </div>
                )}
              </div>
            </div>

            {/* Acciones */}
            <div className="flex flex-wrap gap-2">
              {isDismissed ? (
                // Botón de restaurar para notificaciones descartadas
                <button
                  onClick={() => onRestore?.(notification.id)}
                  className="px-3 py-1.5 bg-blue-100 text-blue-800 rounded-md text-sm font-medium hover:bg-blue-200 transition-colors"
                >
                  Restaurar
                </button>
              ) : (
                <>
                  {!notification.isRead ? (
                    <button
                      onClick={() => onMarkAsRead(notification.id)}
                      className="px-3 py-1.5 bg-blue-100 text-blue-800 rounded-md text-sm font-medium hover:bg-blue-200 transition-colors"
                    >
                      Marcar como leída
                    </button>
                  ) : (
                    onMarkAsUnread && (
                      <button
                        onClick={() => onMarkAsUnread(notification.id)}
                        className="px-3 py-1.5 text-blue-600 text-sm font-medium hover:underline"
                      >
                        Marcar como no leída
                      </button>
                    )
                  )}

                  {(notification.type === 'reminder' ||
                    notification.type === 'upcoming') && (
                    <button
                      onClick={() =>
                        handleMarkCompleted(notification.activityId)
                      }
                      disabled={isCompleting}
                      className={clsx(
                        'px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-2',
                        {
                          'bg-green-100 text-green-800 hover:bg-green-200':
                            !isCompleting,
                          'bg-gray-100 text-gray-500 cursor-not-allowed':
                            isCompleting,
                        }
                      )}
                    >
                      {isCompleting && (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      )}
                      {isCompleting
                        ? 'Completando...'
                        : 'Marcar como completada'}
                    </button>
                  )}

                  <button
                    onClick={() => onDismiss(notification.id)}
                    className="px-3 py-1.5 bg-gray-100 text-dark rounded-md text-sm font-medium hover:bg-gray-200 transition-colors"
                  >
                    Descartar
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Botón de cerrar - solo para notificaciones activas */}
        {!isDismissed && (
          <button
            onClick={() => onDismiss(notification.id)}
            className="flex-shrink-0 text-gray-400 hover:text-dark transition-colors ml-4"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
}
