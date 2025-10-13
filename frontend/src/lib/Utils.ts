import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Convierte un timestamp UTC de Supabase a hora local del navegador
 * @param utcString - String en formato ISO 8601 (ej: "2025-10-13T12:27:20.321993+00:00")
 * @returns Date object en hora local del navegador
 */
export function utcToLocal(utcString: string): Date {
  return new Date(utcString); // JavaScript convierte automáticamente a hora local
}

/**
 * Formatea una fecha UTC a string legible en hora local
 * @param utcString - String en formato ISO 8601
 * @param options - Opciones de formato
 * @returns String formateado (ej: "13/10/2025, 10:27:20")
 */
export function formatLocalDateTime(
  utcString: string,
  options?: Intl.DateTimeFormatOptions
): string {
  const date = new Date(utcString);
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  };
  return date.toLocaleString('es-ES', options || defaultOptions);
}

/**
 * Obtiene la diferencia en minutos entre una fecha UTC y ahora
 * @param utcString - String en formato ISO 8601
 * @returns Diferencia en minutos
 */
export function getMinutesSince(utcString: string): number {
  const date = new Date(utcString);
  const now = new Date();
  return Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
}
