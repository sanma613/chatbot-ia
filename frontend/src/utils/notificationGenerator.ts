import { Notification, ActivityStatus } from '@/types/notifications';

// Generar notificaciones basadas en las actividades
export const generateNotifications = (activities: ActivityStatus[]): Notification[] => {
    const notifications: Notification[] = [];
    
    activities.forEach(activity => {
        const activityDate = new Date(`${activity.date}T${activity.time}`);
        
        if (activity.status === 'overdue') {
            notifications.push({
                id: `overdue-${activity.id}`,
                title: 'Actividad Vencida',
                message: `${activity.title} ya ha pasado su fecha límite`,
                type: 'overdue',
                activityId: activity.id,
                activityTitle: activity.title,
                date: activity.date,
                time: activity.time,
                location: activity.location,
                isRead: false,
                createdAt: new Date(activityDate.getTime() + 60000).toISOString(),
                dueDate: activity.date
            });
        } else if (activity.status === 'completed') {
            notifications.push({
                id: `completed-${activity.id}`,
                title: 'Actividad Completada',
                message: `Has completado exitosamente: ${activity.title}`,
                type: 'completed',
                activityId: activity.id,
                activityTitle: activity.title,
                date: activity.date,
                time: activity.time,
                location: activity.location,
                isRead: false,
                createdAt: new Date().toISOString(),
                dueDate: activity.date
            });
        } else if (activity.daysUntilDue <= 2) {
            notifications.push({
                id: `reminder-${activity.id}`,
                title: 'Recordatorio Próximo',
                message: `${activity.title} es en ${activity.daysUntilDue === 0 ? 'hoy' : activity.daysUntilDue === 1 ? 'mañana' : `${activity.daysUntilDue} días`}`,
                type: activity.daysUntilDue === 0 ? 'upcoming' : 'reminder',
                activityId: activity.id,
                activityTitle: activity.title,
                date: activity.date,
                time: activity.time,
                location: activity.location,
                isRead: false,
                createdAt: new Date().toISOString(),
                dueDate: activity.date
            });
        }
    });
    
    return notifications.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
};