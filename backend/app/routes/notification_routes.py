"""
Notification Routes
API endpoints for notification management
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from typing import Optional, List
from pydantic import BaseModel

from app.core.config import get_supabase
from app.services.notification_service import get_notification_service

router = APIRouter()


# Response Models
class NotificationResponse(BaseModel):
    """Response model for notification"""

    id: str
    user_id: str
    activity_id: Optional[str] = None
    type: str
    title: str
    message: str
    is_read: bool
    is_dismissed: bool
    created_at: str
    # Additional fields from notifications table
    activity_title: Optional[str] = None
    date: Optional[str] = None
    time: Optional[str] = None
    location: Optional[str] = None

    class Config:
        extra = "allow"  # Allow extra fields from database


class NotificationWithActivity(NotificationResponse):
    """Response model for notification with activity details"""

    activities: Optional[dict]


class UnreadCountResponse(BaseModel):
    """Response model for unread count"""

    count: int


class MarkAllReadResponse(BaseModel):
    """Response model for mark all as read"""

    updated_count: int


class ActivityCompletionResponse(BaseModel):
    """Response model for completing activity from notification"""

    notification: Optional[dict] = None
    activity: Optional[dict] = None

    class Config:
        extra = "allow"  # Allow extra fields


@router.get("", response_model=List[NotificationWithActivity])
async def get_notifications(
    is_read: Optional[bool] = Query(None, description="Filter by read status"),
    is_dismissed: Optional[bool] = Query(
        None, description="Filter by dismissed status"
    ),
    notification_type: Optional[str] = Query(
        None, description="Filter by notification type"
    ),
    limit: int = Query(50, ge=1, le=100, description="Maximum number of notifications"),
    supabase=Depends(get_supabase),
):
    """
    Get all notifications for the authenticated user
    """
    try:
        # Get user from session
        user = supabase.auth.get_user()
        if not user or not user.user:
            raise HTTPException(status_code=401, detail="Not authenticated")

        user_id = user.user.id

        # Get notification service
        notification_service = get_notification_service(supabase)

        # Get notifications
        notifications = notification_service.get_notifications(
            user_id=user_id,
            is_read=is_read,
            is_dismissed=is_dismissed,
            notification_type=notification_type,
            limit=limit,
        )

        return notifications

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/unread-count", response_model=UnreadCountResponse)
async def get_unread_count(
    supabase=Depends(get_supabase),
):
    """
    Get count of unread notifications for the authenticated user
    """
    try:
        # Get user from session
        user = supabase.auth.get_user()
        if not user or not user.user:
            raise HTTPException(status_code=401, detail="Not authenticated")

        user_id = user.user.id

        # Get notification service
        notification_service = get_notification_service(supabase)

        # Get unread count
        count = notification_service.get_unread_count(user_id)

        return {"count": count}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{notification_id}", response_model=NotificationWithActivity)
async def get_notification(
    notification_id: str,
    supabase=Depends(get_supabase),
):
    """
    Get a specific notification by ID
    """
    try:
        # Get user from session
        user = supabase.auth.get_user()
        if not user or not user.user:
            raise HTTPException(status_code=401, detail="Not authenticated")

        user_id = user.user.id

        # Get notification service
        notification_service = get_notification_service(supabase)

        # Get notification
        notification = notification_service.get_notification_by_id(
            notification_id, user_id
        )

        if not notification:
            raise HTTPException(status_code=404, detail="Notification not found")

        return notification

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{notification_id}/read", response_model=NotificationResponse)
async def mark_notification_as_read(
    notification_id: str,
    supabase=Depends(get_supabase),
):
    """
    Mark a notification as read
    """
    try:
        # Get user from session
        user = supabase.auth.get_user()
        if not user or not user.user:
            raise HTTPException(status_code=401, detail="Not authenticated")

        user_id = user.user.id

        # Get notification service
        notification_service = get_notification_service(supabase)

        # Mark as read
        notification = notification_service.mark_as_read(notification_id, user_id)

        return notification

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{notification_id}/unread", response_model=NotificationResponse)
async def mark_notification_as_unread(
    notification_id: str,
    supabase=Depends(get_supabase),
):
    """
    Mark a notification as unread
    """
    try:
        # Get user from session
        user = supabase.auth.get_user()
        if not user or not user.user:
            raise HTTPException(status_code=401, detail="Not authenticated")

        user_id = user.user.id

        # Get notification service
        notification_service = get_notification_service(supabase)

        # Mark as unread
        notification = notification_service.mark_as_unread(notification_id, user_id)

        return notification

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/read-all", response_model=MarkAllReadResponse)
async def mark_all_notifications_as_read(
    supabase=Depends(get_supabase),
):
    """
    Mark all unread notifications as read for the authenticated user
    """
    try:
        # Get user from session
        user = supabase.auth.get_user()
        if not user or not user.user:
            raise HTTPException(status_code=401, detail="Not authenticated")

        user_id = user.user.id

        # Get notification service
        notification_service = get_notification_service(supabase)

        # Mark all as read
        count = notification_service.mark_all_as_read(user_id)

        return {"updated_count": count}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{notification_id}/dismiss", response_model=NotificationResponse)
async def dismiss_notification(
    notification_id: str,
    supabase=Depends(get_supabase),
):
    """
    Dismiss a notification (also marks as read automatically)
    """
    try:
        # Get user from session
        user = supabase.auth.get_user()
        if not user or not user.user:
            raise HTTPException(status_code=401, detail="Not authenticated")

        user_id = user.user.id

        # Get notification service
        notification_service = get_notification_service(supabase)

        # Dismiss notification
        notification = notification_service.dismiss_notification(
            notification_id, user_id
        )

        return notification

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{notification_id}/restore", response_model=NotificationResponse)
async def restore_notification(
    notification_id: str,
    supabase=Depends(get_supabase),
):
    """
    Restore a dismissed notification (undismiss)
    """
    try:
        # Get user from session
        user = supabase.auth.get_user()
        if not user or not user.user:
            raise HTTPException(status_code=401, detail="Not authenticated")

        user_id = user.user.id

        # Get notification service
        notification_service = get_notification_service(supabase)

        # Restore notification
        notification = notification_service.restore_notification(
            notification_id, user_id
        )

        return notification

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{notification_id}", status_code=204)
async def delete_notification(
    notification_id: str,
    supabase=Depends(get_supabase),
):
    """
    Delete a notification permanently
    """
    try:
        # Get user from session
        user = supabase.auth.get_user()
        if not user or not user.user:
            raise HTTPException(status_code=401, detail="Not authenticated")

        user_id = user.user.id

        # Get notification service
        notification_service = get_notification_service(supabase)

        # Delete notification
        notification_service.delete_notification(notification_id, user_id)

        return None

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post(
    "/{notification_id}/complete-activity", response_model=ActivityCompletionResponse
)
async def complete_activity_from_notification(
    notification_id: str,
    supabase=Depends(get_supabase),
):
    """
    Mark the activity associated with this notification as completed
    """
    try:
        # Get user from session
        user = supabase.auth.get_user()
        if not user or not user.user:
            raise HTTPException(status_code=401, detail="Not authenticated")

        user_id = user.user.id

        # Get notification service
        notification_service = get_notification_service(supabase)

        # Complete activity from notification
        result = notification_service.mark_activity_completed_from_notification(
            notification_id, user_id
        )

        return result

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
