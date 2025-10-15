"""
Notification Service
Handles business logic for notification management with Supabase
"""

import logging
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone

logger = logging.getLogger(__name__)


def get_utc_timestamp() -> str:
    """
    Obtener timestamp UTC en formato compatible con Supabase.
    Supabase espera formato ISO sin timezone explícito (naive UTC).
    """
    return datetime.now(timezone.utc).replace(tzinfo=None).isoformat()


class NotificationService:
    """Service for managing notifications"""

    def __init__(self, supabase_client):
        self.supabase = supabase_client

    def get_notifications(
        self,
        user_id: str,
        is_read: Optional[bool] = None,
        is_dismissed: Optional[bool] = None,
        notification_type: Optional[str] = None,
        limit: int = 50,
    ) -> List[Dict[str, Any]]:
        """
        Get notifications for a user with optional filters

        Args:
            user_id: User ID
            is_read: Filter by read status
            is_dismissed: Filter by dismissed status
            notification_type: Filter by notification type
            limit: Maximum number of notifications to return

        Returns:
            List of notifications
        """
        try:
            query = (
                self.supabase.table("notifications")
                .select("*, activities(*)")
                .eq("user_id", user_id)
                .order("created_at", desc=True)
                .limit(limit)
            )

            # Apply filters
            if is_read is not None:
                query = query.eq("is_read", is_read)
            if is_dismissed is not None:
                query = query.eq("is_dismissed", is_dismissed)
            if notification_type:
                query = query.eq("type", notification_type)

            response = query.execute()

            logger.info(
                f"Retrieved {len(response.data)} notifications for user {user_id}"
            )
            return response.data

        except Exception as e:
            logger.error(f"Error getting notifications for user {user_id}: {str(e)}")
            raise

    def get_notification_by_id(
        self, notification_id: str, user_id: str
    ) -> Optional[Dict[str, Any]]:
        """
        Get a specific notification by ID

        Args:
            notification_id: Notification ID
            user_id: User ID (for authorization)

        Returns:
            Notification data or None
        """
        try:
            response = (
                self.supabase.table("notifications")
                .select("*, activities(*)")
                .eq("id", notification_id)
                .eq("user_id", user_id)
                .execute()
            )

            # Check if we got data
            if response.data and len(response.data) > 0:
                return response.data[0]

            return None

        except Exception as e:
            logger.error(f"Error getting notification {notification_id}: {str(e)}")
            raise

    def get_unread_count(self, user_id: str) -> int:
        """
        Get count of unread notifications for a user

        Args:
            user_id: User ID

        Returns:
            Count of unread notifications
        """
        try:
            response = (
                self.supabase.table("notifications")
                .select("id", count="exact")
                .eq("user_id", user_id)
                .eq("is_read", False)
                .eq("is_dismissed", False)
                .execute()
            )

            return response.count or 0

        except Exception as e:
            logger.error(f"Error getting unread count for user {user_id}: {str(e)}")
            raise

    def mark_as_read(self, notification_id: str, user_id: str) -> Dict[str, Any]:
        """
        Mark a notification as read

        Args:
            notification_id: Notification ID
            user_id: User ID (for authorization)

        Returns:
            Updated notification data
        """
        try:
            updates = {
                "is_read": True,
            }

            response = (
                self.supabase.table("notifications")
                .update(updates)
                .eq("id", notification_id)
                .eq("user_id", user_id)
                .execute()
            )

            if response.data and len(response.data) > 0:
                updated_notification = response.data[0]
                logger.info(f"Marked notification {notification_id} as read")
                return updated_notification
            else:
                raise Exception("Notification not found or unauthorized")

        except Exception as e:
            logger.error(
                f"Error marking notification {notification_id} as read: {str(e)}"
            )
            raise

    def mark_as_unread(self, notification_id: str, user_id: str) -> Dict[str, Any]:
        """
        Mark a notification as unread

        Args:
            notification_id: Notification ID
            user_id: User ID (for authorization)

        Returns:
            Updated notification data
        """
        try:
            updates = {
                "is_read": False,
            }

            response = (
                self.supabase.table("notifications")
                .update(updates)
                .eq("id", notification_id)
                .eq("user_id", user_id)
                .execute()
            )

            if response.data and len(response.data) > 0:
                updated_notification = response.data[0]
                logger.info(f"Marked notification {notification_id} as unread")
                return updated_notification
            else:
                raise Exception("Notification not found or unauthorized")

        except Exception as e:
            logger.error(
                f"Error marking notification {notification_id} as unread: {str(e)}"
            )
            raise

    def mark_all_as_read(self, user_id: str) -> int:
        """
        Mark all unread notifications as read for a user

        Args:
            user_id: User ID

        Returns:
            Number of notifications updated
        """
        try:
            updates = {
                "is_read": True,
            }

            response = (
                self.supabase.table("notifications")
                .update(updates)
                .eq("user_id", user_id)
                .eq("is_read", False)
                .execute()
            )

            count = len(response.data) if response.data else 0
            logger.info(f"Marked {count} notifications as read for user {user_id}")
            return count

        except Exception as e:
            logger.error(
                f"Error marking all notifications as read for user {user_id}: {str(e)}"
            )
            raise

    def dismiss_notification(
        self, notification_id: str, user_id: str
    ) -> Dict[str, Any]:
        """
        Dismiss a notification (also marks as read)

        Args:
            notification_id: Notification ID
            user_id: User ID (for authorization)

        Returns:
            Updated notification data
        """
        try:
            updates = {
                "is_dismissed": True,
                "is_read": True,  # Auto-mark as read when dismissing
            }

            response = (
                self.supabase.table("notifications")
                .update(updates)
                .eq("id", notification_id)
                .eq("user_id", user_id)
                .execute()
            )

            if response.data and len(response.data) > 0:
                updated_notification = response.data[0]
                logger.info(f"Dismissed notification {notification_id}")
                return updated_notification
            else:
                raise Exception("Notification not found or unauthorized")

        except Exception as e:
            logger.error(f"Error dismissing notification {notification_id}: {str(e)}")
            raise

    def restore_notification(
        self, notification_id: str, user_id: str
    ) -> Dict[str, Any]:
        """
        Restore a dismissed notification (undismiss)

        Args:
            notification_id: Notification ID
            user_id: User ID (for authorization)

        Returns:
            Updated notification data
        """
        try:
            updates = {
                "is_dismissed": False,
            }

            response = (
                self.supabase.table("notifications")
                .update(updates)
                .eq("id", notification_id)
                .eq("user_id", user_id)
                .execute()
            )

            if response.data and len(response.data) > 0:
                updated_notification = response.data[0]
                logger.info(f"Restored notification {notification_id}")
                return updated_notification
            else:
                raise Exception("Notification not found or unauthorized")

        except Exception as e:
            logger.error(f"Error restoring notification {notification_id}: {str(e)}")
            raise

    def delete_notification(self, notification_id: str, user_id: str) -> bool:
        """
        Delete a notification permanently

        Args:
            notification_id: Notification ID
            user_id: User ID (for authorization)

        Returns:
            True if deleted successfully
        """
        try:
            response = (
                self.supabase.table("notifications")
                .delete()
                .eq("id", notification_id)
                .eq("user_id", user_id)
                .execute()
            )

            if response.data:
                logger.info(f"Deleted notification {notification_id}")
                return True
            else:
                raise Exception("Notification not found or unauthorized")

        except Exception as e:
            logger.error(f"Error deleting notification {notification_id}: {str(e)}")
            raise

    def mark_activity_completed_from_notification(
        self, notification_id: str, user_id: str
    ) -> Dict[str, Any]:
        """
        Mark the associated activity as completed from a notification

        Args:
            notification_id: Notification ID
            user_id: User ID (for authorization)

        Returns:
            Dict with notification and activity data
        """
        try:
            # Get the notification with activity
            notification = self.get_notification_by_id(notification_id, user_id)

            if not notification:
                raise Exception("Notification not found")

            activity_id = notification.get("activity_id")
            if not activity_id:
                raise Exception("No activity associated with this notification")

            # Mark activity as completed
            activity_updates = {
                "is_completed": True,
                "completed_at": get_utc_timestamp(),
            }

            activity_response = (
                self.supabase.table("activities")
                .update(activity_updates)
                .eq("id", activity_id)
                .eq("user_id", user_id)
                .execute()
            )

            if not activity_response.data or len(activity_response.data) == 0:
                raise Exception("Failed to update activity")

            # Mark notification as read
            notification_updates = {
                "is_read": True,
            }

            notification_response = (
                self.supabase.table("notifications")
                .update(notification_updates)
                .eq("id", notification_id)
                .eq("user_id", user_id)
                .execute()
            )

            logger.info(
                f"Marked activity {activity_id} as completed from notification {notification_id}"
            )

            return {
                "notification": (
                    notification_response.data[0]
                    if notification_response.data
                    else None
                ),
                "activity": activity_response.data[0],
            }

        except Exception as e:
            logger.error(
                f"Error marking activity completed from notification {notification_id}: {str(e)}"
            )
            raise


# Factory function to get service instance
def get_notification_service(supabase_client) -> NotificationService:
    """Get an instance of NotificationService"""
    return NotificationService(supabase_client)
