import { useState, useEffect, useCallback } from 'react';
import {
  getNotifications,
  getUnreadCount,
  markNotificationAsRead,
  markNotificationAsUnread,
  markAllNotificationsAsRead,
  dismissNotification,
  restoreNotification,
  deleteNotification,
  completeActivityFromNotification,
  Notification,
  GetNotificationsParams,
} from '@/lib/notificationApi';

interface UseNotificationsReturn {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
  refetch: (params?: GetNotificationsParams) => Promise<void>;
  fetchUnreadCount: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAsUnread: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  dismiss: (id: string) => Promise<void>;
  restore: (id: string) => Promise<void>;
  remove: (id: string) => Promise<void>;
  completeActivity: (id: string) => Promise<void>;
}

/**
 * Hook for managing system notifications with real-time updates
 */
export function useNotifications(
  initialParams?: GetNotificationsParams
): UseNotificationsReturn {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch notifications
  const refetch = useCallback(
    async (params?: GetNotificationsParams) => {
      try {
        setLoading(true);
        setError(null);
        const data = await getNotifications(params || initialParams);
        setNotifications(data);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to fetch notifications';
        setError(errorMessage);
        console.error('Error fetching notifications:', err);
      } finally {
        setLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [] // Empty deps to prevent refetch on every render
  );

  // Fetch unread count
  const fetchUnreadCount = useCallback(async () => {
    try {
      const count = await getUnreadCount();
      setUnreadCount(count);
    } catch (err) {
      console.error('Error fetching unread count:', err);
    }
  }, []);

  // Mark notification as read
  const markAsRead = useCallback(
    async (id: string): Promise<void> => {
      try {
        setError(null);
        await markNotificationAsRead(id);

        // Update in local state for instant feedback
        setNotifications((prev) =>
          prev.map((notification) =>
            notification.id === id
              ? {
                  ...notification,
                  is_read: true,
                  read_at: new Date().toISOString(),
                }
              : notification
          )
        );

        // Update unread count
        setUnreadCount((prev) => Math.max(0, prev - 1));

        // Refetch to ensure consistency
        await refetch();
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : 'Failed to mark notification as read';
        setError(errorMessage);
        await refetch(); // Restore correct state on error
        throw err;
      }
    },
    [refetch]
  );

  // Mark notification as unread
  const markAsUnread = useCallback(
    async (id: string): Promise<void> => {
      try {
        setError(null);
        await markNotificationAsUnread(id);

        // Update in local state for instant feedback
        setNotifications((prev) =>
          prev.map((notification) =>
            notification.id === id
              ? {
                  ...notification,
                  is_read: false,
                  read_at: null,
                }
              : notification
          )
        );

        // Update unread count
        setUnreadCount((prev) => prev + 1);

        // Refetch to ensure consistency
        await refetch();
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : 'Failed to mark notification as unread';
        setError(errorMessage);
        await refetch(); // Restore correct state on error
        throw err;
      }
    },
    [refetch]
  );

  // Mark all notifications as read
  const markAllAsRead = useCallback(async (): Promise<void> => {
    try {
      setError(null);
      await markAllNotificationsAsRead();

      // Update all in local state for instant feedback
      setNotifications((prev) =>
        prev.map((notification) => ({
          ...notification,
          is_read: true,
          read_at: new Date().toISOString(),
        }))
      );

      // Reset unread count
      setUnreadCount(0);

      // Refetch to ensure consistency
      await refetch();
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : 'Failed to mark all notifications as read';
      setError(errorMessage);
      await refetch(); // Restore correct state on error
      throw err;
    }
  }, [refetch]);

  // Dismiss notification
  const dismiss = useCallback(
    async (id: string): Promise<void> => {
      try {
        setError(null);
        await dismissNotification(id);

        // Remove from local state immediately for instant UI feedback
        setNotifications((prev) => prev.filter((n) => n.id !== id));

        // Update unread count if it was unread
        const notification = notifications.find((n) => n.id === id);
        if (notification && !notification.is_read) {
          setUnreadCount((prev) => Math.max(0, prev - 1));
        }

        // Refetch to ensure data consistency
        await refetch();
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to dismiss notification';
        setError(errorMessage);
        // Refetch on error to restore correct state
        await refetch();
        throw err;
      }
    },
    [notifications, refetch]
  );

  // Restore dismissed notification
  const restore = useCallback(
    async (id: string): Promise<void> => {
      try {
        setError(null);
        await restoreNotification(id);

        // Update in local state for instant feedback
        setNotifications((prev) =>
          prev.map((notification) =>
            notification.id === id
              ? { ...notification, is_dismissed: false }
              : notification
          )
        );

        // Refetch to ensure consistency
        await refetch();
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to restore notification';
        setError(errorMessage);
        await refetch(); // Restore correct state on error
        throw err;
      }
    },
    [refetch]
  );

  // Delete notification
  const remove = useCallback(
    async (id: string): Promise<void> => {
      try {
        setError(null);
        await deleteNotification(id);

        // Remove from local state for instant feedback
        const notification = notifications.find((n) => n.id === id);
        setNotifications((prev) => prev.filter((n) => n.id !== id));

        // Update unread count if it was unread
        if (notification && !notification.is_read) {
          setUnreadCount((prev) => Math.max(0, prev - 1));
        }

        // Refetch to ensure consistency
        await refetch();
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to delete notification';
        setError(errorMessage);
        await refetch(); // Restore correct state on error
        throw err;
      }
    },
    [notifications, refetch]
  );

  // Complete activity from notification
  const completeActivity = useCallback(
    async (id: string): Promise<void> => {
      try {
        setError(null);
        await completeActivityFromNotification(id);

        // Update notification in local state for instant feedback
        setNotifications((prev) =>
          prev.map((notification) =>
            notification.id === id
              ? {
                  ...notification,
                  is_read: true,
                  read_at: new Date().toISOString(),
                }
              : notification
          )
        );

        // Update unread count
        const notification = notifications.find((n) => n.id === id);
        if (notification && !notification.is_read) {
          setUnreadCount((prev) => Math.max(0, prev - 1));
        }

        // Refetch to get updated data (activity completed status)
        await refetch();
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : 'Failed to complete activity from notification';
        setError(errorMessage);
        await refetch(); // Restore correct state on error
        throw err;
      }
    },
    [notifications, refetch]
  );

  // Initial fetch (only once on mount)
  useEffect(() => {
    refetch(initialParams);
    fetchUnreadCount();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty array = only run once on mount

  return {
    notifications,
    unreadCount,
    loading,
    error,
    refetch,
    fetchUnreadCount,
    markAsRead,
    markAsUnread,
    markAllAsRead,
    dismiss,
    restore,
    remove,
    completeActivity,
  };
}
