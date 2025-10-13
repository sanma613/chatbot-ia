// Activity API client for frontend
// Handles all activity-related API calls to the backend

const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

export interface Activity {
  id: string;
  user_id: string;
  title: string;
  date: string; // ISO date string (YYYY-MM-DD)
  time: string; // Time string (HH:MM:SS)
  type: 'class' | 'exam' | 'assignment' | 'meeting' | 'other';
  location?: string;
  is_completed: boolean;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateActivityData {
  title: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  type?: 'class' | 'exam' | 'assignment' | 'meeting' | 'other';
  location?: string;
}

export interface UpdateActivityData {
  title?: string;
  date?: string;
  time?: string;
  type?: 'class' | 'exam' | 'assignment' | 'meeting' | 'other';
  location?: string;
  is_completed?: boolean;
}

export interface GetActivitiesParams {
  start_date?: string; // YYYY-MM-DD
  end_date?: string; // YYYY-MM-DD
  activity_type?: string;
  is_completed?: boolean;
}

/**
 * Get all activities for the authenticated user
 */
export async function getActivities(
  params?: GetActivitiesParams
): Promise<Activity[]> {
  const queryParams = new URLSearchParams();

  if (params?.start_date) queryParams.append('start_date', params.start_date);
  if (params?.end_date) queryParams.append('end_date', params.end_date);
  if (params?.activity_type)
    queryParams.append('activity_type', params.activity_type);
  if (params?.is_completed !== undefined)
    queryParams.append('is_completed', String(params.is_completed));

  const url = `${API_URL}/activities${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errorMessage =
      errorData.detail || `Failed to fetch activities (${response.status})`;
    throw new Error(errorMessage);
  }

  return response.json();
}

/**
 * Get a specific activity by ID
 */
export async function getActivityById(activityId: string): Promise<Activity> {
  const response = await fetch(`${API_URL}/activities/${activityId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errorMessage =
      errorData.detail || `Failed to fetch activity (${response.status})`;
    throw new Error(errorMessage);
  }

  return response.json();
}

/**
 * Create a new activity
 * This will automatically trigger the creation of a notification via database trigger
 */
export async function createActivity(
  data: CreateActivityData
): Promise<Activity> {
  const response = await fetch(`${API_URL}/activities`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errorMessage =
      errorData.detail || `Failed to create activity (${response.status})`;
    throw new Error(errorMessage);
  }

  return response.json();
}

/**
 * Update an existing activity
 */
export async function updateActivity(
  activityId: string,
  data: UpdateActivityData
): Promise<Activity> {
  const response = await fetch(`${API_URL}/activities/${activityId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errorMessage =
      errorData.detail || `Failed to update activity (${response.status})`;
    throw new Error(errorMessage);
  }

  return response.json();
}

/**
 * Mark an activity as completed or uncompleted
 */
export async function markActivityCompleted(
  activityId: string,
  isCompleted: boolean = true
): Promise<Activity> {
  const response = await fetch(
    `${API_URL}/activities/${activityId}/complete?is_completed=${isCompleted}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errorMessage =
      errorData.detail ||
      `Failed to mark activity as completed (${response.status})`;
    throw new Error(errorMessage);
  }

  return response.json();
}

/**
 * Delete an activity
 */
export async function deleteActivity(activityId: string): Promise<void> {
  const response = await fetch(`${API_URL}/activities/${activityId}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errorMessage =
      errorData.detail || `Failed to delete activity (${response.status})`;
    throw new Error(errorMessage);
  }
}
