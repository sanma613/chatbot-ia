// Notification API client for frontend
// Handles all notification-related API calls to the backend

const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

export interface Notification {
  id: string;
  user_id: string;
  activity_id?: string;
  type: 'reminder' | 'deadline' | 'update' | 'system';
  title: string;
  message: string;
  is_read: boolean;
  is_dismissed: boolean;
  created_at: string;
  // Optional activity details (if populated)
  activities?: {
    id: string;
    title: string;
    date: string;
    time: string;
    type: string;
    is_completed: boolean;
  };
}

export interface GetNotificationsParams {
  is_read?: boolean;
  is_dismissed?: boolean;
  notification_type?: string;
  limit?: number;
}

/**
 * Get all notifications for the authenticated user
 */
export async function getNotifications(
  params?: GetNotificationsParams
): Promise<Notification[]> {
  const queryParams = new URLSearchParams();

  if (params?.is_read !== undefined)
    queryParams.append('is_read', String(params.is_read));
  if (params?.is_dismissed !== undefined)
    queryParams.append('is_dismissed', String(params.is_dismissed));
  if (params?.notification_type)
    queryParams.append('notification_type', params.notification_type);
  if (params?.limit) queryParams.append('limit', String(params.limit));

  const url = `${API_URL}/notifications${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errorMessage =
      errorData.detail || `Failed to fetch notifications (${response.status})`;
    throw new Error(errorMessage);
  }

  return response.json();
}

/**
 * Get unread notification count
 */
export async function getUnreadCount(): Promise<number> {
  const response = await fetch(`${API_URL}/notifications/unread-count`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errorMessage =
      errorData.detail || `Failed to fetch unread count (${response.status})`;
    throw new Error(errorMessage);
  }

  const data = await response.json();
  return data.count;
}

/**
 * Get a specific notification by ID
 */
export async function getNotificationById(
  notificationId: string
): Promise<Notification> {
  const response = await fetch(`${API_URL}/notifications/${notificationId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errorMessage =
      errorData.detail || `Failed to fetch notification (${response.status})`;
    throw new Error(errorMessage);
  }

  return response.json();
}

/**
 * Mark a notification as read
 */
export async function markNotificationAsRead(
  notificationId: string
): Promise<Notification> {
  const response = await fetch(
    `${API_URL}/notifications/${notificationId}/read`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errorMessage =
      errorData.detail ||
      `Failed to mark notification as read (${response.status})`;
    throw new Error(errorMessage);
  }

  return response.json();
}

/**
 * Mark all notifications as read
 */
export async function markAllNotificationsAsRead(): Promise<number> {
  const response = await fetch(`${API_URL}/notifications/read-all`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errorMessage =
      errorData.detail ||
      `Failed to mark all notifications as read (${response.status})`;
    throw new Error(errorMessage);
  }

  const data = await response.json();
  return data.updated_count;
}

/**
 * Dismiss a notification
 */
export async function dismissNotification(
  notificationId: string
): Promise<Notification> {
  const response = await fetch(
    `${API_URL}/notifications/${notificationId}/dismiss`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errorMessage =
      errorData.detail || `Failed to dismiss notification (${response.status})`;
    throw new Error(errorMessage);
  }

  return response.json();
}

/**
 * Delete a notification permanently
 */
export async function deleteNotification(
  notificationId: string
): Promise<void> {
  const response = await fetch(`${API_URL}/notifications/${notificationId}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errorMessage =
      errorData.detail || `Failed to delete notification (${response.status})`;
    throw new Error(errorMessage);
  }
}

/**
 * Mark a notification as unread
 */
export async function markNotificationAsUnread(
  notificationId: string
): Promise<Notification> {
  const response = await fetch(
    `${API_URL}/notifications/${notificationId}/unread`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errorMessage =
      errorData.detail ||
      `Failed to mark notification as unread (${response.status})`;
    throw new Error(errorMessage);
  }

  return response.json();
}

/**
 * Restore a dismissed notification
 */
export async function restoreNotification(
  notificationId: string
): Promise<Notification> {
  const response = await fetch(
    `${API_URL}/notifications/${notificationId}/restore`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errorMessage =
      errorData.detail || `Failed to restore notification (${response.status})`;
    throw new Error(errorMessage);
  }

  return response.json();
}

/**
 * Complete the activity associated with a notification
 */
export async function completeActivityFromNotification(
  notificationId: string
): Promise<{ notification: Notification; activity: Record<string, unknown> }> {
  const response = await fetch(
    `${API_URL}/notifications/${notificationId}/complete-activity`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errorMessage =
      errorData.detail ||
      `Failed to complete activity from notification (${response.status})`;
    throw new Error(errorMessage);
  }

  return response.json();
}
