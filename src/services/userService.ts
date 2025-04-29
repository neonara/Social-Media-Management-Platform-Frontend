"use server";

import { API_BASE_URL } from "@/config/api";
import { GetUser } from "@/types/user";
import { cookies } from "next/headers";

// Get all users (this can be customized for different roles, etc.)
export async function getUsers() {
  try {
    const cookieStore = await cookies();
    const token = (await cookieStore).get("access_token")?.value;

    if (!token) {
      return { error: "Authentication required" };
    }

    const response = await fetch(`${API_BASE_URL}/users/`, {
      method: "GET",
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
    console.error("Error fetching users:", error);
    throw error;
  }
}

// Get a single user by ID
export async function getUserById(id: number) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("access_token")?.value;

    if (!token) {
      return { error: "Authentication required" };
    }

    const response = await fetch(`${API_BASE_URL}/user/${id}`, {
      method: "GET",
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
    console.error("Error fetching user by ID:", error);
    throw error;
  }
}

// Update user profile
export async function updateUserProfile(id: number, userData: GetUser) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("access_token")?.value;

    if (!token) {
      return { error: "Authentication required" };
    }

    const response = await fetch(`${API_BASE_URL}/users/update/${id}/`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(userData),
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`Error: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error updating user profile:", error);
    throw error;
  }
}

export async function getCurrentUser() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("access_token")?.value;
    if (!token) {
      return { error: "Authentication required" };
    }

    const response = await fetch(`${API_BASE_URL}/user/profile/`, {
      credentials: "include",
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Error: ${response.statusText}`);
    }

    const data = await response.json();
    console.log("profile: ", data);
    return data;
  } catch (error) {
    console.error("Error getting user profile:", error);
    throw error;
  }
}

export async function fetchAllUsersServer(): Promise<GetUser[] | { error: string }> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("access_token")?.value;

    if (!token) {
      return { error: "Authentication required" };
    }

    const response = await fetch(`${API_BASE_URL}/users/`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      const message = `An error occurred: ${response.status}`;
      console.error("Error fetching users:", message);
      return { error: message };
    }

    const data = await response.json();
    return data as GetUser[];
  } catch (error) {
    console.error("Error fetching users:", error);
    return { error: "Failed to fetch users" };
  }
}

export async function deleteUserServer(userId: number): Promise<boolean | { error: string }> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("access_token")?.value;

    if (!token) {
      return { error: "Authentication required" };
    }

    const res = await fetch(`${API_BASE_URL}/users/delete/${userId}/`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      const message = `An error occurred: ${res.status}`;
      console.error(`Error deleting user ${userId}:`, message);
      return { error: message };
    }

    return true;
  } catch (err) {
    console.error(`Error deleting user ${userId}:`, err);
    return { error: "Failed to delete user" };
  }
}

export async function removeModeratorServer(clientId: number) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("access_token")?.value;

    if (!token) {
      return { error: "Authentication required" };
    }

    const res = await fetch(`${API_BASE_URL}/clients/${clientId}/moderator/remove/`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (!res.ok) {
      console.error(`Error removing moderator for client ${clientId}: ${res.statusText}`);
      return { error: `Failed to remove moderator for client ${clientId}` };
    }
    return { success: true };
  } catch (error) {
    console.error("Error removing moderator:", error);
    return { error: "Failed to remove moderator" };
  }
}

export async function assignModeratorServer(clientId: number, moderatorId: number) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("access_token")?.value;

    if (!token) {
      return { error: "Authentication required" };
    }

    const res = await fetch(`${API_BASE_URL}/clients/${clientId}/moderator/`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ moderator_id: moderatorId }),
    });
    if (!res.ok) {
      console.error(`Error assigning moderator ${moderatorId} to client ${clientId}: ${res.statusText}`);
      return { error: `Failed to assign moderator to client ${clientId}` };
    }
    return { success: true };
  } catch (error) {
    console.error("Error assigning moderator:", error);
    return { error: "Failed to assign moderator" };
  }
}

export async function removeCommunityManagerServer(moderatorId: number, cmIdToRemove: number) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("access_token")?.value;

    if (!token) {
      return { error: "Authentication required" };
    }

    const res = await fetch(`${API_BASE_URL}/moderators/${moderatorId}/community-manager/${cmIdToRemove}/remove/`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (!res.ok) {
      console.error(`Error removing CM ${cmIdToRemove} for moderator ${moderatorId}: ${res.statusText}`);
      return { error: `Failed to remove CM for moderator ${moderatorId}` };
    }
    return { success: true };
  } catch (error) {
    console.error("Error removing community manager:", error);
    return { error: "Failed to remove community manager" };
  }
}

export async function assignCommunityManagerServer(moderatorId: number, cmId: number) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("access_token")?.value;

    if (!token) {
      return { error: "Authentication required" };
    }

    const res = await fetch(`${API_BASE_URL}/moderators/${moderatorId}/community-manager/`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ cm_id: cmId }),
    });
    if (!res.ok) {
      console.error(`Error assigning CM ${cmId} to moderator ${moderatorId}: ${res.statusText}`);
      return { error: `Failed to assign CM to moderator ${moderatorId}` };
    }
    return { success: true };
  } catch (error) {
    console.error("Error assigning community manager:", error);
    return { error: "Failed to assign community manager" };
  }
}

export async function assignCMToClientServerAction(clientId: number, cmId: number) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("access_token")?.value;

    if (!token) {
      return { error: "Authentication required" };
    }

    const response = await fetch(`${API_BASE_URL}/clients/${clientId}/assign-cm/`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ cm_id: cmId }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error(`Error assigning CM ${cmId} to client ${clientId}:`, errorData);
      return { error: errorData.message || `Failed to assign CM to client ${clientId}` };
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    console.error("Error assigning community manager to client:", error);
    return { error: "Failed to assign community manager to client" };
  }
}

export async function getClientAssignedCommunityManagersServerAction(
  clientId: number
): Promise<GetUser[] | { error: string }> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("access_token")?.value;

    if (!token) {
      return { error: "Authentication required" };
    }

    const response = await fetch(`${API_BASE_URL}/clients/${clientId}/assigned-cms/`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error(`Error fetching assigned CMs for client ${clientId}:`, errorData);
      return { error: errorData.message || `Failed to fetch assigned CMs for client ${clientId}` };
    }

    const data = await response.json();
    return data as GetUser[];
  } catch (error) {
    console.error(`Error fetching assigned CMs for client ${clientId}:`, error);
    return { error: "Failed to fetch assigned CMs for client" };
  }
}

export async function removeClientCommunityManagerServerAction(
  clientId: number,
  communityManagerIdToRemove: number
): Promise<{ success?: boolean; error?: string; data?: any }> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("access_token")?.value;

    if (!token) {
      return { error: "Authentication required" };
    }

    const response = await fetch(`${API_BASE_URL}/clients/${clientId}/community-managers/remove/`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ community_manager_ids: [communityManagerIdToRemove] }),
      cache: "no-store",
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error(
        `Error removing CM ${communityManagerIdToRemove} from client ${clientId}:`,
        errorData
      );
      return { error: errorData.message || `Failed to remove CM from client ${clientId}` };
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    console.error(
      `Error removing CM ${communityManagerIdToRemove} from client ${clientId}:`,
      error
    );
    return { error: "Failed to remove CM from client" };
  }
}
