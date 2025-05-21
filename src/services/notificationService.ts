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
      return { error: "Authentication required" };
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
      throw new Error(`Error: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching notifications:", error);
    throw error;
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
      throw new Error(`Error: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    throw error;
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
      throw new Error(`Error: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error(
      `Error marking notification ${notificationId} as read:`,
      error,
    );
    throw error;
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
      throw new Error(`Error: ${response.statusText}`);
    }

    return { success: true };
  } catch (error) {
    console.error(`Error deleting notification ${notificationId}:`, error);
    throw error;
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
      return { error: "Authentication required" };
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
      throw new Error(`Error: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error revalidating notifications cache:", error);
    throw error;
  }
}
