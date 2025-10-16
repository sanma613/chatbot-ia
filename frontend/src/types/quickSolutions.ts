/**
 * Tipos para el sistema de Soluciones Rápidas (Base de Conocimientos)
 */

export interface SolutionStep {
  step: number;
  description: string;
  tip: string | null;
}

export interface QuickSolution {
  id: string;
  title: string;
  category: string;
  problem_description: string;
  solution_steps: SolutionStep[];
  tags: string[];
  views_count: number;
  helpful_count: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface QuickSolutionCategory {
  id: string;
  name: string;
  count: number;
}

export interface QuickSolutionsListResponse {
  success: boolean;
  data: QuickSolution[];
  count: number;
  pagination: {
    limit: number;
    offset: number;
  };
}

export interface QuickSolutionDetailResponse {
  success: boolean;
  data: QuickSolution;
}

export interface CategoriesResponse {
  success: boolean;
  data: QuickSolutionCategory[];
}

export interface PopularSolutionsResponse {
  success: boolean;
  data: Array<{
    id: string;
    title: string;
    category: string;
    views_count: number;
    helpful_count: number;
  }>;
}
