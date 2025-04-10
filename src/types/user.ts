export interface User {
  id: number;
  email: string;
  name?: string;
  is_administrator: boolean;
  is_moderator: boolean;
  is_community_manager: boolean;
  is_client: boolean;
  profile_image?: string;
  created_at?: string;
  updated_at?: string;
}

export type UserRole =
  | "administrator"
  | "moderator"
  | "community_manager"
  | "client"
  | "unknown";

export function getUserRole(user: User): UserRole {
  if (user.is_administrator) return "administrator";
  if (user.is_moderator) return "moderator";
  if (user.is_community_manager) return "community_manager";
  if (user.is_client) return "client";
  return "unknown";
}
