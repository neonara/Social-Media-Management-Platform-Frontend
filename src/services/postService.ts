"use server";

import { API_BASE_URL } from "@/config/api";
import { DraftPost, ScheduledPost } from "@/types/post";
import { GetUser } from "@/types/user";
import { cookies } from "next/headers";

interface Creator extends Partial<GetUser> {
  id: number;
  full_name: string;
  type: "client" | "team_member";
}

export type CalendarView = "week" | "month" | "quarter" | "year";
export type ActiveTab = "calendar" | "post_table";

export type PendingRejection = {
  postId: number;
  postTitle: string;
};

// Simple workflow interfaces
export interface ClientApprovalRequest {
  postId: number;
  action: "approve" | "reject";
  feedback?: string;
}

export interface ModeratorValidationRequest {
  postId: number;
  action: "validate" | "reject";
  overrideClient?: boolean; // Skip client approval step
  feedback?: string;
}

export interface ActionResponse {
  success: boolean;
  message: string;
  post?: ScheduledPost;
  error?: string;
}

export interface RejectedPostWithFeedback extends ScheduledPost {
  rejection_feedback?: string;
  rejected_at?: string;
  rejected_by?: GetUser;
}

async function getAuthToken() {
  const cookieStore = await cookies();
  const token = cookieStore.get("access_token")?.value;
  if (!token) {
    throw new Error("Authentication required");
  }
  return token;
}

// In your postService.ts
export async function getAssignedClients(): Promise<
  Array<{ id: number; name: string; email: string }>
> {
  try {
    const token = await getAuthToken();
    const csrfToken = await getCsrfToken();

    const response = await fetch(`${API_BASE_URL}/clients/assigned/`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "X-CSRFToken": csrfToken,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch assigned clients");
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching assigned clients:", error);
    throw error;
  }
}

// Fetch all clients for admin/super admin (for calendar filtering)
export async function getAllClientsForAdmin(): Promise<{
  clients: Array<{
    id: number;
    full_name: string;
    email: string;
    phone_number?: string;
    user_image?: string;
  }>;
  moderators: Array<{
    id: number;
    full_name: string;
    email: string;
    phone_number?: string;
    user_image?: string;
  }>;
  community_managers: Array<{
    id: number;
    full_name: string;
    email: string;
    phone_number?: string;
    user_image?: string;
  }>;
}> {
  try {
    // Import the existing function dynamically to avoid server/client issues
    const { fetchAllUsersServer } = await import("@/services/userService");

    const result = await fetchAllUsersServer();

    if ("error" in result) {
      throw new Error(result.error);
    }

    // Filter users by role on the client side
    const clients = result.filter((user) => user.role === "client");
    const moderators = result.filter((user) => user.role === "moderator");
    const community_managers = result.filter(
      (user) => user.role === "community_manager",
    );

    return {
      clients,
      moderators,
      community_managers,
    };
  } catch (error) {
    console.error("Error fetching all clients and staff:", error);
    throw error;
  }
}

export async function rejectPost(
  postId: number,
  feedback?: string,
): Promise<ActionResponse> {
  try {
    const token = await getAuthToken();
    const csrfToken = await getCsrfToken();

    const requestBody: Record<string, string> = {
      rejected_at: new Date().toISOString(),
    };

    // Only include feedback if provided
    if (feedback && feedback.trim().length > 0) {
      requestBody.feedback = feedback.trim();
    }

    const response = await fetch(
      `${API_BASE_URL}/content/posts/${postId}/reject/`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "X-CSRFToken": csrfToken,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      },
    );

    if (!response.ok) {
      const errorData = await response.json();
      return {
        success: false,
        message: errorData.message || "Failed to reject post",
        error: errorData.message || "Failed to reject post",
      };
    }

    const post = await response.json();
    return {
      success: true,
      message: "Post rejected with feedback",
      post,
    };
  } catch (error) {
    console.error("Error rejecting post:", error);
    return {
      success: false,
      message: "Network error occurred while rejecting post",
      error: error instanceof Error ? error.message : "Network error",
    };
  }
}

