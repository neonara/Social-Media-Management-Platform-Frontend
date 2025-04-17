"use server";

import { API_BASE_URL } from "@/config/api";
import { GetUser } from "@/types/user";
import { cookies } from "next/headers";

// Get community managers assigned to the currently logged-in moderator
export async function getAssignedCommunityManagers(): Promise<GetUser[] | { error: string }> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("access_token")?.value;

    if (!token) {
      return { error: "Authentication required" };
    }

    const response = await fetch(`${API_BASE_URL}/moderators/assigned-community-managers/`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      const message = `Error fetching assigned CMs: ${response.statusText}`;
      console.error(message);
      return { error: message };
    }

    const data = await response.json();
    return data as GetUser[];
  } catch (error) {
    console.error("Error fetching assigned CMs:", error);
    return { error: "Failed to fetch assigned CMs" };
  }
}