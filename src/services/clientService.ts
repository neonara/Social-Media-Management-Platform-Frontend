"use server";

import { cookies } from "next/headers";
import { API_BASE_URL } from "@/config/api";

export async function getClientAssignments() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("access_token")?.value;

    if (!token) {
      throw new Error("Authentication required");
    }

    const response = await fetch(`${API_BASE_URL}/client/assignments/`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error("Failed to fetch assignments");
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching client assignments:", error);
    throw error;
  }
}
