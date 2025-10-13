import clsx from 'clsx';
import { Notification, NotificationFilter } from '@/types/notifications';

interface NotificationFiltersProps {
  filter: NotificationFilter;
  setFilter: (filter: NotificationFilter) => void;
  notifications: Notification[];
  dismissedCount: number;
}

export default function NotificationFilters({
  filter,
  setFilter,
  notifications,
  dismissedCount,
}: NotificationFiltersProps) {
  const filterCounts = {
    all: notifications.length,
    unread: notifications.filter((n) => !n.isRead).length,
    read: notifications.filter((n) => n.isRead).length,
    overdue: notifications.filter((n) => n.type === 'overdue').length,
    upcoming: notifications.filter(
      (n) => n.type === 'upcoming' || n.type === 'reminder'
    ).length,
    completed: notifications.filter((n) => n.type === 'completed').length,
    dismissed: dismissedCount,
  };

  // Filtro principal
  const mainFilter = {
    key: 'all' as const,
    label: 'Todas',
    count: filterCounts.all,
  };

  // Filtros por estado de actividad
  const activityFilters = [
    {
      key: 'completed' as const,
      label: 'Completadas',
      count: filterCounts.completed,
    },
    {
      key: 'upcoming' as const,
      label: 'Próximas',
      count: filterCounts.upcoming,
    },
    {
      key: 'overdue' as const,
      label: 'Vencidas',
      count: filterCounts.overdue,
    },
  ];

  // Filtros por estado de lectura
  const readStatusFilters = [
    {
      key: 'unread' as const,
      label: 'No leídas',
      count: filterCounts.unread,
    },
    {
      key: 'read' as const,
      label: 'Leídas',
      count: filterCounts.read,
    },
    {
      key: 'dismissed' as const,
      label: 'Descartadas',
      count: filterCounts.dismissed,
    },
  ];

  const renderFilterButton = (filterItem: {
    key: NotificationFilter;
    label: string;
    count: number;
    icon?: string;
  }) => (
    <button
      key={filterItem.key}
      onClick={() => setFilter(filterItem.key)}
      className={clsx(
        'px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200',
        'inline-flex items-center gap-2',
        {
          'bg-blue-600 text-white': filter === filterItem.key,
          'text-slate-300 hover:bg-slate-50': filter !== filterItem.key,
          'border border-slate-300': filter !== filterItem.key,
        }
      )}
    >
      {filterItem.icon && <span className="text-xs">{filterItem.icon}</span>}
      <span>{filterItem.label}</span>
      <span
        className={clsx(
          'ml-1 px-2 py-0.5 rounded-full text-xs font-semibold border',
          filter === filterItem.key
            ? 'bg-blue-500 text-white border-blue-500'
            : 'bg-gray-200 text-slate-300 border-slate-300'
        )}
      >
        {filterItem.count}
      </span>
    </button>
  );

  return (
    <div className="bg-white rounded-lg shadow-sm border mb-6">
      {/* Filtro principal */}
      <div className="p-4 border-b border-gray-200">
        {renderFilterButton(mainFilter)}
      </div>

      {/* Estados de actividad */}
      <div className="px-4 pt-4 pb-2">
        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
          Por estado
        </h3>
        <div className="flex flex-wrap gap-2">
          {activityFilters.map((f) => renderFilterButton(f))}
        </div>
      </div>

      {/* Estados de lectura */}
      <div className="px-4 pt-2 pb-4">
        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
          Por lectura
        </h3>
        <div className="flex flex-wrap gap-2">
          {readStatusFilters.map((f) => renderFilterButton(f))}
        </div>
      </div>
    </div>
  );
}
