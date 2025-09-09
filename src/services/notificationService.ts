"use server";

import { API_BASE_URL } from "@/config/api";
import { cookies } from "next/headers";

/**
 * Fetch the list of user notifications.
 */
export async function fetchNotifications() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("access_token")?.value;

    if (!token) {
      // Return empty array instead of error object for consistency
      return [];
    }

    const response = await fetch(`${API_BASE_URL}/notifications/`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      cache: "default",
    });

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        // Return empty array for auth errors to prevent UI crashes
        console.warn(
          "Authentication failed for notifications, returning empty array",
        );
        return [];
      }
      throw new Error(`Error: ${response.statusText}`);
    }

    const data = await response.json();
    // Ensure we always return an array
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error("Error fetching notifications:", error);
    // Return empty array instead of throwing to prevent UI crashes
    return [];
  }
}

/**
 * Mark all notifications as read.
 */
export async function markAllNotificationsAsRead() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("access_token")?.value;

    if (!token) {
      return { error: "Authentication required" };
    }

    const response = await fetch(`${API_BASE_URL}/notifications/read-all/`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        return { error: "Authentication failed" };
      }
      throw new Error(`Error: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    return { error: "Failed to mark notifications as read" };
  }
}

/**
 * Mark a specific notification as read.
 * @param notificationId - The ID of the notification to mark as read.
 */
export async function markNotificationAsRead(notificationId: number) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("access_token")?.value;

    if (!token) {
      return { error: "Authentication required" };
    }

    const response = await fetch(
      `${API_BASE_URL}/notifications/${notificationId}/read/`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
      },
    );

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        return { error: "Authentication failed" };
      }
      throw new Error(`Error: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error(
      `Error marking notification ${notificationId} as read:`,
      error,
    );
    return { error: "Failed to mark notification as read" };
  }
}

/**
 * Delete a specific notification.
 * @param notificationId - The ID of the notification to delete.
 */
export async function deleteNotification(notificationId: number) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("access_token")?.value;

    if (!token) {
      return { error: "Authentication required" };
    }

    const response = await fetch(
      `${API_BASE_URL}/notifications/${notificationId}/delete/`,
      {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
      },
    );

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        return { error: "Authentication failed" };
      }
      throw new Error(`Error: ${response.statusText}`);
    }

    return { success: true };
  } catch (error) {
    console.error(`Error deleting notification ${notificationId}:`, error);
    return { error: "Failed to delete notification" };
  }
}

/**
 * Revalidate notifications cache to ensure fresh data.
 * Call this function after mutations like markAsRead or delete.
 */
export async function revalidateNotificationsCache() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("access_token")?.value;

    if (!token) {
      // Return empty array instead of error object for consistency
      return [];
    }

    const response = await fetch(`${API_BASE_URL}/notifications/`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store", // Skip cache for this request to get fresh data
      next: { revalidate: 0 }, // Force revalidation in Next.js
    });

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        // Return empty array for auth errors to prevent UI crashes
        console.warn(
          "Authentication failed for notifications revalidation, returning empty array",
        );
        return [];
      }
      throw new Error(`Error: ${response.statusText}`);
    }

    const data = await response.json();
    // Ensure we always return an array
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error("Error revalidating notifications cache:", error);
    // Return empty array instead of throwing to prevent UI crashes
    return [];
  }
}
