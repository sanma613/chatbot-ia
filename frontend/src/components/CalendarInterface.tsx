'use client';

import React, { useState } from 'react';
import { Activity, NewActivity, getColorByType } from '@/app/types/calendar';
import CalendarHeader from './calendar/CalendarHeader';
import CalendarGrid from './calendar/CalendarGrid';
import ActivityPanel from './calendar/ActivityPanel';
import AddActivityModal from './calendar/AddActivityModal';

// Datos de ejemplo
const mockActivities: Activity[] = [
  {
    id: '1',
    title: 'Examen de Matemáticas',
    date: '2025-09-28',
    time: '09:00',
    location: 'Aula 101',
    type: 'exam',
    color: 'bg-red-500',
  },
  {
    id: '2',
    title: 'Clase de Historia',
    date: '2025-09-28',
    time: '14:00',
    location: 'Aula 205',
    type: 'class',
    color: 'bg-blue-500',
  },
  {
    id: '3',
    title: 'Entrega de Proyecto',
    date: '2025-09-30',
    time: '23:59',
    type: 'assignment',
    color: 'bg-yellow-500',
  },
  {
    id: '4',
    title: 'Reunión con Tutor',
    date: '2025-10-02',
    time: '10:30',
    location: 'Oficina 302',
    type: 'meeting',
    color: 'bg-green-500',
  },
];

export default function CalendarInterface() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [activities, setActivities] = useState<Activity[]>(mockActivities);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newActivity, setNewActivity] = useState<NewActivity>({
    title: '',
    date: '',
    time: '',
    location: '',
    type: 'other',
  });

  // Navegar entre meses
  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate((prev) => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  // Obtener actividades por fecha
  const getActivitiesForDate = (date: string) => {
    return activities.filter((activity) => activity.date === date);
  };

  // Formatear fecha
  const formatDate = (day: number) => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth() + 1;
    return `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
  };

  // Manejar clic en día
  const handleDayClick = (day: number) => {
    const dateStr = formatDate(day);
    setSelectedDate(dateStr);
  };

  // Manejar cambios en el modal
  const handleModalChange = (field: keyof NewActivity, value: string) => {
    setNewActivity((prev) => ({ ...prev, [field]: value }));
  };

  // Añadir nueva actividad
  const handleAddActivity = () => {
    if (!newActivity.title || !newActivity.date || !newActivity.time) {
      return;
    }

    const activity: Activity = {
      id: Date.now().toString(),
      title: newActivity.title,
      date: newActivity.date,
      time: newActivity.time,
      location: newActivity.location,
      type: newActivity.type,
      color: getColorByType(newActivity.type),
    };

    setActivities((prev) => [...prev, activity]);
    setNewActivity({
      title: '',
      date: '',
      time: '',
      location: '',
      type: 'other',
    });
    setShowAddModal(false);
  };

  const selectedActivities = selectedDate
    ? getActivitiesForDate(selectedDate)
    : [];

  return (
    <div className="flex h-full bg-white">
      {/* Calendario Principal */}
      <div className="flex-1 p-6">
        <CalendarHeader
          currentDate={currentDate}
          onNavigateMonth={navigateMonth}
          onAddActivity={() => setShowAddModal(true)}
        />

        <CalendarGrid
          currentDate={currentDate}
          activities={activities}
          selectedDate={selectedDate}
          onDayClick={handleDayClick}
        />
      </div>

      {/* Panel Lateral */}
      <ActivityPanel
        selectedDate={selectedDate}
        activities={selectedActivities}
      />

      {/* Modal para añadir actividad */}
      <AddActivityModal
        isOpen={showAddModal}
        newActivity={newActivity}
        onClose={() => setShowAddModal(false)}
        onSave={handleAddActivity}
        onChange={handleModalChange}
      />
    </div>
  );
}