// Moderator validation workflow - handles both validation and rejection
export async function validatePost(
  validationRequest: ModeratorValidationRequest,
): Promise<ActionResponse> {
  const {
    postId,
    action,
    overrideClient = false,
    feedback,
  } = validationRequest;

  try {
    if (action === "validate") {
      return await moderatorValidatePost(postId, overrideClient);
    } else if (action === "reject") {
      // Feedback is optional for rejection
      return await rejectPost(postId, feedback);
    } else {
      return {
        success: false,
        message: "Invalid validation action. Must be 'validate' or 'reject'",
        error: "Invalid validation action",
      };
    }
  } catch (error) {
    console.error("Error in post validation workflow:", error);
    return {
      success: false,
      message: "Network error occurred during post validation",
      error: error instanceof Error ? error.message : "Network error",
    };
  }
}

// New function for moderator validation that changes status to scheduled
export async function moderatorValidatePost(
  postId: number,
  overrideClient: boolean = false,
): Promise<ActionResponse> {
  try {
    const token = await getAuthToken();
    const csrfToken = await getCsrfToken();

    const response = await fetch(
      `${API_BASE_URL}/content/posts/${postId}/validate/`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "X-CSRFToken": csrfToken,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          moderator_validated_at: new Date().toISOString(),
          override_client: overrideClient,
        }),
      },
    );

    if (!response.ok) {
      const errorData = await response.json();
      return {
        success: false,
        message: errorData.message || "Failed to validate post",
        error: errorData.message || "Failed to validate post",
      };
    }

    const post = await response.json();
    return {
      success: true,
      message: overrideClient
        ? "Post validated and scheduled (client approval overridden)"
        : "Post validated and scheduled",
      post,
    };
  } catch (error) {
    console.error("Error in moderator validation:", error);
    return {
      success: false,
      message: "Network error occurred while validating post",
      error: error instanceof Error ? error.message : "Network error",
    };
  }
}

// Client approval functions
export async function approvePost(postId: number): Promise<ActionResponse> {
  try {
    const token = await getAuthToken();
    const csrfToken = await getCsrfToken();

    const response = await fetch(
      `${API_BASE_URL}/content/posts/${postId}/approve/`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "X-CSRFToken": csrfToken,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          client_approved_at: new Date().toISOString(),
        }),
      },
    );

    if (!response.ok) {
      const errorData = await response.json();
      return {
        success: false,
        message: errorData.message || "Failed to approve post",
        error: errorData.message || "Failed to approve post",
      };
    }

    const post = await response.json();
    return {
      success: true,
      message: "Post approved by client successfully",
      post,
    };
  } catch (error) {
    console.error("Error in client approval:", error);
    return {
      success: false,
      message: "Network error occurred while approving post",
      error: error instanceof Error ? error.message : "Network error",
    };
  }
}

export async function clientRejectPost(
  postId: number,
  feedback?: string,
): Promise<ActionResponse> {
  try {
    const token = await getAuthToken();
    const csrfToken = await getCsrfToken();

    const requestBody: Record<string, unknown> = {
      client_rejected_at: new Date().toISOString(),
    };

    // Only include feedback if provided
    if (feedback && feedback.trim().length > 0) {
      requestBody.feedback = feedback.trim();
    }

    const response = await fetch(
      `${API_BASE_URL}/content/posts/${postId}/reject/`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "X-CSRFToken": csrfToken,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      },
    );

    if (!response.ok) {
      const errorData = await response.json();
      return {
        success: false,
        message: errorData.message || "Failed to reject post",
        error: errorData.message || "Failed to reject post",
      };
    }

    const post = await response.json();
    return {
      success: true,
      message: feedback
        ? "Post rejected by client with feedback"
        : "Post rejected by client",
      post,
    };
  } catch (error) {
    console.error("Error in client rejection:", error);
    return {
      success: false,
      message: "Network error occurred while rejecting post",
      error: error instanceof Error ? error.message : "Network error",
    };
  }
}

