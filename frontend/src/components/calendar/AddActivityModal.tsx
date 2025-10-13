import React from 'react';
import { X } from 'lucide-react';
import { NewActivity } from '../../app/types/calendar';

interface AddActivityModalProps {
  isOpen: boolean;
  newActivity: NewActivity;
  onClose: () => void;
  onSave: () => void;
  onChange: (field: keyof NewActivity, value: string) => void;
}

export default function AddActivityModal({
  isOpen,
  newActivity,
  onClose,
  onSave,
  onChange,
}: AddActivityModalProps) {
  if (!isOpen) return null;

  // Get today's date in YYYY-MM-DD format for min date validation
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg w-96 max-w-[90vw]">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-dark">Nueva Actividad</h3>
          <button onClick={onClose} className="text-dark hover:text-red-500">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-dark mb-1">
              Título *
            </label>
            <input
              type="text"
              value={newActivity.title}
              onChange={(e) => onChange('title', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary text-dark"
              placeholder="Ej: Examen de Matemáticas"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-dark mb-1">
                Fecha *
              </label>
              <input
                type="date"
                value={newActivity.date}
                onChange={(e) => onChange('date', e.target.value)}
                min={today}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary text-dark"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-dark mb-1">
                Hora *
              </label>
              <input
                type="time"
                value={newActivity.time}
                onChange={(e) => onChange('time', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary text-dark"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-dark mb-1">
              Ubicación
            </label>
            <input
              type="text"
              value={newActivity.location}
              onChange={(e) => onChange('location', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary text-dark"
              placeholder="Ej: Aula 101"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-dark mb-1">
              Tipo
            </label>
            <select
              value={newActivity.type}
              onChange={(e) => onChange('type', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary text-dark"
            >
              <option value="class">Clase</option>
              <option value="exam">Examen</option>
              <option value="assignment">Tarea</option>
              <option value="meeting">Reunión</option>
              <option value="other">Otro</option>
            </select>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 text-dark rounded-lg hover:bg-red-500 hover:text-white transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={onSave}
            className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
          >
            Añadir
          </button>
        </div>
      </div>
    </div>
  );
}
