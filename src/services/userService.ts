"use server";

import { API_BASE_URL } from "@/config/api";
import { GetUser, UpdateUser } from "@/types/user";
import { cookies } from "next/headers";

// Get all users (this can be customized for different roles, etc.)
export async function getUsers(bypassCache: boolean = false) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("access_token")?.value;

    if (!token) {
      return { error: "Authentication required" };
    }

    const headers: HeadersInit = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };

    // Add cache control headers if we want to bypass cache
    if (bypassCache) {
      headers["Cache-Control"] = "no-cache, no-store, must-revalidate";
      headers["Pragma"] = "no-cache";
    }

    const response = await fetch(`${API_BASE_URL}/users/`, {
      method: "GET",
      headers,
      // Only set cache: 'no-store' when bypassing cache
      cache: bypassCache ? "no-store" : "default",
      next: bypassCache ? { revalidate: 0 } : undefined,
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
export async function getUserById(id: number, bypassCache: boolean = false) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("access_token")?.value;

    if (!token) {
      return { error: "Authentication required" };
    }

    const headers: HeadersInit = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };

    // Add cache control headers if we want to bypass cache
    if (bypassCache) {
      headers["Cache-Control"] = "no-cache, no-store, must-revalidate";
      headers["Pragma"] = "no-cache";
    }

    const response = await fetch(`${API_BASE_URL}/user/${id}`, {
      method: "GET",
      headers,
      // Only set cache: 'no-store' when bypassing cache
      cache: bypassCache ? "no-store" : "default",
      next: bypassCache ? { revalidate: 0 } : undefined,
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

// Update user profile (handles both text fields and image files using FormData)
export async function updateUserProfile(
  id: number,
  userData: UpdateUser,
  imageFile?: File,
) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("access_token")?.value;

    if (!token) {
      return { error: "Authentication required" };
    }

    console.log(
      "Updating user profile data for ID:",
      id,
      "with data:",
      JSON.stringify(userData),
    );

    // Create FormData for multipart/form-data
    const formData = new FormData();

    // Add text fields to FormData
    if (userData.first_name) {
      formData.append("first_name", userData.first_name);
    }
    if (userData.last_name) {
      formData.append("last_name", userData.last_name);
    }
    if (userData.email) {
      formData.append("email", userData.email);
    }
    if (userData.phone_number) {
      formData.append("phone_number", userData.phone_number);
    }

    // Add image file if provided
    if (imageFile) {
      formData.append("user_image", imageFile);
    }

    const response = await fetch(`${API_BASE_URL}/users/update/${id}/`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        // Don't set Content-Type - let the browser set it for multipart/form-data
      },
      body: formData,
      cache: "no-store",
    });

    if (!response.ok) {
      const errorData = await response.json();
      return { error: errorData.message || `Error: ${response.statusText}` };
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error updating user profile:", error);
    return { error: "Failed to update user profile" };
  }
}

export async function getCurrentUser(bypassCache: boolean = false) {
  const cookieStore = await cookies();
  const token = cookieStore.get("access_token")?.value;

  // Return early if no valid token is found
  if (!token) {
    return null; // Explicitly return null to indicate no user is logged in
  }

  try {
    const headers: HeadersInit = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };

    // Add cache control headers if we want to bypass cache
    if (bypassCache) {
      headers["Cache-Control"] = "no-cache, no-store, must-revalidate";
      headers["Pragma"] = "no-cache";
    }

    const response = await fetch(`${API_BASE_URL}/user/profile/`, {
      credentials: "include",
      method: "GET",
      headers,
      // Only set cache: 'no-store' when bypassing cache
      cache: bypassCache ? "no-store" : "default",
      next: bypassCache ? { revalidate: 0 } : undefined,
    });

    let data;
    try {
      data = await response.json();
    } catch (error) {
      console.error("Error parsing response JSON:", error);
      return { error: "Failed to parse response JSON" };
    }

    if (!response.ok) {
      console.error("Error response details:", {
        status: response.status,
        statusText: response.statusText,
        errorData: data,
      });

      if (response.status === 401 || response.status === 403) {
        return { error: "Token expired" };
      }

      return { error: `Error: ${response.statusText}` };
    }

    return data;
  } catch (error) {
    console.error("Error getting user profile:", error);
    // Return error object instead of throwing to prevent UI crashes
    return { error: "Network error while fetching user profile" };
  }
}