// Client approval workflow - handles both approval and rejection
export async function handleClientApproval(
  approvalRequest: ClientApprovalRequest,
): Promise<ActionResponse> {
  const { postId, action, feedback } = approvalRequest;

  try {
    if (action === "approve") {
      return await approvePost(postId);
    } else if (action === "reject") {
      // Feedback is optional for client rejection
      return await clientRejectPost(postId, feedback);
    } else {
      return {
        success: false,
        message: "Invalid client action. Must be 'approve' or 'reject'",
        error: "Invalid client action",
      };
    }
  } catch (error) {
    console.error("Error in client approval workflow:", error);
    return {
      success: false,
      message: "Network error occurred during client approval workflow",
      error: error instanceof Error ? error.message : "Network error",
    };
  }
}

// Fetch rejected posts with their feedback
export async function getRejectedPostsWithFeedback(): Promise<
  RejectedPostWithFeedback[]
> {
  try {
    const token = await getAuthToken();
    const csrfToken = await getCsrfToken();

    const response = await fetch(`${API_BASE_URL}/content/posts/rejected/`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "X-CSRFToken": csrfToken,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      console.error("Failed to fetch rejected posts:", response.status);
      return [];
    }

    const data: RejectedPostWithFeedback[] = await response.json();
    return data.map((post) => ({
      ...post,
      scheduled_for: post.scheduled_for
        ? new Date(post.scheduled_for).toISOString()
        : "",
      rejected_at: post.rejected_at
        ? new Date(post.rejected_at).toISOString()
        : undefined,
    }));
  } catch (error: unknown) {
    console.error("Error fetching rejected posts with feedback:", error);
    return [];
  }
}

// Get specific post with feedback (useful for rejected posts)
export async function getPostWithFeedback(
  postId: number,
): Promise<RejectedPostWithFeedback | null> {
  try {
    const token = await getAuthToken();
    const csrfToken = await getCsrfToken();

    const response = await fetch(
      `${API_BASE_URL}/content/posts/${postId}/feedback/`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "X-CSRFToken": csrfToken,
        },
        cache: "no-store",
      },
    );

    if (!response.ok) {
      console.error(
        "Failed to fetch post with feedback:",
        response.status,
        await response.text(),
      );
      return null;
    }

    const data = await response.json();
    return {
      ...data,
      scheduled_for: data.scheduled_for
        ? new Date(data.scheduled_for).toISOString()
        : "",
      rejected_at: data.rejected_at
        ? new Date(data.rejected_at).toISOString()
        : undefined,
    };
  } catch (error: unknown) {
    console.error("Error fetching post with feedback:", error);
    return null;
  }
}

export async function updatePostToDraft(
  postId: number,
  formData: FormData,
): Promise<{
  success: boolean;
  data?: DraftPost;
  error?: string;
}> {
  try {
    const token = await getAuthToken();
    const csrfToken = await getCsrfToken();

    const response = await fetch(
      `${API_BASE_URL}/content/posts/${postId}/update-to-draft/`,
      {
        method: "PATCH",
        body: formData,
        headers: {
          Authorization: `Bearer ${token}`,
          "X-CSRFToken": csrfToken,
        },
      },
    );

    if (!response.ok) {
      const errorData = await response.json();
      return {
        success: false,
        error: errorData.message || "Failed to update post to draft",
      };
    }

    const data: DraftPost = await response.json();
    return { success: true, data };
  } catch (error: unknown) {
    console.error("Error updating post to draft:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Network error",
    };
  }
}

async function getCsrfToken() {
  const cookieStore = await cookies();
  return cookieStore.get("csrftoken")?.value || "";
}

