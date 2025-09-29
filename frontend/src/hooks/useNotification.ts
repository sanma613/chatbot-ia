'use client';

import { useState, useCallback } from 'react';
import { Notification, NotificationType } from '@/app/types/notification';

interface UseNotificationReturn {
  notification: Notification | null;
  showSuccess: (title: string, message: string) => void;
  showError: (title: string, message: string) => void;
  showWarning: (title: string, message: string) => void;
  showInfo: (title: string, message: string) => void;
  hideNotification: () => void;
}

export function useNotification(): UseNotificationReturn {
  const [notification, setNotification] = useState<Notification | null>(null);

  const showNotification = useCallback((
    type: NotificationType,
    title: string,
    message: string
  ) => {
    setNotification({
      type,
      title,
      message,
      isOpen: true,
    });
  }, []);

  const hideNotification = useCallback(() => {
    setNotification(null);
  }, []);

  const showSuccess = useCallback((title: string, message: string) => {
    showNotification('success', title, message);
  }, [showNotification]);

  const showError = useCallback((title: string, message: string) => {
    showNotification('error', title, message);
  }, [showNotification]);

  const showWarning = useCallback((title: string, message: string) => {
    showNotification('warning', title, message);
  }, [showNotification]);

  const showInfo = useCallback((title: string, message: string) => {
    showNotification('info', title, message);
  }, [showNotification]);

  return {
    notification,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    hideNotification,
  };
}