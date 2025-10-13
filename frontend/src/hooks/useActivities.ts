import { useState, useEffect, useCallback } from 'react';
import {
  getActivities,
  createActivity,
  updateActivity,
  markActivityCompleted,
  deleteActivity,
  Activity,
  CreateActivityData,
  UpdateActivityData,
  GetActivitiesParams,
} from '@/lib/activityApi';

interface UseActivitiesReturn {
  activities: Activity[];
  loading: boolean;
  error: string | null;
  refetch: (params?: GetActivitiesParams) => Promise<void>;
  createNewActivity: (data: CreateActivityData) => Promise<Activity>;
  updateExistingActivity: (
    id: string,
    data: UpdateActivityData
  ) => Promise<Activity>;
  markComplete: (id: string, isCompleted?: boolean) => Promise<Activity>;
  removeActivity: (id: string) => Promise<void>;
}

/**
 * Hook for managing activities with real-time updates
 */
export function useActivities(
  initialParams?: GetActivitiesParams
): UseActivitiesReturn {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch activities
  const refetch = useCallback(
    async (params?: GetActivitiesParams) => {
      try {
        setLoading(true);
        setError(null);
        const data = await getActivities(params || initialParams);
        setActivities(data);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to fetch activities';
        setError(errorMessage);
        console.error('Error fetching activities:', err);
      } finally {
        setLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [] // Empty deps to prevent refetch on every render
  );

  // Create new activity
  const createNewActivity = useCallback(
    async (data: CreateActivityData): Promise<Activity> => {
      try {
        setError(null);
        const newActivity = await createActivity(data);

        // Add to local state
        setActivities((prev) =>
          [...prev, newActivity].sort((a, b) => {
            // Sort by date and time
            const dateCompare = a.date.localeCompare(b.date);
            if (dateCompare !== 0) return dateCompare;
            return a.time.localeCompare(b.time);
          })
        );

        return newActivity;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to create activity';
        setError(errorMessage);
        throw err;
      }
    },
    []
  );

  // Update existing activity
  const updateExistingActivity = useCallback(
    async (id: string, data: UpdateActivityData): Promise<Activity> => {
      try {
        setError(null);
        const updatedActivity = await updateActivity(id, data);

        // Update in local state
        setActivities((prev) =>
          prev.map((activity) =>
            activity.id === id ? updatedActivity : activity
          )
        );

        return updatedActivity;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to update activity';
        setError(errorMessage);
        throw err;
      }
    },
    []
  );

  // Mark activity as completed
  const markComplete = useCallback(
    async (id: string, isCompleted: boolean = true): Promise<Activity> => {
      try {
        setError(null);
        const updatedActivity = await markActivityCompleted(id, isCompleted);

        // Update in local state
        setActivities((prev) =>
          prev.map((activity) =>
            activity.id === id ? updatedActivity : activity
          )
        );

        return updatedActivity;
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : 'Failed to mark activity as completed';
        setError(errorMessage);
        throw err;
      }
    },
    []
  );

  // Delete activity
  const removeActivity = useCallback(async (id: string): Promise<void> => {
    try {
      setError(null);
      await deleteActivity(id);

      // Remove from local state
      setActivities((prev) => prev.filter((activity) => activity.id !== id));
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to delete activity';
      setError(errorMessage);
      throw err;
    }
  }, []);

  // Initial fetch (only once on mount)
  useEffect(() => {
    refetch(initialParams);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty array = only run once on mount

  return {
    activities,
    loading,
    error,
    refetch,
    createNewActivity,
    updateExistingActivity,
    markComplete,
    removeActivity,
  };
}