export async function createPost(formData: FormData) {
  try {
    const token = await getAuthToken();
    const csrfToken = await getCsrfToken();

    // Log the form data content
    console.log("Sending post data:", {
      title: formData.get("title"),
      description: formData.get("description"),
      platforms: formData.getAll("platforms"),
      status: formData.get("status"),
      scheduled_for: formData.get("scheduled_for"),
      client_id: formData.get("client_id"),
    });

    const response = await fetch(`${API_BASE_URL}/content/posts/create/`, {
      method: "POST",
      body: formData,
      headers: {
        Authorization: `Bearer ${token}`,
        "X-CSRFToken": csrfToken,
      },
    });

    if (!response.ok) {
      console.log("Post creation failed with status:", response.status);
      // Try to get detailed error response
      const responseText = await response.text();
      console.log("Error response text:", responseText);

      let errorData: Record<string, unknown> = {};
      try {
        errorData = JSON.parse(responseText);
      } catch {
        console.log("Could not parse error response as JSON");
      }
      return {
        success: false,
        error: errorData.message || "Failed to create post",
      };
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error: unknown) {
    console.error("Error creating post:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Network error",
    };
  }
}

export async function getScheduledPosts() {
  try {
    const token = await getAuthToken();
    const csrfToken = await getCsrfToken();

    const response = await fetch(`${API_BASE_URL}/content/posts/`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "X-CSRFToken": csrfToken,
      },
      cache: "no-store",
    });

    if (!response.ok) throw new Error("Failed to fetch posts");

    const posts: ScheduledPost[] = await response.json();
    const now = new Date();

    return posts.map((post) => ({
      ...post,
      platform: mapPlatform(post.platform),
      status:
        new Date(post.scheduled_for) < now
          ? "published"
          : post.status || "scheduled",
      creator: post.creator
        ? {
            id: (post.creator as Creator).id || "unknown",
            full_name: (post.creator as Creator).full_name || "Unknown",
            type: (post.creator as Creator).type || "team_member",
          }
        : {
            id: "unknown",
            full_name: "Unknown",
            type: "team_member",
          },
      client: post.client
        ? {
            id: post.client.id || "unknown",
            full_name: post.client.full_name || "Unknown",
          }
        : {
            id: "unknown",
            full_name: "Unknown",
          },
    }));
  } catch (error) {
    console.error("Error fetching posts:", error);
    return [];
  }
}

// Helper function to map platform names
function mapPlatform(
  platform: string | undefined,
): "Facebook" | "Instagram" | "LinkedIn" {
  if (!platform) {
    console.warn("Platform is undefined, defaulting to 'Facebook'");
    return "Facebook"; // Default to Facebook if platform is undefined
  }

  const platformMap: Record<string, "Facebook" | "Instagram" | "LinkedIn"> = {
    facebook: "Facebook",
    instagram: "Instagram",
    linkedin: "LinkedIn",
  };

  return platformMap[platform.toLowerCase()] || "Facebook"; // Default to Facebook if unknown
}

export async function getDraftPosts(): Promise<DraftPost[]> {
  try {
    const token = await getAuthToken();
    const csrfToken = await getCsrfToken();

    const response = await fetch(`${API_BASE_URL}/content/posts/drafts/`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "X-CSRFToken": csrfToken,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      console.error("Failed to fetch draft posts:", response.status);
      return [];
    }

    const data: DraftPost[] = await response.json();
    return data.map((post) => ({
      ...post,
      scheduled_for: post.scheduled_for
        ? new Date(post.scheduled_for).toISOString()
        : null,
      media: post.media.map((mediaItem) => ({
        ...mediaItem,
        uploaded_at: new Date(mediaItem.uploaded_at).toISOString(),
      })),
    }));
  } catch (error: unknown) {
    console.error("Error fetching draft posts:", error);
    return [];
  }
}

