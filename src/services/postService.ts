"use server";

import { API_BASE_URL } from "@/config/api";
import { cookies } from "next/headers";


export interface DraftPost {
    id: number;
    title: string;
    description: string;
    scheduled_for: string | null;
    creator_id: number;
    status: 'draft';
    platforms: string[];
    media: { id: number; file: string; name: string; uploaded_at: string; file_type: string }[];
    hashtags: string[];
}
interface Creator {
  id: string;
  full_name: string;
  type: 'client' | 'team_member';
}

interface Client {
  id: string;
  full_name: string;
}

interface ScheduledPost {
  id: string;
  title: string;
  platform: 'Facebook' | 'Instagram' | 'LinkedIn';
  scheduled_for: string;
  status?: 'published' | 'scheduled' | 'failed' | 'pending' | 'rejected';
  creator?: Creator;
  client?: Client | undefined;
}


// In your postService.ts
export async function getAssignedClients(): Promise<Array<{id: string, name: string, email: string}>> {
  try {
    const token = await getAuthToken();
    const csrfToken = await getCsrfToken();

    const response = await fetch(`${API_BASE_URL}/clients/assigned/`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'X-CSRFToken': csrfToken,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch assigned clients');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching assigned clients:', error);
    throw error;
  }
}

export async function approvePost(postId: number): Promise<void> {
    try {
      const token = await getAuthToken();
      const csrfToken = await getCsrfToken();
  
      const response = await fetch(`${API_BASE_URL}/content/posts/${postId}/approve/`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "X-CSRFToken": csrfToken,
        },
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to approve post");
      }
    } catch (error) {
      console.error("Error approving post:", error);
      throw error;
    }
  }
  
  export async function rejectPost(postId: number): Promise<void> {
    try {
      const token = await getAuthToken();
      const csrfToken = await getCsrfToken();
  
      const response = await fetch(`${API_BASE_URL}/content/posts/${postId}/reject/`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "X-CSRFToken": csrfToken,
        },
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to reject post");
      }
    } catch (error) {
      console.error("Error rejecting post:", error);
      throw error;
    }
  }

