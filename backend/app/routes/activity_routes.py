"""
Activity Routes
API endpoints for activity management
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from typing import Optional, List
from pydantic import BaseModel, Field
from datetime import date as DateType

from app.core.config import get_supabase
from app.services.activity_service import get_activity_service

router = APIRouter()


# Request/Response Models
class ActivityCreate(BaseModel):
    """Model for creating an activity"""

    title: str = Field(..., min_length=1, max_length=200)
    date: DateType
    time: str = Field(
        ..., pattern="^([0-1][0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$"
    )  # Acepta HH:MM o HH:MM:SS
    type: str = Field(
        default="other", pattern="^(class|exam|assignment|meeting|other)$"
    )
    location: Optional[str] = Field(None, max_length=200)


class ActivityUpdate(BaseModel):
    """Model for updating an activity"""

    title: Optional[str] = Field(None, min_length=1, max_length=200)
    date: Optional[DateType] = None
    time: Optional[str] = Field(
        None, pattern="^([0-1][0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$"
    )  # Acepta HH:MM o HH:MM:SS
    type: Optional[str] = Field(None, pattern="^(class|exam|assignment|meeting|other)$")
    location: Optional[str] = Field(None, max_length=200)
    is_completed: Optional[bool] = None


class ActivityResponse(BaseModel):
    """Response model for activity"""

    id: str
    user_id: str
    title: str
    date: str
    time: str
    type: str
    location: Optional[str] = None
    is_completed: bool
    completed_at: Optional[str] = None
    created_at: str
    updated_at: str


@router.get("", response_model=List[ActivityResponse])
async def get_activities(
    start_date: Optional[str] = Query(
        None, description="Filter by start date (YYYY-MM-DD)"
    ),
    end_date: Optional[str] = Query(
        None, description="Filter by end date (YYYY-MM-DD)"
    ),
    activity_type: Optional[str] = Query(None, description="Filter by activity type"),
    is_completed: Optional[bool] = Query(
        None, description="Filter by completion status"
    ),
    supabase=Depends(get_supabase),
):
    """
    Get all activities for the authenticated user
    """
    try:
        # Get user from session
        user = supabase.auth.get_user()
        if not user or not user.user:
            raise HTTPException(status_code=401, detail="Not authenticated")

        user_id = user.user.id

        # Get activity service
        activity_service = get_activity_service(supabase)

        # Get activities
        activities = activity_service.get_activities(
            user_id=user_id,
            start_date=start_date,
            end_date=end_date,
            activity_type=activity_type,
            is_completed=is_completed,
        )

        return activities

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("", response_model=ActivityResponse, status_code=201)
async def create_activity(
    activity_data: ActivityCreate,
    supabase=Depends(get_supabase),
):
    """
    Create a new activity

    This will automatically trigger the creation of a notification via database trigger.
    """
    try:
        # Get user from session
        user = supabase.auth.get_user()
        if not user or not user.user:
            raise HTTPException(status_code=401, detail="Not authenticated")

        user_id = user.user.id

        # Get activity service
        activity_service = get_activity_service(supabase)

        # Normalize time format to HH:MM (remove seconds if present)
        time_str = activity_data.time
        if len(time_str) > 5:  # Si tiene formato HH:MM:SS, extraer solo HH:MM
            time_str = time_str[:5]

        # Create activity
        activity = activity_service.create_activity(
            user_id=user_id,
            title=activity_data.title,
            date=activity_data.date.isoformat(),
            time=time_str,
            activity_type=activity_data.type,
            location=activity_data.location,
        )

        return activity

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{activity_id}", response_model=ActivityResponse)
async def get_activity(
    activity_id: str,
    supabase=Depends(get_supabase),
):
    """
    Get a specific activity by ID
    """
    try:
        # Get user from session
        user = supabase.auth.get_user()
        if not user or not user.user:
            raise HTTPException(status_code=401, detail="Not authenticated")

        user_id = user.user.id

        # Get activity service
        activity_service = get_activity_service(supabase)

        # Get activity
        activity = activity_service.get_activity_by_id(activity_id, user_id)

        if not activity:
            raise HTTPException(status_code=404, detail="Activity not found")

        return activity

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.patch("/{activity_id}", response_model=ActivityResponse)
async def update_activity(
    activity_id: str,
    activity_data: ActivityUpdate,
    supabase=Depends(get_supabase),
):
    """
    Update an existing activity
    """
    try:
        # Get user from session
        user = supabase.auth.get_user()
        if not user or not user.user:
            raise HTTPException(status_code=401, detail="Not authenticated")

        user_id = user.user.id

        # Get activity service
        activity_service = get_activity_service(supabase)

        # Prepare updates (exclude None values)
        updates = activity_data.model_dump(exclude_none=True)

        # Convert date to ISO format string
        if "date" in updates:
            updates["date"] = updates["date"].isoformat()

        # Normalize time format to HH:MM (remove seconds if present)
        if "time" in updates:
            time_str = updates["time"]
            if len(time_str) > 5:  # Si tiene formato HH:MM:SS, extraer solo HH:MM
                time_str = time_str[:5]
            updates["time"] = time_str

        # Update activity
        activity = activity_service.update_activity(activity_id, user_id, updates)

        return activity

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{activity_id}/complete", response_model=ActivityResponse)
async def mark_activity_completed(
    activity_id: str,
    is_completed: bool = True,
    supabase=Depends(get_supabase),
):
    """
    Mark an activity as completed or uncompleted
    """
    try:
        # Get user from session
        user = supabase.auth.get_user()
        if not user or not user.user:
            raise HTTPException(status_code=401, detail="Not authenticated")

        user_id = user.user.id

        # Get activity service
        activity_service = get_activity_service(supabase)

        # Mark activity as completed
        activity = activity_service.mark_activity_completed(
            activity_id, user_id, is_completed
        )

        return activity

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{activity_id}", status_code=204)
async def delete_activity(
    activity_id: str,
    supabase=Depends(get_supabase),
):
    """
    Delete an activity
    """
    try:
        # Get user from session
        user = supabase.auth.get_user()
        if not user or not user.user:
            raise HTTPException(status_code=401, detail="Not authenticated")

        user_id = user.user.id

        # Get activity service
        activity_service = get_activity_service(supabase)

        # Delete activity
        activity_service.delete_activity(activity_id, user_id)

        return None

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