export async function saveDraft(formData: FormData): Promise<{
  success: boolean;
  data?: DraftPost;
  error?: string;
}> {
  try {
    const token = await getAuthToken();
    const csrfToken = await getCsrfToken();

    const response = await fetch(`${API_BASE_URL}/content/posts/save-draft/`, {
      method: "POST",
      body: formData,
      headers: {
        Authorization: `Bearer ${token}`,
        "X-CSRFToken": csrfToken,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      // Try to get error message, fallback to status text
      const errorData = await response.json().catch(() => ({
        message: response.statusText,
      }));
      return {
        success: false,
        error: errorData.message || "Failed to save draft",
      };
    }

    const responseData: DraftPost = await response.json();
    return {
      success: true,
      data: JSON.parse(JSON.stringify(responseData)), // Force serialization
    };
  } catch (error: unknown) {
    console.error("Error saving draft:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to save draft",
    };
  }
}

export async function getPostById(postId: number): Promise<DraftPost | null> {
  try {
    const token = await getAuthToken();
    const csrfToken = await getCsrfToken();

    const response = await fetch(`${API_BASE_URL}/content/posts/${postId}/`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "X-CSRFToken": csrfToken,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      console.error(
        "Failed to fetch post:",
        response.status,
        await response.text(),
      );
      return null;
    }

    const data = await response.json();
    return JSON.parse(
      JSON.stringify({
        ...data,
        scheduled_for: data.scheduled_for
          ? new Date(data.scheduled_for).toISOString()
          : null,
        media: data.media.map((mediaItem: { uploaded_at: string }) => ({
          ...mediaItem,
          uploaded_at: new Date(mediaItem.uploaded_at).toISOString(),
        })),
      }),
    );
  } catch (error: unknown) {
    console.error("Error fetching post by ID:", error);
    return null;
  }
}

export async function updatePost(
  postId: number,
  formData: FormData,
): Promise<Response> {
  try {
    const token = await getAuthToken();
    const csrfToken = await getCsrfToken();

    const response = await fetch(`${API_BASE_URL}/content/posts/${postId}/`, {
      method: "PATCH",
      body: formData,
      headers: {
        Authorization: `Bearer ${token}`,
        "X-CSRFToken": csrfToken,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Failed to update post");
    }

    return response;
  } catch (error) {
    console.error("Error updating post:", error);
    throw error;
  }
}

export async function getScheduledAndPublishedPosts(): Promise<
  ScheduledPost[]
> {
  try {
    const token = await getAuthToken();
    const csrfToken = await getCsrfToken();

    const response = await fetch(`${API_BASE_URL}/posts/scheduled/`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "X-CSRFToken": csrfToken,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      console.error(
        "Failed to fetch scheduled posts:",
        response.status,
        await response.text(),
      );
      throw new Error("Failed to fetch scheduled posts");
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching scheduled posts:", error);
    return [];
  }
}

export async function deletePost(postId: number): Promise<void> {
  try {
    const token = await getAuthToken();
    const csrfToken = await getCsrfToken();

    const response = await fetch(
      `${API_BASE_URL}/content/posts/${postId}/delete/`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "X-CSRFToken": csrfToken,
        },
        cache: "no-store",
      },
    );

    if (!response.ok) {
      console.error(
        "Failed to delete post:",
        response.status,
        await response.text(),
      );
      throw new Error("Failed to delete post");
    }
  } catch (error) {
    console.error("Error deleting post:", error);
    throw error;
  }
}

export async function publishPost(postId: number): Promise<void> {
  try {
    const token = await getAuthToken();
    const csrfToken = await getCsrfToken();

    const response = await fetch(
      `${API_BASE_URL}/content/posts/${postId}/publish/`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "X-CSRFToken": csrfToken,
        },
      },
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Failed to publish post");
    }
  } catch (error) {
    console.error("Error publishing post:", error);
    throw error;
  }
}

export async function resubmitPost(postId: number): Promise<void> {
  try {
    const token = await getAuthToken();
    const csrfToken = await getCsrfToken();

    const response = await fetch(
      `${API_BASE_URL}/content/posts/${postId}/resubmit/`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "X-CSRFToken": csrfToken,
        },
      },
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Failed to resubmit post");
    }
  } catch (error) {
    console.error("Error resubmitting post:", error);
    throw error;
  }
}

export async function cancelApproval(
  postId: number,
  feedback?: string,
): Promise<ActionResponse> {
  try {
    const token = await getAuthToken();
    const csrfToken = await getCsrfToken();

    const requestBody: Record<string, string> = {};

    // Include feedback if provided, otherwise use default
    if (feedback && feedback.trim().length > 0) {
      requestBody.feedback = feedback.trim();
    } else {
      requestBody.feedback = "Approval cancelled";
    }

    const response = await fetch(
      `${API_BASE_URL}/content/posts/${postId}/cancel-approval/`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "X-CSRFToken": csrfToken,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      },
    );

    if (!response.ok) {
      const errorData = await response.json();
      return {
        success: false,
        message:
          errorData.error || errorData.message || "Failed to cancel approval",
        error:
          errorData.error || errorData.message || "Failed to cancel approval",
      };
    }

    const data = await response.json();
    return {
      success: true,
      message: data.message || "Post approval cancelled successfully",
      post: data.post,
    };
  } catch (error) {
    console.error("Error cancelling approval:", error);
    return {
      success: false,
      message: "Network error occurred while cancelling approval",
      error: error instanceof Error ? error.message : "Network error",
    };
  }
}
