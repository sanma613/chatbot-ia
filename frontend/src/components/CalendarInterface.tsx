'use client';

import React, { useState, useEffect } from 'react';
import { Activity, NewActivity, getColorByType } from '@/app/types/calendar';
import CalendarHeader from './calendar/CalendarHeader';
import CalendarGrid from './calendar/CalendarGrid';
import ActivityPanel from './calendar/ActivityPanel';
import AddActivityModal from './calendar/AddActivityModal';
import { useActivities } from '@/hooks/useActivities';
import { useUser } from '@/hooks/useUser';

export default function CalendarInterface() {
  // ALL HOOKS MUST BE AT THE TOP
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newActivity, setNewActivity] = useState<NewActivity>({
    title: '',
    date: '',
    time: '',
    location: '',
    type: 'other',
  });

  // Check authentication first
  const { user, loading: authLoading } = useUser();

  // Use real data from Supabase (only if authenticated)
  const {
    activities: dbActivities,
    loading: activitiesLoading,
    error,
    createNewActivity,
    // These will be useful for future features:
    // updateExistingActivity,
    // markComplete,
    // removeActivity,
  } = useActivities();

  // Sync dbActivities with local state and add colors
  // Filter out past activities (only show today and future)
  useEffect(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const activitiesWithColors = dbActivities
      .filter((activity) => {
        // Parse activity date (formato YYYY-MM-DD)
        // Usar el constructor con componentes para evitar problemas de zona horaria
        const [year, month, day] = activity.date.split('-').map(Number);
        const activityDate = new Date(year, month - 1, day); // month es 0-indexed

        // Only show activities from today onwards (not past activities)
        return activityDate >= today;
      })
      .map((activity) => ({
        ...activity,
        color: getColorByType(activity.type),
        zIndex: 30,
      }));
    setActivities(activitiesWithColors);
  }, [dbActivities]);

  // Combine loading states
  const loading = authLoading || activitiesLoading;

  // NOW WE CAN DO EARLY RETURNS
  // If still checking authentication, show loading state
  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-500">Verificando autenticación...</div>
      </div>
    );
  }

  // If not authenticated, show message (this shouldn't happen due to ProtectedRoute)
  if (!user) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-500">No autenticado</div>
      </div>
    );
  } // Navegar entre meses
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
  const handleAddActivity = async () => {
    if (!newActivity.title || !newActivity.date || !newActivity.time) {
      return;
    }

    // Validate that date/time is not in the past
    const activityDateTime = new Date(
      `${newActivity.date}T${newActivity.time}`
    );
    const now = new Date();

    if (activityDateTime < now) {
      alert(
        'No se pueden crear actividades para fechas y horas pasadas. Por favor, selecciona una hora futura.'
      );
      return;
    }

    try {
      // Create activity in Supabase (automatically creates a notification)
      await createNewActivity({
        title: newActivity.title,
        date: newActivity.date,
        time: newActivity.time,
        location: newActivity.location || undefined,
        type: newActivity.type,
      });

      // Reset form and close modal
      setNewActivity({
        title: '',
        date: '',
        time: '',
        location: '',
        type: 'other',
      });
      setShowAddModal(false);
    } catch (err) {
      console.error('Error creating activity:', err);
      // Show error message from backend
      if (err instanceof Error) {
        alert(err.message);
      }
    }
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

        {loading && (
          <div className="flex items-center justify-center py-8">
            <div className="text-gray-500">Cargando actividades...</div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            Error al cargar actividades: {error}
          </div>
        )}

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
