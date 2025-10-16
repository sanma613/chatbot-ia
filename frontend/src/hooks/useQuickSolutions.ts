/**
 * Hook para gestionar soluciones rápidas
 */

import { useState, useEffect } from 'react';
import {
  listQuickSolutions,
  getQuickSolutionById,
  getCategories,
  incrementSolutionViews,
  markSolutionHelpful,
} from '@/lib/quickSolutionsApi';
import { QuickSolution, QuickSolutionCategory } from '@/types/quickSolutions';

export function useQuickSolutions() {
  const [solutions, setSolutions] = useState<QuickSolution[]>([]);
  const [categories, setCategories] = useState<QuickSolutionCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);

  // Filtros
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  /**
   * Cargar soluciones con filtros
   */
  const loadSolutions = async (params?: {
    category?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }) => {
    setLoading(true);
    setError(null);

    try {
      const response = await listQuickSolutions({
        category: params?.category || selectedCategory || undefined,
        search: params?.search || searchTerm || undefined,
        limit: params?.limit || 50,
        offset: params?.offset || 0,
      });

      setSolutions(response.data);
      setTotalCount(response.count);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Error al cargar soluciones'
      );
      console.error('Error loading solutions:', err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Cargar categorías disponibles
   */
  const loadCategories = async () => {
    try {
      const response = await getCategories();
      setCategories(response.data);
    } catch (err) {
      console.error('Error loading categories:', err);
    }
  };

  /**
   * Obtener detalles de una solución
   */
  const getSolutionDetails = async (
    id: string
  ): Promise<QuickSolution | null> => {
    try {
      const response = await getQuickSolutionById(id);
      return response.data;
    } catch (err) {
      console.error('Error getting solution details:', err);
      return null;
    }
  };

  /**
   * Registrar vista de una solución
   */
  const registerView = async (id: string) => {
    try {
      await incrementSolutionViews(id);
    } catch (err) {
      console.error('Error registering view:', err);
    }
  };

  /**
   * Marcar solución como útil
   */
  const markAsHelpful = async (id: string) => {
    try {
      await markSolutionHelpful(id);

      // Actualizar localmente el contador
      setSolutions((prev) =>
        prev.map((sol) =>
          sol.id === id ? { ...sol, helpful_count: sol.helpful_count + 1 } : sol
        )
      );
    } catch (err) {
      console.error('Error marking as helpful:', err);
      throw err;
    }
  };

  /**
   * Filtrar por categoría
   */
  const filterByCategory = (category: string | null) => {
    setSelectedCategory(category);
  };

  /**
   * Buscar por término
   */
  const search = (term: string) => {
    setSearchTerm(term);
  };

  /**
   * Limpiar filtros
   */
  const clearFilters = () => {
    setSelectedCategory(null);
    setSearchTerm('');
  };

  // Cargar categorías al montar
  useEffect(() => {
    loadCategories();
  }, []);

  // Recargar soluciones cuando cambian los filtros
  useEffect(() => {
    loadSolutions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategory, searchTerm]);

  return {
    solutions,
    categories,
    loading,
    error,
    totalCount,
    selectedCategory,
    searchTerm,
    loadSolutions,
    getSolutionDetails,
    registerView,
    markAsHelpful,
    filterByCategory,
    search,
    clearFilters,
  };
}
