"use client";

/**
 * Ensures an image URL is a complete URL
 * Handles relative URLs from the backend and adds the API_BASE_URL if needed
 *
 * @param url The image URL to check and format
 * @returns A properly formatted image URL or the default user image
 */
export function getImageUrl(url: string | null | undefined): string {
  if (!url) return "/avatar_placeholder.svg"; // Default image if URL is null or undefined

  // Already a complete URL (starts with http:// or https://)
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }

  // Already a local asset (starts with /)
  if (url.startsWith("/images/")) {
    return url;
  }

  // Handle relative URLs from the backend
  if (url.startsWith("/media/") || url.startsWith("media/")) {
    const cleanUrl = url.startsWith("/") ? url : `/${url}`;
    // API_BASE_URL is http://localhost:8000/api but media URLs need to be http://localhost:8000/media/...
    return `http://localhost:8000${cleanUrl}`;
  }

  // When in doubt, use the default image
  return "/avatar_placeholder.svg";
}
