// TypeScript interfaces for social media pages

/**
 * Represents a social media account/page
 * Backend fields from Django model SocialPage
 */
export interface SocialPage {
  // Required fields from serializer
  id: number;
  platform: SocialPlatform;
  client: number; // Foreign key to User model
  page_id: string;
  page_name: string; // Primary field for display name
  connected: boolean; // Whether the account is connected
  token_valid: boolean; // From is_token_valid method
  created_at: Date | string;
  updated_at: Date | string;

  // Optional but useful fields
  name?: string; // kept for backward compatibility, same as page_name
  access_token?: string;
  token_expires_at?: Date | string | null;
  permissions?: Record<string, unknown>;

  // Additional frontend properties that might be useful
  followers_count?: number;
  profile_image?: string;
  url?: string;
  handle?: string;
}

/**
 * Supported social media platforms
 */
export type SocialPlatform = "facebook" | "instagram" | "linkedin";

/**
 * Statistics and metrics for a social page
 */
export interface SocialPageStats {
  page_id: number;
  platform: SocialPlatform;
  followers_count: number;
  following_count: number;
  posts_count: number;
  engagement_rate: number;
  likes_count: number;
  comments_count: number;
  shares_count: number;
  period: "daily" | "weekly" | "monthly" | "yearly";
  date: string;
}

/**
 * Metrics for posts on a particular platform
 */
export interface SocialPostMetrics {
  post_id: number;
  platform: SocialPlatform;
  impressions: number;
  reach: number;
  engagement: number;
  likes: number;
  comments: number;
  shares: number;
  clicks: number;
  saves?: number;
}

/**
 * Authentication information for a social page
 */
export interface SocialPageAuth {
  page_id: number;
  platform: SocialPlatform;
  access_token: string;
  refresh_token?: string;
  token_expires_at: string;
  scopes: string[];
  is_valid: boolean;
}

/**
 * Request for creating a new social page
 */
export interface CreateSocialPageRequest {
  name: string;
  platform: SocialPlatform;
  handle?: string;
  url?: string;
  client_id?: number;
  description?: string;
}
