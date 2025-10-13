'use client';

import React, { useState, useMemo } from 'react';
import {
  Notification,
  ActivityStatus,
  NotificationFilter,
} from '@/types/notifications';
import NotificationFilters from '@/components/notifications/NotificationFilters';
import NotificationCard from '@/components/notifications/NotificationCard';
import NotificationStats from '@/components/notifications/NotificationStats';
import EmptyNotifications from '@/components/notifications/EmptyNotifications';
import { useNotifications } from '@/hooks/useSystemNotifications';
import { useUser } from '@/hooks/useUser';
import { useToast } from '@/hooks/useToast';
import Toast from '@/components/Toast';

export default function NotificationsPage() {
  // ALL HOOKS AT THE TOP
  const [filter, setFilter] = useState<NotificationFilter>('all');
  const { toast, showSuccess, hideToast } = useToast();

  // Check authentication first
  const { user, loading: authLoading } = useUser();

  // Use real data from Supabase (exclude dismissed notifications)
  const {
    notifications: backendNotifications,
    unreadCount,
    loading: notificationsLoading,
    error,
    markAsRead: markAsReadBackend,
    markAsUnread: markAsUnreadBackend,
    markAllAsRead,
    dismiss: dismissBackend,
    restore: restoreBackend,
    completeActivity: completeActivityBackend,
  } = useNotifications({ is_dismissed: false });

  // Get dismissed notifications separately
  const { notifications: dismissedNotifications, refetch: refetchDismissed } =
    useNotifications({
      is_dismissed: true,
    });

  // Helper function to determine notification type based on activity state
  const getNotificationType = (
    activityDate: string,
    activityTime: string,
    isCompleted: boolean
  ): Notification['type'] => {
    if (isCompleted) {
      return 'completed';
    }

    const activityDateTime = new Date(`${activityDate}T${activityTime}`);
    const now = new Date();

    if (activityDateTime < now) {
      return 'overdue';
    } else if (
      activityDateTime.getTime() - now.getTime() <
      24 * 60 * 60 * 1000
    ) {
      return 'upcoming';
    } else {
      return 'reminder';
    }
  };

  // Transform backend notifications to frontend format
  // Filter out notifications older than 1 week past their due date
  const notifications: Notification[] = useMemo(() => {
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    return backendNotifications
      .filter((notif) => {
        // Get activity date
        const activityDate = notif.activities?.date || new Date().toISOString();
        const activityTime = notif.activities?.time || '00:00';
        const activityDateTime = new Date(`${activityDate}T${activityTime}`);

        // Only show if:
        // 1. Activity is not completed, OR
        // 2. Activity is in the future, OR
        // 3. Activity was completed/overdue less than 1 week ago
        const isCompleted = notif.activities?.is_completed;
        const isFuture = activityDateTime >= now;
        const isRecentlyPast = activityDateTime >= oneWeekAgo;

        return isFuture || isRecentlyPast || isCompleted;
      })
      .map((notif) => {
        const activityTitle = notif.activities?.title || 'Actividad';
        const activityDate = notif.activities?.date || new Date().toISOString();
        const activityTime = notif.activities?.time || '00:00';
        const isCompleted = notif.activities?.is_completed || false;

        // Determine notification type based on activity state
        const frontendType = getNotificationType(
          activityDate,
          activityTime,
          isCompleted
        );

        return {
          id: notif.id,
          title: notif.title,
          message: notif.message,
          type: frontendType,
          activityId: notif.activity_id || '',
          activityTitle,
          date: activityDate,
          time: activityTime,
          location: '',
          isRead: notif.is_read,
          createdAt: notif.created_at,
          dueDate: activityDate,
        };
      });
  }, [backendNotifications]);

  // Generate activity status for stats
  const activities: ActivityStatus[] = useMemo(() => {
    const activityMap = new Map<string, ActivityStatus>();

    backendNotifications.forEach((notif) => {
      if (notif.activities && notif.activity_id) {
        const activityDate = notif.activities.date;
        const activityTime = notif.activities.time;
        const activityDateTime = new Date(`${activityDate}T${activityTime}`);
        const now = new Date();
        const diffTime = activityDateTime.getTime() - now.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        let status: ActivityStatus['status'] = 'pending';
        if (notif.activities.is_completed) {
          status = 'completed';
        } else if (diffDays < 0) {
          status = 'overdue';
        }

        activityMap.set(notif.activity_id, {
          id: notif.activity_id,
          title: notif.activities.title,
          date: notif.activities.date,
          time: notif.activities.time,
          type: notif.activities.type as ActivityStatus['type'],
          status,
          daysUntilDue: diffDays,
        });
      }
    });

    return Array.from(activityMap.values());
  }, [backendNotifications]);

  // Transform dismissed notifications to frontend format (same as active notifications)
  const dismissedNotificationsFormatted: Notification[] = useMemo(() => {
    return dismissedNotifications.map((notif) => {
      const activityDate = notif.activities?.date || new Date().toISOString();
      const activityTime = notif.activities?.time || '00:00';
      const isCompleted = notif.activities?.is_completed || false;

      // Determine the correct type based on current activity state
      const notificationType = getNotificationType(
        activityDate,
        activityTime,
        isCompleted
      );

      return {
        id: notif.id,
        title: notif.title,
        message: notif.message,
        type: notificationType,
        activityId: notif.activity_id || '',
        activityTitle: notif.activities?.title || 'Actividad',
        date: activityDate,
        time: activityTime,
        location: '',
        isRead: notif.is_read,
        createdAt: notif.created_at,
        dueDate: activityDate,
      };
    });
  }, [dismissedNotifications]);

  // Filtrar todas las notificaciones según el filtro seleccionado
  const filteredNotifications = useMemo(() => {
    // Si el filtro es "dismissed", mostrar las notificaciones descartadas
    if (filter === 'dismissed') {
      return dismissedNotificationsFormatted;
    }

    // Para otros filtros, usar las notificaciones activas
    return notifications.filter((notification) => {
      if (filter === 'all') return true;
      if (filter === 'unread') return !notification.isRead;
      if (filter === 'overdue') return notification.type === 'overdue';
      if (filter === 'upcoming')
        return (
          notification.type === 'upcoming' || notification.type === 'reminder'
        );
      if (filter === 'completed') return notification.type === 'completed';
      return true;
    });
  }, [notifications, filter, dismissedNotificationsFormatted]);

  // Marcar notificación como leída
  const markAsRead = async (id: string) => {
    try {
      await markAsReadBackend(id);
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  // Marcar notificación como no leída
  const markAsUnread = async (id: string) => {
    try {
      await markAsUnreadBackend(id);
    } catch (err) {
      console.error('Error marking notification as unread:', err);
    }
  };

  // Descartar notificación
  const dismissNotification = async (id: string) => {
    try {
      await dismissBackend(id);
      // Refetch dismissed notifications to show the new one
      await refetchDismissed();
    } catch (err) {
      console.error('Error dismissing notification:', err);
    }
  };

  // Restaurar notificación descartada
  const restoreNotification = async (id: string) => {
    try {
      await restoreBackend(id);
      // Refetch dismissed notifications to remove the restored one
      await refetchDismissed();
    } catch (err) {
      console.error('Error restoring notification:', err);
    }
  };

  // Marcar actividad como completada desde notificación
  const markActivityAsCompleted = async (activityId: string) => {
    try {
      // Find the notification for this activity
      const notification = backendNotifications.find(
        (n) => n.activity_id === activityId
      );

      if (!notification) {
        console.error(`Notification for activity ${activityId} not found`);
        return;
      }

      // Complete the activity and mark notification as read
      await completeActivityBackend(notification.id);

      const activityTitle = notification.activities?.title || 'la actividad';
      showSuccess(
        'Actividad Completada',
        `Has marcado "${activityTitle}" como completada`
      );
    } catch (err) {
      console.error('Error completing activity:', err);
    }
  };

  // Early return for auth loading
  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-gray-500">Verificando autenticación...</div>
      </div>
    );
  }

  // Early return if not authenticated (shouldn't happen due to ProtectedRoute)
  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-gray-500">No autenticado</div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-hidden">
      <div className="h-full overflow-y-auto">
        <div className="max-w-4xl mx-auto p-4 space-y-6">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-dark mb-2">
                  Notificaciones
                </h1>
                <p className="text-dark">
                  Mantente al día con tus actividades académicas
                </p>
              </div>
              {unreadCount > 0 && (
                <button
                  onClick={() => markAllAsRead()}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  Marcar todas como leídas ({unreadCount})
                </button>
              )}
            </div>
          </div>

          {/* Loading state */}
          {notificationsLoading && (
            <div className="flex items-center justify-center py-8">
              <div className="text-gray-500">Cargando notificaciones...</div>
            </div>
          )}

          {/* Error state */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
              Error al cargar notificaciones: {error}
            </div>
          )}

          {/* Filtros */}
          {!notificationsLoading && !error && (
            <>
              <NotificationFilters
                filter={filter}
                setFilter={setFilter}
                notifications={notifications}
                dismissedCount={dismissedNotifications.length}
              />

              {/* Lista de Notificaciones */}
              <div className="space-y-4">
                {filteredNotifications.length === 0 ? (
                  <EmptyNotifications filter={filter} />
                ) : (
                  filteredNotifications.map((notification) => (
                    <NotificationCard
                      key={notification.id}
                      notification={notification}
                      onMarkAsRead={markAsRead}
                      onMarkAsUnread={markAsUnread}
                      onDismiss={dismissNotification}
                      onMarkCompleted={markActivityAsCompleted}
                      onRestore={restoreNotification}
                      isDismissed={filter === 'dismissed'}
                    />
                  ))
                )}
              </div>

              {/* Estadísticas */}
              <div className="pt-4">
                <NotificationStats
                  activities={activities}
                  notifications={notifications}
                />
              </div>
            </>
          )}
        </div>
      </div>

      {/* Toast de feedback */}
      {toast && (
        <Toast
          title={toast.title}
          message={toast.message}
          type={toast.type}
          isVisible={toast.isVisible}
          onClose={hideToast}
          autoClose={true}
          duration={3000}
        />
      )}
    </div>
  );
}
