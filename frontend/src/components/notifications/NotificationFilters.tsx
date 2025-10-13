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
    overdue: notifications.filter((n) => n.type === 'overdue').length,
    upcoming: notifications.filter(
      (n) => n.type === 'upcoming' || n.type === 'reminder'
    ).length,
    completed: notifications.filter((n) => n.type === 'completed').length,
    dismissed: dismissedCount,
  };

  const filterButtons = [
    { key: 'all' as const, label: 'Todas', count: filterCounts.all },
    { key: 'unread' as const, label: 'No leídas', count: filterCounts.unread },
    {
      key: 'overdue' as const,
      label: 'Vencidas',
      count: filterCounts.overdue,
      color: 'red',
    },
    {
      key: 'upcoming' as const,
      label: 'Próximas',
      count: filterCounts.upcoming,
      color: 'orange',
    },
    {
      key: 'completed' as const,
      label: 'Completadas',
      count: filterCounts.completed,
      color: 'green',
    },
    {
      key: 'dismissed' as const,
      label: 'Descartadas',
      count: filterCounts.dismissed,
      color: 'slate',
    },
  ];

  return (
    <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
      <div className="flex flex-wrap gap-2">
        {filterButtons.map((button) => (
          <button
            key={button.key}
            onClick={() => setFilter(button.key)}
            className={clsx(
              'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
              {
                'bg-blue-600 text-white':
                  filter === button.key && !button.color,
                'bg-red-600 text-white':
                  filter === button.key && button.color === 'red',
                'bg-orange-600 text-white':
                  filter === button.key && button.color === 'orange',
                'bg-green-600 text-white':
                  filter === button.key && button.color === 'green',
                'bg-slate-700 text-white':
                  filter === button.key && button.color === 'slate',
                'bg-gray-100 text-dark hover:bg-gray-200':
                  filter !== button.key,
              }
            )}
          >
            {button.label} ({button.count})
          </button>
        ))}
      </div>
    </div>
  );
}
