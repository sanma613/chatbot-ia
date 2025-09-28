import React from 'react';
import { Activity } from '@/app/types/calendar';
import ActivityCard from './ActivityCard';

interface ActivityPanelProps {
  selectedDate: string | null;
  activities: Activity[];
}

export default function ActivityPanel({
  selectedDate,
  activities,
}: ActivityPanelProps) {
  return (
    <div className="w-80 bg-gray-50 border-l border-gray-200 p-6">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-dark">
          {selectedDate ? `Actividades - ${selectedDate}` : 'Selecciona un día'}
        </h2>
      </div>

      {selectedDate ? (
        <div className="space-y-3">
          {activities.length > 0 ? (
            activities.map((activity) => (
              <ActivityCard key={activity.id} activity={activity} />
            ))
          ) : (
            <p className="text-dark text-center py-8">
              No hay actividades para este día
            </p>
          )}
        </div>
      ) : (
        <p className="text-dark text-center py-8">
          Haz clic en un día del calendario para ver las actividades
        </p>
      )}
    </div>
  );
}
