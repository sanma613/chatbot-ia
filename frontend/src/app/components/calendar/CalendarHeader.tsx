import React from 'react';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { months } from '@/app/types/calendar';

interface CalendarHeaderProps {
    currentDate: Date;
    onNavigateMonth: (direction: 'prev' | 'next') => void;
    onAddActivity: () => void;
}

export default function CalendarHeader({ currentDate, onNavigateMonth, onAddActivity }: CalendarHeaderProps) {
    return (
        <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
                <h1 className="text-2xl font-bold text-dark">
                    {months[currentDate.getMonth()]} {currentDate.getFullYear()}
                </h1>
                <div className="flex gap-2">
                    <button
                        onClick={() => onNavigateMonth('prev')}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <ChevronLeft size={20} />
                    </button>
                    <button
                        onClick={() => onNavigateMonth('next')}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <ChevronRight size={20} />
                    </button>
                </div>
            </div>
            <button
                onClick={onAddActivity}
                className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark transition-colors"
            >
                <Plus size={20} />
                Añadir Actividad
            </button>
        </div>
    );
}