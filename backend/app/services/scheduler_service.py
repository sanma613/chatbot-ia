"""
Scheduler Service
Handles scheduled tasks like sending reminder emails
"""

import logging
from datetime import datetime, timedelta, timezone
from typing import List, Dict, Any
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger

from app.services.email_service import get_email_service
from app.core.config import supabase_

logger = logging.getLogger(__name__)


class ReminderScheduler:
    """Scheduler for sending activity reminders"""

    def __init__(self):
        self.scheduler = BackgroundScheduler()
        self.email_service = get_email_service()
        self.supabase = supabase_

    def start(self):
        """Start the scheduler"""
        # Schedule hourly check to send reminders exactly 24 hours before activities
        # This ensures reminders are sent regardless of activity time
        self.scheduler.add_job(
            self.check_and_send_reminders,
            CronTrigger(minute=0),  # Every hour at minute 0
            id="hourly_reminder_check",
            name="Check and send activity reminders (hourly)",
            replace_existing=True,
        )

        self.scheduler.start()
        logger.info(
            "Reminder scheduler started - will run hourly to send reminders 24h before activities"
        )

    def stop(self):
        """Stop the scheduler"""
        if self.scheduler.running:
            self.scheduler.shutdown()
            logger.info("Reminder scheduler stopped")

    def check_and_send_reminders(self):
        """
        Check for activities in the next 24-25 hours and send reminder emails
        Runs hourly to ensure reminders are sent approximately 24 hours before each activity

        NOTE: Activities are stored as local time (date + time strings without timezone)
        so we compare with local server time for consistency
        """
        try:
            logger.info("Starting hourly reminder check...")

            # Calculate time window: between 24 and 25 hours from now
            # This 1-hour window ensures each activity gets exactly one reminder
            # Use local time to match how activities are stored
            now = datetime.now()
            start_time = now + timedelta(hours=24)
            end_time = now + timedelta(hours=25)

            start_date = start_time.strftime("%Y-%m-%d")
            end_date = end_time.strftime("%Y-%m-%d")

            logger.info(f"Current time (local): {now.strftime('%Y-%m-%d %H:%M:%S')}")
            logger.info(
                f"Looking for activities between {start_time.strftime('%Y-%m-%d %H:%M:%S')} and {end_time.strftime('%Y-%m-%d %H:%M:%S')}"
            )

            # Get all activities in the time window
            activities = self._get_activities_in_window(
                start_date, end_date, start_time, end_time
            )

            if not activities:
                logger.info(f"No activities found in the next 24-25 hours")
                return

            logger.info(f"Found {len(activities)} activities in the next 24-25 hours")

            # Send reminder email for each activity
            sent_count = 0
            for activity in activities:
                if self._send_reminder_for_activity(activity):
                    sent_count += 1

            logger.info(
                f"Successfully sent {sent_count}/{len(activities)} reminder emails"
            )

        except Exception as e:
            logger.error(f"Error in reminder check: {str(e)}")

    def _get_activities_in_window(
        self, start_date: str, end_date: str, start_time: datetime, end_time: datetime
    ) -> List[Dict[str, Any]]:
        """
        Get all activities in a specific time window (24-25 hours from now)
        Only returns activities that haven't had their reminder email sent yet

        Args:
            start_date: Start date in YYYY-MM-DD format
            end_date: End date in YYYY-MM-DD format
            start_time: Start datetime object
            end_time: End datetime object

        Returns:
            List of activities with user information
        """
        try:
            # Query activities in the date range that are not completed
            query = (
                self.supabase.table("activities")
                .select("id, user_id, title, date, time, location, type, is_completed")
                .eq("is_completed", False)
                .gte(
                    "date", datetime.now().strftime("%Y-%m-%d")
                )  # Only future/today activities
            )

            # If dates are the same, filter by single date
            if start_date == end_date:
                query = query.eq("date", start_date)
            else:
                # Activities can be on either day
                query = query.gte("date", start_date).lte("date", end_date)

            response = query.execute()
            activities = response.data if response.data else []

            # Filter by exact time window
            filtered_activities = []
            now_for_diff = datetime.now()  # For calculating time differences

            for activity in activities:
                try:
                    # Combine date and time
                    activity_datetime_str = f"{activity['date']} {activity['time']}"
                    # Parse as naive datetime (local time, no timezone)
                    activity_datetime = datetime.strptime(
                        activity_datetime_str, "%Y-%m-%d %H:%M:%S"
                    )

                    logger.info(
                        f"Checking activity '{activity['title']}' scheduled for {activity_datetime_str}"
                    )

                    # Check if activity is within the 24-25 hour window
                    if start_time <= activity_datetime < end_time:
                        filtered_activities.append(activity)
                        logger.info(
                            f"✓ Activity '{activity['title']}' IS in reminder window (24-25h from now)"
                        )
                    else:
                        time_diff_hours = (
                            activity_datetime - now_for_diff
                        ).total_seconds() / 3600
                        logger.info(
                            f"✗ Activity '{activity['title']}' is {time_diff_hours:.1f}h away (outside 24-25h window)"
                        )
                except Exception as e:
                    logger.warning(
                        f"Error parsing datetime for activity {activity.get('id')}: {str(e)}"
                    )
                    continue

            # For each activity, get user email and check if reminder already sent
            activities_with_users = []
            for activity in filtered_activities:
                user_id = activity.get("user_id")
                activity_id = activity.get("id")

                # Check if we already sent a reminder for this activity
                if self._has_reminder_been_sent(activity_id):
                    logger.info(
                        f"Skipping activity '{activity.get('title')}' - reminder already sent"
                    )
                    continue

                if user_id:
                    user_data = self._get_user_email(user_id)
                    if user_data:
                        activity["user_email"] = user_data.get("email")
                        activity["user_name"] = user_data.get("name", "Usuario")
                        activities_with_users.append(activity)

            return activities_with_users

        except Exception as e:
            logger.error(f"Error fetching activities in time window: {str(e)}")
            return []

    def _has_reminder_been_sent(self, activity_id: str) -> bool:
        """
        Check if a reminder email has already been sent for this activity

        Args:
            activity_id: Activity UUID

        Returns:
            True if reminder was already sent, False otherwise
        """
        try:
            # Check if there's a notification with email_sent = true for this activity
            # If email_sent column doesn't exist yet, we check for any reminder notification
            response = (
                self.supabase.table("notifications")
                .select("id, email_sent")
                .eq("activity_id", activity_id)
                .eq("type", "reminder")
                .execute()
            )

            if response.data:
                # If email_sent column exists, check its value
                for notification in response.data:
                    if notification.get("email_sent", False):
                        return True
                    # If email_sent field doesn't exist, assume already sent if notification exists
                    if "email_sent" not in notification:
                        return True

            return False

        except Exception as e:
            logger.warning(
                f"Error checking if reminder was sent for activity {activity_id}: {str(e)}"
            )
            # On error, assume not sent to allow retry
            return False

    def _get_user_email(self, user_id: str) -> Dict[str, Any]:
        """
        Get user email from Supabase auth

        Args:
            user_id: User UUID

        Returns:
            Dict with email and name
        """
        try:
            # Get user from auth.users using admin API
            response = self.supabase.auth.admin.get_user_by_id(user_id)

            if response and response.user:
                user = response.user
                user_name = user.user_metadata.get("name") or user.user_metadata.get(
                    "full_name"
                )

                # Si no hay nombre en user_metadata, buscar en la tabla profiles
                if not user_name:
                    try:
                        profile_response = (
                            self.supabase.table("profiles")
                            .select("full_name")
                            .eq("id", user_id)
                            .single()
                            .execute()
                        )
                        if profile_response.data:
                            user_name = profile_response.data.get("full_name")
                    except Exception as profile_error:
                        logger.warning(
                            f"Could not fetch profile for user {user_id}: {str(profile_error)}"
                        )

                # Último fallback: usar parte del email
                if not user_name:
                    user_name = user.email.split("@")[0]

                return {
                    "email": user.email,
                    "name": user_name,
                }

            return None

        except Exception as e:
            logger.error(f"Error fetching user {user_id}: {str(e)}")
            return None

    def _send_reminder_for_activity(self, activity: Dict[str, Any]) -> bool:
        """
        Send reminder email for a single activity and create/update notification

        Args:
            activity: Activity data with user_email and user_name

        Returns:
            True if email sent successfully
        """
        try:
            user_email = activity.get("user_email")
            user_name = activity.get("user_name", "Usuario")
            activity_id = activity.get("id")
            user_id = activity.get("user_id")

            if not user_email:
                logger.warning(f"No email found for activity {activity.get('id')}")
                return False

            # Send email
            success = self.email_service.send_activity_reminder(
                to_email=user_email, user_name=user_name, activity=activity
            )

            if success:
                logger.info(
                    f"Sent reminder for activity '{activity.get('title')}' to {user_email}"
                )

                # Create or update notification to mark email as sent
                self._create_or_update_notification(activity_id, user_id, activity)
            else:
                logger.warning(
                    f"Failed to send reminder for activity '{activity.get('title')}' to {user_email}"
                )

            return success

        except Exception as e:
            logger.error(
                f"Error sending reminder for activity {activity.get('id')}: {str(e)}"
            )
            return False

    def _create_or_update_notification(
        self, activity_id: str, user_id: str, activity: Dict[str, Any]
    ):
        """
        Create or update notification to mark that email reminder was sent

        Args:
            activity_id: Activity UUID
            user_id: User UUID
            activity: Activity data
        """
        try:
            # Check if notification already exists
            existing = (
                self.supabase.table("notifications")
                .select("id")
                .eq("activity_id", activity_id)
                .eq("type", "reminder")
                .execute()
            )

            notification_data = {
                "user_id": user_id,
                "activity_id": activity_id,
                "type": "reminder",
                "title": "Recordatorio de Actividad",
                "message": f"Tienes la actividad '{activity.get('title')}' mañana",
                "activity_title": activity.get("title"),
                "date": activity.get("date"),
                "time": activity.get("time"),
                "location": activity.get("location"),
                "is_read": False,
                "is_dismissed": False,
            }

            # Add email_sent field if it exists in the schema
            try:
                notification_data["email_sent"] = True
                notification_data["email_sent_at"] = datetime.now().isoformat()
            except:
                pass  # Columns might not exist yet

            if existing.data and len(existing.data) > 0:
                # Update existing notification
                notification_id = existing.data[0]["id"]
                self.supabase.table("notifications").update(notification_data).eq(
                    "id", notification_id
                ).execute()
                logger.info(
                    f"Updated notification {notification_id} with email_sent status"
                )
            else:
                # Create new notification
                self.supabase.table("notifications").insert(notification_data).execute()
                logger.info(f"Created new notification for activity {activity_id}")

        except Exception as e:
            logger.error(f"Error creating/updating notification: {str(e)}")


# Global scheduler instance
_scheduler_instance = None


def get_scheduler() -> ReminderScheduler:
    """Get the global scheduler instance"""
    global _scheduler_instance
    if _scheduler_instance is None:
        _scheduler_instance = ReminderScheduler()
    return _scheduler_instance


def start_scheduler():
    """Start the global scheduler"""
    scheduler = get_scheduler()
    scheduler.start()


def stop_scheduler():
    """Stop the global scheduler"""
    global _scheduler_instance
    if _scheduler_instance:
        _scheduler_instance.stop()
