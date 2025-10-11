import React from 'react';
import { Search } from 'lucide-react';
import { cn } from '@/lib/Utils';

interface ChatSearchBarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  placeholder?: string;
}

export default function ChatSearchBar({
  searchTerm,
  onSearchChange,
  placeholder = 'Buscar conversaciones...',
}: ChatSearchBarProps) {
  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-dark w-5 h-5" />
      <input
        type="text"
        placeholder={placeholder}
        value={searchTerm}
        onChange={(e) => onSearchChange(e.target.value)}
        className={cn(
          'w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg',
          'focus:ring-2 focus:ring-primary focus:border-transparent',
          'bg-white shadow-sm text-dark'
        )}
      />
    </div>
  );
}
