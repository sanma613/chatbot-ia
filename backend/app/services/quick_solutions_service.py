"""
Servicio para gestionar soluciones rápidas a problemas comunes.
"""

from typing import List, Optional, Dict, Any
from supabase import Client
import logging

logger = logging.getLogger(__name__)


class QuickSolutionsService:
    """Servicio para gestionar la base de conocimientos de soluciones."""

    def __init__(self, supabase: Client):
        self.supabase = supabase

    def list_solutions(
        self,
        category: Optional[str] = None,
        search: Optional[str] = None,
        limit: int = 50,
        offset: int = 0,
    ) -> Dict[str, Any]:
        """
        Lista todas las soluciones activas con filtros opcionales.

        Args:
            category: Filtrar por categoría específica
            search: Buscar en título, descripción o tags
            limit: Número máximo de resultados
            offset: Desplazamiento para paginación

        Returns:
            Dict con 'data' (lista de soluciones) y 'count' (total)
        """
        try:
            query = (
                self.supabase.table("quick_solutions")
                .select("*", count="exact")
                .eq("is_active", True)
            )

            # Filtrar por categoría si se proporciona
            if category:
                query = query.eq("category", category)

            # Buscar en múltiples campos si se proporciona término
            if search and search.strip():
                # Buscar en título y descripción (case-insensitive)
                search_term = f"%{search.lower()}%"
                query = query.or_(
                    f"title.ilike.{search_term},"
                    f"problem_description.ilike.{search_term},"
                    f"tags.cs.{{{search}}}"  # Contains search term in tags array
                )

            # Ordenar por más útiles primero
            query = query.order("helpful_count", desc=True)

            # Aplicar paginación
            query = query.range(offset, offset + limit - 1)

            response = query.execute()

            return {
                "data": response.data if response.data else [],
                "count": response.count if response.count else 0,
            }

        except Exception as e:
            logger.error(f"Error listando soluciones: {e}")
            raise

    def get_solution_by_id(self, solution_id: str) -> Optional[Dict[str, Any]]:
        """
        Obtiene una solución específica por su ID.

        Args:
            solution_id: UUID de la solución

        Returns:
            Dict con los datos de la solución o None si no existe
        """
        try:
            response = (
                self.supabase.table("quick_solutions")
                .select("*")
                .eq("id", solution_id)
                .eq("is_active", True)
                .single()
                .execute()
            )

            return response.data if response.data else None

        except Exception as e:
            logger.error(f"Error obteniendo solución {solution_id}: {e}")
            return None

    def increment_view_count(self, solution_id: str) -> bool:
        """
        Incrementa el contador de vistas de una solución.

        Args:
            solution_id: UUID de la solución

        Returns:
            True si se incrementó exitosamente, False en caso contrario
        """
        try:
            # Usar función RPC para incrementar atómicamente
            response = self.supabase.rpc(
                "increment_solution_views", {"solution_id": solution_id}
            ).execute()

            # Si no existe la función RPC, usar update directo
            if not response.data:
                current = self.get_solution_by_id(solution_id)
                if current:
                    new_count = current.get("views_count", 0) + 1
                    self.supabase.table("quick_solutions").update(
                        {"views_count": new_count}
                    ).eq("id", solution_id).execute()

            return True

        except Exception as e:
            logger.error(f"Error incrementando vistas de solución {solution_id}: {e}")
            return False

    def increment_helpful_count(self, solution_id: str) -> bool:
        """
        Incrementa el contador de "útil" de una solución.

        Args:
            solution_id: UUID de la solución

        Returns:
            True si se incrementó exitosamente, False en caso contrario
        """
        try:
            # Usar función RPC para incrementar atómicamente
            response = self.supabase.rpc(
                "increment_solution_helpful", {"solution_id": solution_id}
            ).execute()

            # Si no existe la función RPC, usar update directo
            if not response.data:
                current = self.get_solution_by_id(solution_id)
                if current:
                    new_count = current.get("helpful_count", 0) + 1
                    self.supabase.table("quick_solutions").update(
                        {"helpful_count": new_count}
                    ).eq("id", solution_id).execute()

            return True

        except Exception as e:
            logger.error(
                f"Error incrementando contador útil de solución {solution_id}: {e}"
            )
            return False

    def get_categories(self) -> List[Dict[str, Any]]:
        """
        Obtiene la lista de categorías con conteo de soluciones.

        Returns:
            Lista de categorías con su conteo
        """
        try:
            response = (
                self.supabase.table("quick_solutions")
                .select("category")
                .eq("is_active", True)
                .execute()
            )

            # Contar soluciones por categoría
            categories: Dict[str, int] = {}
            if response.data:
                for item in response.data:
                    cat = item.get("category", "otros")
                    categories[cat] = categories.get(cat, 0) + 1

            # Mapeo de nombres amigables
            category_names = {
                "matricula": "Matrícula",
                "horarios": "Horarios",
                "examenes": "Exámenes",
                "pagos": "Pagos",
                "certificados": "Certificados",
                "tramites": "Trámites",
                "biblioteca": "Biblioteca",
                "plataforma": "Plataforma",
            }

            result = []
            for cat, count in categories.items():
                result.append(
                    {
                        "id": cat,
                        "name": category_names.get(cat, cat.capitalize()),
                        "count": count,
                    }
                )

            return sorted(result, key=lambda x: x["count"], reverse=True)

        except Exception as e:
            logger.error(f"Error obteniendo categorías: {e}")
            return []

    def get_popular_solutions(self, limit: int = 5) -> List[Dict[str, Any]]:
        """
        Obtiene las soluciones más populares (más vistas y útiles).

        Args:
            limit: Número máximo de resultados

        Returns:
            Lista de soluciones populares
        """
        try:
            response = (
                self.supabase.table("quick_solutions")
                .select("id, title, category, views_count, helpful_count")
                .eq("is_active", True)
                .order("helpful_count", desc=True)
                .order("views_count", desc=True)
                .limit(limit)
                .execute()
            )

            return response.data if response.data else []

        except Exception as e:
            logger.error(f"Error obteniendo soluciones populares: {e}")
            return []
