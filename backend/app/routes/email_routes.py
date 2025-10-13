"""
Email Routes
API endpoints for email testing (development only)
"""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, EmailStr
from typing import Dict, Any

from app.core.config import get_supabase
from app.services.email_service import get_email_service
from app.services.scheduler_service import get_scheduler

router = APIRouter()


class TestEmailRequest(BaseModel):
    """Request model for test email"""

    to_email: EmailStr
    user_name: str = "Usuario de Prueba"
    activity_title: str = "Reunión de Proyecto"
    activity_date: str = "2025-10-14"
    activity_time: str = "10:00:00"
    activity_location: str = "Sala de Conferencias"
    activity_type: str = "meeting"


@router.post("/test-reminder")
async def send_test_reminder(
    request: TestEmailRequest,
    supabase=Depends(get_supabase),
):
    """
    Send a test reminder email (for development/testing)

    This endpoint allows you to test the email functionality without waiting
    for the scheduled task.
    """
    try:
        # Get user from session (optional authentication)
        try:
            user = supabase.auth.get_user()
            if not user or not user.user:
                raise HTTPException(status_code=401, detail="Not authenticated")
        except:
            pass  # Allow unauthenticated for testing

        # Get email service
        email_service = get_email_service()

        # Prepare activity data
        activity_data = {
            "title": request.activity_title,
            "date": request.activity_date,
            "time": request.activity_time,
            "location": request.activity_location,
            "type": request.activity_type,
        }

        # Send email
        success = email_service.send_activity_reminder(
            to_email=request.to_email,
            user_name=request.user_name,
            activity=activity_data,
        )

        if success:
            return {
                "success": True,
                "message": f"Test email sent successfully to {request.to_email}",
            }
        else:
            raise HTTPException(
                status_code=500,
                detail="Failed to send email. Check SMTP configuration and logs.",
            )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/trigger-reminder-check")
async def trigger_reminder_check(supabase=Depends(get_supabase)):
    """
    Manually trigger the reminder check (for testing)

    This will check for activities tomorrow and send reminder emails.
    """
    try:
        # Get user from session (require authentication)
        user = supabase.auth.get_user()
        if not user or not user.user:
            raise HTTPException(status_code=401, detail="Not authenticated")

        # Get scheduler and trigger check
        scheduler = get_scheduler()
        scheduler.check_and_send_reminders()

        return {
            "success": True,
            "message": "Reminder check triggered successfully. Check logs for details.",
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
