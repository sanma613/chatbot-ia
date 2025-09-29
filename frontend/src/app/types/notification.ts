// Tipos para el sistema de notificaciones

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface Notification {
    type: NotificationType;
    title: string;
    message: string;
    isOpen: boolean;
    duration?: number; // en milisegundos
}

export interface NotificationConfig {
    type: NotificationType;
    title: string;
    message: string;
    duration?: number;
}