import React from 'react';

interface HistoryStatsProps {
  totalConversations: number;
  filteredCount: number;
  hasSearchTerm: boolean;
}

export default function HistoryStats({
  totalConversations,
  filteredCount,
  hasSearchTerm,
}: HistoryStatsProps) {
  if (totalConversations === 0) return null;

  return (
    <div className="mt-8 p-4 bg-gray-50 rounded-lg">
      <p className="text-sm text-dark text-center">
        Total: {totalConversations} conversación
        {totalConversations !== 1 ? 'es' : ''}
        {hasSearchTerm && filteredCount !== totalConversations && (
          <span>
            {' '}
            · Mostrando {filteredCount} resultado
            {filteredCount !== 1 ? 's' : ''}
          </span>
        )}
      </p>
    </div>
  );
}
