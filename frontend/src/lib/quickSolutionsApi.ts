/**
 * API client para el sistema de Soluciones Rápidas
 */

import {
  QuickSolutionsListResponse,
  QuickSolutionDetailResponse,
  CategoriesResponse,
  PopularSolutionsResponse,
} from '@/types/quickSolutions';

const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

/**
 * Lista soluciones con filtros opcionales
 */
export async function listQuickSolutions(params: {
  category?: string;
  search?: string;
  limit?: number;
  offset?: number;
}): Promise<QuickSolutionsListResponse> {
  const queryParams = new URLSearchParams();

  if (params.category) queryParams.append('category', params.category);
  if (params.search) queryParams.append('search', params.search);
  if (params.limit) queryParams.append('limit', params.limit.toString());
  if (params.offset) queryParams.append('offset', params.offset.toString());

  const response = await fetch(
    `${API_URL}/quick-solutions?${queryParams.toString()}`,
    {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );

  if (!response.ok) {
    throw new Error('Error al obtener soluciones');
  }

  return response.json();
}

/**
 * Obtiene detalles de una solución específica
 */
export async function getQuickSolutionById(
  id: string
): Promise<QuickSolutionDetailResponse> {
  const response = await fetch(`${API_URL}/quick-solutions/${id}`, {
    method: 'GET',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Error al obtener detalles de la solución');
  }

  return response.json();
}

/**
 * Obtiene la lista de categorías disponibles
 */
export async function getCategories(): Promise<CategoriesResponse> {
  const response = await fetch(`${API_URL}/quick-solutions/categories`, {
    method: 'GET',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Error al obtener categorías');
  }

  return response.json();
}

/**
 * Obtiene las soluciones más populares
 */
export async function getPopularSolutions(
  limit: number = 5
): Promise<PopularSolutionsResponse> {
  const response = await fetch(
    `${API_URL}/quick-solutions/popular?limit=${limit}`,
    {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );

  if (!response.ok) {
    throw new Error('Error al obtener soluciones populares');
  }

  return response.json();
}

/**
 * Registra una visualización de una solución
 */
export async function incrementSolutionViews(id: string): Promise<void> {
  const response = await fetch(`${API_URL}/quick-solutions/${id}/view`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Error al registrar visualización');
  }
}

/**
 * Marca una solución como útil
 */
export async function markSolutionHelpful(id: string): Promise<void> {
  const response = await fetch(`${API_URL}/quick-solutions/${id}/helpful`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Error al marcar como útil');
  }
}
