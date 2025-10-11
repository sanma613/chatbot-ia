import React from 'react';
import { Activity, weekDays } from '@/app/types/calendar';
import { cn } from '@/lib/Utils';

interface CalendarGridProps {
  currentDate: Date;
  activities: Activity[];
  selectedDate: string | null;
  onDayClick: (day: number) => void;
}

export default function CalendarGrid({
  currentDate,
  activities,
  selectedDate,
  onDayClick,
}: CalendarGridProps) {
  // Obtener días del mes
  const getDaysInMonth = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];

    // Días vacíos del mes anterior
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    // Días del mes actual
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }

    return days;
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

  const days = getDaysInMonth();
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="grid grid-cols-7 gap-1">
      {/* Días de la semana */}
      {weekDays.map((day, index) => (
        <div
          key={index}
          className="p-4 text-center font-semibold text-dark bg-gray-50"
        >
          {day}
        </div>
      ))}

      {/* Días del mes */}
      {days.map((day, index) => {
        if (!day) {
          return <div key={index} className="p-4 h-24"></div>;
        }

        const dateStr = formatDate(day);
        const dayActivities = getActivitiesForDate(dateStr);
        const isToday = dateStr === today;
        const isSelected = dateStr === selectedDate;

        return (
          <div
            key={day}
            onClick={() => onDayClick(day)}
            className={cn(
              'p-2 h-24 border border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors',
              isToday && 'bg-primary/10 border-primary',
              isSelected && 'bg-primary/20'
            )}
          >
            <div className="flex flex-col h-full">
              <span
                className={cn(
                  'text-sm font-medium',
                  isToday ? 'text-primary font-bold' : 'text-dark'
                )}
              >
                {day}
              </span>
              <div className="flex-1 mt-1">
                <div className="flex flex-wrap gap-1">
                  {dayActivities.slice(0, 3).map((activity) => (
                    <div
                      key={activity.id}
                      className={cn('w-2 h-2 rounded-full', activity.color)}
                      title={activity.title}
                    ></div>
                  ))}
                  {dayActivities.length > 3 && (
                    <span className="text-xs text-gray-500">
                      +{dayActivities.length - 3}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
