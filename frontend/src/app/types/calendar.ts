// Tipos para el sistema de calendario

export interface Activity {
  id: string;
  title: string;
  date: string; // formato YYYY-MM-DD
  time: string;
  location?: string;
  type: 'class' | 'exam' | 'assignment' | 'meeting' | 'other';
  color: string;
}

export interface NewActivity {
  title: string;
  date: string;
  time: string;
  location: string;
  type: Activity['type'];
}

export const getColorByType = (type: Activity['type']): string => {
  const colors = {
    class: 'bg-blue-500',
    exam: 'bg-red-500',
    assignment: 'bg-yellow-500',
    meeting: 'bg-green-500',
    other: 'bg-gray-500',
  };
  return colors[type];
};

export const months = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
];

export const weekDays = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
