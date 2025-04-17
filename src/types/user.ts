export interface User {
  id: number;
  email: string;
  full_name?: string;
  first_name?: string;
  last_name?: string;
  phone_number?: string;
  is_administrator: boolean;
  is_moderator: boolean;
  is_community_manager: boolean;
  is_client: boolean;
  user_image?: string;
  assigned_moderator?: string | null;
  assigned_communitymanagers?: string | null;
  roles: string[];
}

export interface GetUser {
  id: number;
  email: string;
  first_name?: string;
  last_name?: string;
  full_name?: string;
  phone_number?: string;
  role?: UserRole;
  user_image?: string;
  assigned_moderator?: string | null;
  assigned_communitymanagers?: string | null;
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
export const roles = [
  { value: "client", label: "Client" },
  { value: "moderator", label: "Moderator" },
  { value: "community_manager", label: "Community Manager" },
  { value: "administrator", label: "Administrator" },
];



export type PendingAssignment = {
  userId: number;
  type: "moderator" | "cm";
  assignedId?: number | null;
  assignedName?: string;
  remove?: boolean;
  cmIdToRemove?: number;
  cmNameToRemove?: string;
};