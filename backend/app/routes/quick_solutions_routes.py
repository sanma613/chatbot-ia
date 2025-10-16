"""
Rutas para la gestión de soluciones rápidas (base de conocimientos).
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from typing import Optional
from supabase import Client
import logging

from app.core.config import get_supabase
from app.services.quick_solutions_service import QuickSolutionsService
from app.routes.auth import get_current_user

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/quick-solutions", tags=["Quick Solutions"])


def get_quick_solutions_service(
    supabase: Client = Depends(get_supabase),
) -> QuickSolutionsService:
    """Dependency para obtener el servicio de soluciones rápidas."""
    return QuickSolutionsService(supabase)


@router.get("")
async def list_quick_solutions(
    category: Optional[str] = Query(
        None, description="Filtrar por categoría específica"
    ),
    search: Optional[str] = Query(
        None, description="Buscar en título, descripción o tags"
    ),
    limit: int = Query(50, ge=1, le=100, description="Número máximo de resultados"),
    offset: int = Query(0, ge=0, description="Desplazamiento para paginación"),
    service: QuickSolutionsService = Depends(get_quick_solutions_service),
    current_user: dict = Depends(get_current_user),
):
    """
    Lista todas las soluciones rápidas con filtros opcionales.

    - **category**: Filtrar por categoría (matricula, horarios, examenes, etc.)
    - **search**: Término de búsqueda en título, descripción y tags
    - **limit**: Número máximo de resultados (default: 50)
    - **offset**: Desplazamiento para paginación (default: 0)
    """
    try:
        result = service.list_solutions(
            category=category, search=search, limit=limit, offset=offset
        )

        return {
            "success": True,
            "data": result["data"],
            "count": result["count"],
            "pagination": {"limit": limit, "offset": offset},
        }

    except Exception as e:
        logger.error(f"Error en list_quick_solutions: {e}")
        raise HTTPException(status_code=500, detail="Error al obtener soluciones")


@router.get("/categories")
async def get_categories(
    service: QuickSolutionsService = Depends(get_quick_solutions_service),
    current_user: dict = Depends(get_current_user),
):
    """
    Obtiene la lista de categorías disponibles con conteo de soluciones.
    """
    try:
        categories = service.get_categories()

        return {"success": True, "data": categories}

    except Exception as e:
        logger.error(f"Error en get_categories: {e}")
        raise HTTPException(status_code=500, detail="Error al obtener categorías")


@router.get("/popular")
async def get_popular_solutions(
    limit: int = Query(5, ge=1, le=20, description="Número de soluciones populares"),
    service: QuickSolutionsService = Depends(get_quick_solutions_service),
    current_user: dict = Depends(get_current_user),
):
    """
    Obtiene las soluciones más populares (más vistas y útiles).
    """
    try:
        popular = service.get_popular_solutions(limit=limit)

        return {"success": True, "data": popular}

    except Exception as e:
        logger.error(f"Error en get_popular_solutions: {e}")
        raise HTTPException(
            status_code=500, detail="Error al obtener soluciones populares"
        )


@router.get("/{solution_id}")
async def get_solution_detail(
    solution_id: str,
    service: QuickSolutionsService = Depends(get_quick_solutions_service),
    current_user: dict = Depends(get_current_user),
):
    """
    Obtiene los detalles completos de una solución específica.

    - **solution_id**: UUID de la solución
    """
    try:
        solution = service.get_solution_by_id(solution_id)

        if not solution:
            raise HTTPException(status_code=404, detail="Solución no encontrada")

        return {"success": True, "data": solution}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error en get_solution_detail: {e}")
        raise HTTPException(status_code=500, detail="Error al obtener solución")


@router.post("/{solution_id}/view")
async def increment_solution_views(
    solution_id: str,
    service: QuickSolutionsService = Depends(get_quick_solutions_service),
    current_user: dict = Depends(get_current_user),
):
    """
    Incrementa el contador de vistas de una solución.

    Se llama automáticamente cuando un usuario abre el detalle de una solución.

    - **solution_id**: UUID de la solución
    """
    try:
        success = service.increment_view_count(solution_id)

        if not success:
            raise HTTPException(
                status_code=500, detail="Error al incrementar contador de vistas"
            )

        return {"success": True, "message": "Vista registrada"}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error en increment_solution_views: {e}")
        raise HTTPException(status_code=500, detail="Error al registrar visualización")


@router.post("/{solution_id}/helpful")
async def mark_solution_helpful(
    solution_id: str,
    service: QuickSolutionsService = Depends(get_quick_solutions_service),
    current_user: dict = Depends(get_current_user),
):
    """
    Marca una solución como útil, incrementando su contador.

    Se llama cuando el usuario hace clic en "Esta solución me fue útil".

    - **solution_id**: UUID de la solución
    """
    try:
        success = service.increment_helpful_count(solution_id)

        if not success:
            raise HTTPException(status_code=500, detail="Error al marcar como útil")

        return {"success": True, "message": "¡Gracias por tu feedback!"}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error en mark_solution_helpful: {e}")
        raise HTTPException(status_code=500, detail="Error al registrar feedback")
