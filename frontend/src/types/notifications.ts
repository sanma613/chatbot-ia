// Tipos para las notificaciones
export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'reminder' | 'overdue' | 'completed' | 'upcoming';
  activityId: string;
  activityTitle: string;
  date: string;
  time: string;
  location?: string;
  isRead: boolean;
  createdAt: string;
  dueDate: string;
}

// Estados de las actividades del calendario
export interface ActivityStatus {
  id: string;
  title: string;
  date: string;
  time: string;
  location?: string;
  type: 'exam' | 'class' | 'assignment' | 'meeting' | 'other';
  status: 'completed' | 'pending' | 'overdue';
  daysUntilDue: number;
}

export type NotificationFilter =
  | 'all'
  | 'unread'
  | 'overdue'
  | 'upcoming'
  | 'completed'
  | 'dismissed';