export async function updatePostToDraft(postId: number, formData: FormData): Promise<{
  success: boolean;
  data?: any;
  error?: string;
}> {
  try {
    const token = await getAuthToken();
    const csrfToken = await getCsrfToken();

    const response = await fetch(`${API_BASE_URL}/content/posts/${postId}/update-to-draft/`, {
      method: "PATCH",
      body: formData,
      headers: {
        Authorization: `Bearer ${token}`,
        "X-CSRFToken": csrfToken,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      return { success: false, error: errorData.message || "Failed to update post to draft" };
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    console.error("Error updating post to draft:", error);
    return { success: false, error: error instanceof Error ? error.message : "Network error" };
  }
}

async function getAuthToken() {
    const cookieStore = await cookies();
    const token = cookieStore.get("access_token")?.value;
    if (!token) {
        throw new Error("Authentication required");
    }
    return token;
}

async function getCsrfToken() {
    const cookieStore = await cookies();
    return cookieStore.get("csrftoken")?.value || "";
}

export async function createPost(formData: FormData): Promise<{success: boolean, data?: any, error?: string}> {
  try {
    const token = await getAuthToken();
    const csrfToken = await getCsrfToken();

    const response = await fetch(`${API_BASE_URL}/content/posts/create/`, {
      method: 'POST',
      body: formData,
      headers: {
        'Authorization': `Bearer ${token}`,
        'X-CSRFToken': csrfToken,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        error: errorData.message || 'Failed to create post'
      };
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error'
    };
  }
}

export async function getScheduledPosts(): Promise<ScheduledPost[]> {
  try {
    const token = await getAuthToken();
    const csrfToken = await getCsrfToken();

    const response = await fetch(`${API_BASE_URL}/content/posts/`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'X-CSRFToken': csrfToken,
      },
      cache: "no-store",
    });

    if (!response.ok) throw new Error('Failed to fetch posts');

    const posts: ScheduledPost[] = await response.json();
    const now = new Date();

    return posts.map(post => ({
      ...post,
      platform: mapPlatform(post.platform),
      status: new Date(post.scheduled_for) < now ? 'published' : post.status || 'scheduled',
      creator: post.creator ? {
        id: (post.creator as Creator).id || 'unknown',
        full_name: (post.creator as Creator).full_name || 'Unknown',
        type: (post.creator as Creator).type || 'team_member'
      } : {
        id: 'unknown',
        full_name: 'Unknown',
        type: 'team_member'
      },
      client: post.client
        ? {
            id: post.client.id || 'unknown',
            full_name: post.client.full_name || 'Unknown'
          }
        : {
            id: 'unknown',
            full_name: 'Unknown'
          }
    }));
  } catch (error) {
    console.error('Error fetching posts:', error);
    return [];
  }
}

  // Helper function to map platform names
function mapPlatform(platform: string | undefined): 'Facebook' | 'Instagram' | 'LinkedIn' {
    if (!platform) {
      console.warn("Platform is undefined, defaulting to 'Facebook'");
      return 'Facebook'; // Default to Facebook if platform is undefined
    }
  
    const platformMap: Record<string, 'Facebook' | 'Instagram' | 'LinkedIn'> = {
      facebook: 'Facebook',
      instagram: 'Instagram',
      linkedin: 'LinkedIn',
    };
  
    return platformMap[platform.toLowerCase()] || 'Facebook'; // Default to Facebook if unknown
  }

export async function getDraftPosts(): Promise<DraftPost[]> {
  try {
      const token = await getAuthToken();
      const csrfToken = await getCsrfToken();

      const response = await fetch(`${API_BASE_URL}/content/posts/drafts/`, {
          headers: {
              'Authorization': `Bearer ${token}`,
              'X-CSRFToken': csrfToken,
          },
          cache: "no-store",
      });

      if (!response.ok) {
          console.error("Failed to fetch draft posts:", response.status, await response.text());
          throw new Error("Failed to fetch draft posts");
      }

      const data = await response.json();
      
      // Convert each draft post to plain object
      return data.map((post: any) => ({
          ...post,
          scheduled_for: post.scheduled_for ? new Date(post.scheduled_for).toISOString() : null,
          media: post.media.map((mediaItem: any) => ({
              ...mediaItem,
              uploaded_at: new Date(mediaItem.uploaded_at).toISOString()
          }))
      }));
  } catch (error) {
      console.error("Error fetching draft posts:", error);
      return [];
  }
}

export async function saveDraft(formData: FormData): Promise<{
  success: boolean;
  data?: any;
  error?: string;}> 
  {
  try {
    const token = await getAuthToken();
    const csrfToken = await getCsrfToken();

    const response = await fetch(`${API_BASE_URL}/content/posts/save-draft/`, {
      method: 'POST',
      body: formData,
      headers: {
        'Authorization': `Bearer ${token}`,
        'X-CSRFToken': csrfToken,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      // Try to get error message, fallback to status text
      const errorData = await response.json().catch(() => ({
        message: response.statusText
      }));
      return {
        success: false,
        error: errorData.message || 'Failed to save draft'
      };
    }

    // Ensure the response data is serializable
    const responseData = await response.json();
    return {
      success: true,
      data: JSON.parse(JSON.stringify(responseData)) // Force serialization
    };
  } catch (error) {
    console.error('Error saving draft:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to save draft'
    };
  }
}

export async function getPostById(postId: number): Promise<DraftPost | null> {
  try {
      const token = await getAuthToken();
      const csrfToken = await getCsrfToken();

      const response = await fetch(`${API_BASE_URL}/content/posts/${postId}/`, {
          headers: {
              'Authorization': `Bearer ${token}`,
              'X-CSRFToken': csrfToken,
          },
          cache: "no-store",
      });

      if (!response.ok) {
          console.error("Failed to fetch post:", response.status, await response.text());
          return null;
      }

      const data = await response.json();
      return JSON.parse(JSON.stringify({
          ...data,
          scheduled_for: data.scheduled_for ? new Date(data.scheduled_for).toISOString() : null,
          media: data.media.map((mediaItem: any) => ({
              ...mediaItem,
              uploaded_at: new Date(mediaItem.uploaded_at).toISOString()
          }))
      }));
  } catch (error) {
      console.error("Error fetching post:", error);
      return null;
  }
}

export async function updatePost(postId: number, formData: FormData): Promise<Response> {
    try {
        const token = await getAuthToken();
        const csrfToken = await getCsrfToken();

        const response = await fetch(`${API_BASE_URL}/content/posts/${postId}/`, {
            method: 'PATCH',
            body: formData,
            headers: {
                'Authorization': `Bearer ${token}`,
                'X-CSRFToken': csrfToken,
            },
            cache: "no-store",
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to update post');
        }
        
        return response;
    } catch (error) {
        console.error("Error updating post:", error);
        throw error;
    }
}

export async function getScheduledAndPublishedPosts(): Promise<ScheduledPost[]> {
    try {
        const token = await getAuthToken();
        const csrfToken = await getCsrfToken();

        const response = await fetch(`${API_BASE_URL}/posts/scheduled/`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'X-CSRFToken': csrfToken,
            },
            cache: "no-store",
        });

        if (!response.ok) {
            console.error("Failed to fetch scheduled posts:", response.status, await response.text());
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

        const response = await fetch(`${API_BASE_URL}/content/posts/${postId}/delete/`, {
            method: "DELETE",
            headers: {
                'Authorization': `Bearer ${token}`,
                'X-CSRFToken': csrfToken,
            },
            cache: "no-store",
        });

        if (!response.ok) {
            console.error("Failed to delete post:", response.status, await response.text());
            throw new Error("Failed to delete post");
        }
    } catch (error) {
        console.error("Error deleting post:", error);
        throw error;
    }
}
