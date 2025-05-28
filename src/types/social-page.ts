// TypeScript interfaces for social media pages

/**
 * Represents a social media account/page
 * Backend fields: ['id', 'platform', 'client', 'page_id', 'page_name', 'connected', 'created_at', 'updated_at']
 */
export interface SocialPage {
  // Required fields from backend
  id: number;
  platform: SocialPlatform;
  page_id: string;
  name: string; // corresponds to page_name from backend
  connected: boolean;
  created_at: Date;
  updated_at: Date;
  // Optional fields
  client?: number;
  // Additional frontend properties
  followers_count?: number;
  handle?: string;
  url?: string;
  profile_image?: string;
  cover_image?: string;
  following_count?: number;
  posts_count?: number;
  engagement_rate?: number;
  description?: string;
  is_active?: boolean;
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
