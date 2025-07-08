"use server";

import { cookies } from "next/headers";
import { API_BASE_URL } from "@/config/api";

export async function getCMAssignments() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("access_token")?.value;

    if (!token) {
      return {
        success: false,
        error: "Authentication required",
      };
    }

    const response = await fetch(
      `${API_BASE_URL}/community-manager/assignments`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
      },
    );

    if (!response.ok) {
      return {
        success: false,
        error: "Failed to fetch assignments",
      };
    }

    const data = await response.json();
    return {
      success: true,
      data,
    };
  } catch (error) {
    console.error("Error fetching CM assignments:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "An unknown error occurred",
    };
  }
}
