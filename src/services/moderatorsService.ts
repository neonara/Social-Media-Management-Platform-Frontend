"use server";

import { API_BASE_URL } from "@/config/api";
import { GetUser } from "@/types/user";
import { cookies } from "next/headers";


type CreateUserData = {
  email: string;
};

type Client = {
  id: number;
  full_name: string;
  // ... other client properties as needed
};

 export async function getAssignedCommunityManagers(): Promise<GetUser[] | { error: string }> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("access_token")?.value;

    if (!token) {
      return { error: "Authentication required" };
    }

    const response = await fetch(`${API_BASE_URL}/moderators/assigned-cms/`, {
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

export async function createCM(data: CreateUserData) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("access_token")?.value;

    if (!token) {
      return { error: "Authentication required" };
    }

    const response = await fetch(`${API_BASE_URL}/moderators/createCM/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
      cache: "no-store",
    });

    if (!response.ok) {
      const errorData = await response.json();
      return { error: errorData.message || "Failed to create user" };
    }

    return { success: true };
  } catch (error) {
    console.error("Create user error:", error);
    return { error: "An error occurred while creating user" };
  }
}

// Function to fetch clients
export async function getClients(): Promise<Client[] | { error: string }> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("access_token")?.value;

    if (!token) {
      return { error: "Authentication required" };
    }

    const response = await fetch(`${API_BASE_URL}/moderators/assignedClients/`, { // <--- ADDED THE FORWARD SLASH
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      const message = `Error fetching clients: ${response.statusText}`;
      console.error(message);
      return { error: message };
    }

    const data = await response.json();
    return data as Client[];
  } catch (error) {
    console.error("Error fetching clients:", error);
    return { error: "Failed to fetch clients" };
  }
}

// Function to assign a community manager to a client
export async function assignCommunityManagerToClient(cmId: number, clientId: number): Promise<{ success: boolean } | { error: string }> {
  try {
    const cookieStore = await cookies(); // Get cookies from the server context
    const token = cookieStore.get("access_token")?.value;

    if (!token) {
      return { error: "Authentication required" };
    }

    // Adjust the API endpoint to match the Django URL you defined
    const response = await fetch(`${API_BASE_URL}/clients/${clientId}/assign-cm/`, {
      method: "PUT", // Or "POST" depending on your Django URL configuration
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ cm_id: cmId }), // Send the CM ID in the request body
      cache: "no-store",
    });

    if (!response.ok) {
      const errorData = await response.json();
      const message = `Error assigning CM to client: ${response.status} - ${errorData?.error || response.statusText}`;
      console.error(message);
      return { error: message };
    }

    return { success: true };
  } catch (error) {
    console.error("Error assigning CM to client:", error);
    return { error: "Failed to assign community manager to client" };
  }
}