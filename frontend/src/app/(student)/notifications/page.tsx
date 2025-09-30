'use client';

import React, { useState, useEffect } from 'react';
import { Notification, ActivityStatus, NotificationFilter } from '@/types/notifications';
import NotificationFilters from '@/components/notifications/NotificationFilters';
import NotificationCard from '@/components/notifications/NotificationCard';
import NotificationStats from '@/components/notifications/NotificationStats';
import EmptyNotifications from '@/components/notifications/EmptyNotifications';
import { generateNotifications } from '@/utils/notificationGenerator';

// Mock data basado en las actividades del calendario
const mockActivities: ActivityStatus[] = [
    {
        id: '1',
        title: 'Examen de Matemáticas',
        date: '2025-09-28',
        time: '09:00',
        location: 'Aula 101',
        type: 'exam',
        status: 'overdue', // Ya pasó la fecha
        daysUntilDue: -1
    },
    {
        id: '2',
        title: 'Clase de Historia',
        date: '2025-09-28',
        time: '14:00',
        location: 'Aula 205',
        type: 'class',
        status: 'completed',
        daysUntilDue: -1
    },
    {
        id: '3',
        title: 'Entrega de Proyecto',
        date: '2025-09-30',
        time: '23:59',
        type: 'assignment',
        status: 'pending',
        daysUntilDue: 1
    },
    {
        id: '4',
        title: 'Reunión con Tutor',
        date: '2025-10-02',
        time: '10:30',
        location: 'Oficina 302',
        type: 'meeting',
        status: 'pending',
        daysUntilDue: 3
    }
];

export default function NotificationsPage() {
    const [activities] = useState<ActivityStatus[]>(mockActivities);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [filter, setFilter] = useState<NotificationFilter>('all');

    useEffect(() => {
        const generatedNotifications = generateNotifications(activities);
        setNotifications(generatedNotifications);
    }, [activities]);

    // Filtrar notificaciones
    const filteredNotifications = notifications.filter(notification => {
        if (filter === 'all') return true;
        if (filter === 'unread') return !notification.isRead;
        if (filter === 'overdue') return notification.type === 'overdue';
        if (filter === 'upcoming') return notification.type === 'upcoming' || notification.type === 'reminder';
        return true;
    });

    // Marcar notificación como leída
    const markAsRead = (id: string) => {
        setNotifications(prev =>
            prev.map(notification =>
                notification.id === id
                    ? { ...notification, isRead: true }
                    : notification
            )
        );
    };

    // Descartar notificación
    const dismissNotification = (id: string) => {
        console.log("Enviar notificación"); // Como solicitaste
        setNotifications(prev => prev.filter(notification => notification.id !== id));
    };

    // Marcar actividad como completada
    const markActivityAsCompleted = (activityId: string) => {
        console.log("Enviar notificación"); // Como solicitaste
        // Aquí actualizarías el estado de la actividad en el calendario
        // Por ahora solo simulamos la acción
        console.log(`Actividad ${activityId} marcada como completada`);
    };



    return (
        <div className="h-full overflow-hidden">
            <div className="h-full overflow-y-auto">
                <div className="max-w-4xl mx-auto p-4 space-y-6">
                    {/* Header */}
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-dark mb-2">
                            Notificaciones
                        </h1>
                        <p className="text-dark">
                            Mantente al día con tus actividades académicas
                        </p>
                    </div>

                    {/* Filtros */}
                    <NotificationFilters
                        filter={filter}
                        setFilter={setFilter}
                        notifications={notifications}
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
                                    onDismiss={dismissNotification}
                                    onMarkCompleted={markActivityAsCompleted}
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
                </div>
            </div>
        </div>
    );
}