"use server";

import { API_BASE_URL } from "@/config/api";
import { cookies } from "next/headers";



interface ScheduledPost {
    id: string;
    title: string;
    platform: 'Facebook' | 'Instagram' | 'LinkedIn';
    scheduled_for: string;
    status?: 'published' | 'scheduled' | 'failed';
}

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
            status: new Date(post.scheduled_for) < now ? 'published' : 'scheduled'
        }));
    } catch (error) {
        console.error('Error fetching posts:', error);
        return [];
    }
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
  error?: string;
}> {
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
      
      // Convert to plain object and handle Dates
      return {
          ...data,
          scheduled_for: data.scheduled_for ? new Date(data.scheduled_for).toISOString() : null,
          media: data.media.map((mediaItem: any) => ({
              ...mediaItem,
              uploaded_at: new Date(mediaItem.uploaded_at).toISOString()
          }))
      };
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