export async function fetchAllUsersServer(bypassCache: boolean = false) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("access_token")?.value;

    if (!token) {
      return { error: "Authentication required" };
    }

    const headers: HeadersInit = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };

    // Add cache control headers if we want to bypass cache
    if (bypassCache) {
      headers["Cache-Control"] = "no-cache, no-store, must-revalidate";
      headers["Pragma"] = "no-cache";
    }

    const response = await fetch(`${API_BASE_URL}/users/`, {
      headers,
      // Only set cache: 'no-store' when bypassing cache
      cache: bypassCache ? "no-store" : "default",
      next: bypassCache ? { revalidate: 0 } : undefined,
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

export async function deleteUserServer(
  userId: number,
): Promise<boolean | { error: string }> {
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

    const res = await fetch(
      `${API_BASE_URL}/clients/${clientId}/moderator/remove/`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );
    if (!res.ok) {
      console.error(
        `Error removing moderator for client ${clientId}: ${res.statusText}`,
      );
      return { error: `Failed to remove moderator for client ${clientId}` };
    }
    return { success: true };
  } catch (error) {
    console.error("Error removing moderator:", error);
    return { error: "Failed to remove moderator" };
  }
}

export async function assignModeratorServer(
  clientId: number,
  moderatorId: number,
) {
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
      console.error(
        `Error assigning moderator ${moderatorId} to client ${clientId}: ${res.statusText}`,
      );
      return { error: `Failed to assign moderator to client ${clientId}` };
    }
    return { success: true };
  } catch (error) {
    console.error("Error assigning moderator:", error);
    return { error: "Failed to assign moderator" };
  }
}

export async function removeCommunityManagerServer(
  moderatorId: number,
  cmIdToRemove: number,
) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("access_token")?.value;

    if (!token) {
      return { error: "Authentication required" };
    }

    const res = await fetch(
      `${API_BASE_URL}/moderators/${moderatorId}/community-manager/${cmIdToRemove}/remove/`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );
    if (!res.ok) {
      console.error(
        `Error removing CM ${cmIdToRemove} for moderator ${moderatorId}: ${res.statusText}`,
      );
      return { error: `Failed to remove CM for moderator ${moderatorId}` };
    }
    return { success: true };
  } catch (error) {
    console.error("Error removing community manager:", error);
    return { error: "Failed to remove community manager" };
  }
}

export async function assignCommunityManagerServer(
  moderatorId: number,
  cmId: number,
) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("access_token")?.value;

    if (!token) {
      return { error: "Authentication required" };
    }

    const res = await fetch(
      `${API_BASE_URL}/moderators/${moderatorId}/community-manager/`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ cm_id: cmId }),
      },
    );
    if (!res.ok) {
      console.error(
        `Error assigning CM ${cmId} to moderator ${moderatorId}: ${res.statusText}`,
      );
      return { error: `Failed to assign CM to moderator ${moderatorId}` };
    }
    return { success: true };
  } catch (error) {
    console.error("Error assigning community manager:", error);
    return { error: "Failed to assign community manager" };
  }
}

export async function assignCMToClientServerAction(
  clientId: number,
  cmId: number,
) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("access_token")?.value;

    if (!token) {
      return { error: "Authentication required" };
    }

    const response = await fetch(
      `${API_BASE_URL}/clients/${clientId}/assign-cm/`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ cm_id: cmId }),
      },
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error(
        `Error assigning CM ${cmId} to client ${clientId}:`,
        errorData,
      );
      return {
        error: errorData.message || `Failed to assign CM to client ${clientId}`,
      };
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    console.error("Error assigning community manager to client:", error);
    return { error: "Failed to assign community manager to client" };
  }
}

export async function getClientAssignedCommunityManagersServerAction(
  clientId: number,
): Promise<GetUser[] | { error: string }> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("access_token")?.value;

    if (!token) {
      return { error: "Authentication required" };
    }

    const response = await fetch(
      `${API_BASE_URL}/clients/${clientId}/assigned-cms/`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
      },
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error(
        `Error fetching assigned CMs for client ${clientId}:`,
        errorData,
      );
      return {
        error:
          errorData.message ||
          `Failed to fetch assigned CMs for client ${clientId}`,
      };
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
  communityManagerIdToRemove: number,
): Promise<{
  success?: boolean;
  error?: string;
  data?: Record<string, unknown>;
}> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("access_token")?.value;

    if (!token) {
      return { error: "Authentication required" };
    }

    const response = await fetch(
      `${API_BASE_URL}/clients/${clientId}/community-managers/remove/`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          community_manager_ids: [communityManagerIdToRemove],
        }),
        cache: "no-store",
      },
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error(
        `Error removing CM ${communityManagerIdToRemove} from client ${clientId}:`,
        errorData,
      );
      return {
        error:
          errorData.message || `Failed to remove CM from client ${clientId}`,
      };
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    console.error(
      `Error removing CM ${communityManagerIdToRemove} from client ${clientId}:`,
      error,
    );
    return { error: "Failed to remove CM from client" };
  }
}

// Delete user profile image
export async function deleteProfileImage() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("access_token")?.value;

    if (!token) {
      return { error: "Authentication required" };
    }

    // First get the current user to get the ID and data
    const user = await getCurrentUser(true);

    if (!user || "error" in user) {
      return { error: "Failed to get current user data" };
    }

    console.log("Deleting profile image for user:", user.id);

    // Create FormData with a special flag to delete the image
    const formData = new FormData();
    formData.append("delete_image", "true");

    // Send the request to delete the image
    const response = await fetch(`${API_BASE_URL}/users/update/${user.id}/`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      return { error: errorData.message || "Failed to delete profile image" };
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error deleting profile image:", error);
    return { error: "Failed to delete profile image" };
  }
}
