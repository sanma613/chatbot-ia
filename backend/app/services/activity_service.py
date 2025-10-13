"""
Activity Service
Handles business logic for activity management with Supabase
"""

import logging
from typing import List, Optional, Dict, Any
from datetime import datetime

logger = logging.getLogger(__name__)


class ActivityService:
    """Service for managing activities"""

    def __init__(self, supabase_client):
        self.supabase = supabase_client

    def get_activities(
        self,
        user_id: str,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
        activity_type: Optional[str] = None,
        is_completed: Optional[bool] = None,
    ) -> List[Dict[str, Any]]:
        """
        Get all activities for a user with optional filters

        Args:
            user_id: User ID
            start_date: Filter by start date (ISO format)
            end_date: Filter by end date (ISO format)
            activity_type: Filter by activity type
            is_completed: Filter by completion status

        Returns:
            List of activities
        """
        try:
            query = (
                self.supabase.table("activities")
                .select("*")
                .eq("user_id", user_id)
                .order("date", desc=False)
                .order("time", desc=False)
            )

            # Apply filters
            if start_date:
                query = query.gte("date", start_date)
            if end_date:
                query = query.lte("date", end_date)
            if activity_type:
                query = query.eq("type", activity_type)
            if is_completed is not None:
                query = query.eq("is_completed", is_completed)

            response = query.execute()

            logger.info(f"Retrieved {len(response.data)} activities for user {user_id}")
            return response.data

        except Exception as e:
            logger.error(f"Error getting activities for user {user_id}: {str(e)}")
            raise

    def get_activity_by_id(
        self, activity_id: str, user_id: str
    ) -> Optional[Dict[str, Any]]:
        """
        Get a specific activity by ID

        Args:
            activity_id: Activity ID
            user_id: User ID (for authorization)

        Returns:
            Activity data or None
        """
        try:
            response = (
                self.supabase.table("activities")
                .select("*")
                .eq("id", activity_id)
                .eq("user_id", user_id)
                .maybe_single()
                .execute()
            )

            return response.data

        except Exception as e:
            logger.error(f"Error getting activity {activity_id}: {str(e)}")
            raise

    def create_activity(
        self,
        user_id: str,
        title: str,
        date: str,
        time: str,
        activity_type: str = "other",
        location: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Create a new activity

        Args:
            user_id: User ID
            title: Activity title
            date: Activity date (ISO format)
            time: Activity time (HH:MM format)
            activity_type: Type of activity (class, exam, assignment, meeting, other)
            location: Location (optional)

        Returns:
            Created activity data

        Raises:
            ValueError: If date/time is in the past
        """
        try:
            # Validate that date/time is not in the past
            # Add seconds if not present in time
            time_parts = time.split(":")
            if len(time_parts) == 2:
                time_with_seconds = f"{time}:00"
            else:
                time_with_seconds = time

            activity_datetime_str = f"{date} {time_with_seconds}"
            activity_datetime = datetime.strptime(
                activity_datetime_str, "%Y-%m-%d %H:%M:%S"
            )

            # Get current datetime
            now = datetime.now()

            # Only reject if the activity datetime is in the past
            if activity_datetime < now:
                raise ValueError(
                    "No se pueden crear actividades para fechas y horas pasadas"
                )

            activity_data = {
                "user_id": user_id,
                "title": title,
                "date": date,
                "time": time,
                "type": activity_type,
                "location": location,
                "is_completed": False,
            }

            response = self.supabase.table("activities").insert(activity_data).execute()

            if response.data and len(response.data) > 0:
                created_activity = response.data[0]
                logger.info(
                    f"Created activity {created_activity['id']} for user {user_id}"
                )
                return created_activity
            else:
                raise Exception("Failed to create activity")

        except ValueError as ve:
            logger.warning(f"Validation error creating activity: {str(ve)}")
            raise
        except Exception as e:
            logger.error(f"Error creating activity for user {user_id}: {str(e)}")
            raise

    def update_activity(
        self, activity_id: str, user_id: str, updates: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Update an existing activity

        Args:
            activity_id: Activity ID
            user_id: User ID (for authorization)
            updates: Dictionary with fields to update

        Returns:
            Updated activity data

        Raises:
            ValueError: If trying to change date/time to past or modify completed activity
        """
        try:
            # Get current activity to check if it's completed
            current = self.get_activity_by_id(activity_id, user_id)
            if not current:
                raise Exception("Activity not found or unauthorized")

            # Prevent updates to completed activities (except to uncomplete them)
            if current.get("is_completed") and not (
                "is_completed" in updates and not updates["is_completed"]
            ):
                raise ValueError("No se pueden modificar actividades completadas")

            # Validate date/time if being updated
            if "date" in updates or "time" in updates:
                new_date = updates.get("date", current.get("date"))
                new_time = updates.get("time", current.get("time"))

                activity_datetime_str = (
                    f"{new_date} {new_time}:00"
                    if ":" not in new_time[-3:]
                    else f"{new_date} {new_time}"
                )
                activity_datetime = datetime.strptime(
                    activity_datetime_str, "%Y-%m-%d %H:%M:%S"
                )

                if activity_datetime < datetime.now():
                    raise ValueError(
                        "No se pueden programar actividades para fechas pasadas"
                    )

            # Remove fields that shouldn't be updated directly
            updates.pop("id", None)
            updates.pop("user_id", None)
            updates.pop("created_at", None)
            updates["updated_at"] = datetime.utcnow().isoformat()

            response = (
                self.supabase.table("activities")
                .update(updates)
                .eq("id", activity_id)
                .eq("user_id", user_id)
                .execute()
            )

            if response.data and len(response.data) > 0:
                updated_activity = response.data[0]
                logger.info(f"Updated activity {activity_id}")
                return updated_activity
            else:
                raise Exception("Activity not found or unauthorized")

        except ValueError as ve:
            logger.warning(f"Validation error updating activity: {str(ve)}")
            raise
        except Exception as e:
            logger.error(f"Error updating activity {activity_id}: {str(e)}")
            raise

    def mark_activity_completed(
        self, activity_id: str, user_id: str, is_completed: bool = True
    ) -> Dict[str, Any]:
        """
        Mark an activity as completed or uncompleted

        Args:
            activity_id: Activity ID
            user_id: User ID (for authorization)
            is_completed: Completion status

        Returns:
            Updated activity data
        """
        try:
            updates = {
                "is_completed": is_completed,
                "completed_at": datetime.utcnow().isoformat() if is_completed else None,
                "updated_at": datetime.utcnow().isoformat(),
            }

            response = (
                self.supabase.table("activities")
                .update(updates)
                .eq("id", activity_id)
                .eq("user_id", user_id)
                .execute()
            )

            if response.data and len(response.data) > 0:
                updated_activity = response.data[0]
                logger.info(
                    f"Marked activity {activity_id} as {'completed' if is_completed else 'uncompleted'}"
                )
                return updated_activity
            else:
                raise Exception("Activity not found or unauthorized")

        except Exception as e:
            logger.error(f"Error marking activity {activity_id} as completed: {str(e)}")
            raise

    def delete_activity(self, activity_id: str, user_id: str) -> bool:
        """
        Delete an activity

        Args:
            activity_id: Activity ID
            user_id: User ID (for authorization)

        Returns:
            True if deleted successfully
        """
        try:
            response = (
                self.supabase.table("activities")
                .delete()
                .eq("id", activity_id)
                .eq("user_id", user_id)
                .execute()
            )

            if response.data:
                logger.info(f"Deleted activity {activity_id}")
                return True
            else:
                raise Exception("Activity not found or unauthorized")

        except Exception as e:
            logger.error(f"Error deleting activity {activity_id}: {str(e)}")
            raise


# Factory function to get service instance
def get_activity_service(supabase_client) -> ActivityService:
    """Get an instance of ActivityService"""
    return ActivityService(supabase_client)
