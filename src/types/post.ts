import { SocialPage } from "./social-page";
import { GetUser, UserRole } from "./user";

export interface ScheduledPost {
  id: number;
  title: string;
  platform: "Facebook" | "Instagram" | "LinkedIn";
  platformPage: SocialPage;
  mediaFiles?: Array<{ id: number; preview: string }>;
  media?: Array<{
    id: number;
    file: string;
    name: string;
    uploaded_at: string;
    file_type: string;
  }>;
  description: string;
  scheduled_for: string;
  status?:
    | "published"
    | "scheduled"
    | "failed"
    | "pending"
    | "rejected"
    | "draft";
  // Tracking fields
  created_at?: string;
  updated_at?: string;
  last_edited_by?:
    | string
    | {
        id: number;
        full_name?: string;
        email: string;
        role?: UserRole;
      };
  // Workflow fields
  is_client_approved?: boolean;
  is_moderator_rejected?: boolean;
  client_approved_at?: string;
  client_rejected_at?: string;
  moderator_validated_at?: string;
  moderator_rejected_at?: string;
  feedback?: string;
  feedback_by?: GetUser;
  feedback_at?: string;
  creator?: {
    id: number;
    full_name: string;
    email: string;
    role: UserRole;
  };
  client?: {
    id: number;
    full_name: string;
    email: string;
  };
}

export interface DraftPost {
  id: number;
  title: string;
  description: string;
  scheduled_for: string | null;
  creator_id: number;
  status: "draft";
  platforms: string[];
  media: {
    id: number;
    file: string;
    name: string;
    uploaded_at: string;
    file_type: string;
  }[];
  hashtags: string[];
  client_id?: number;
  client?: {
    id: number;
    full_name: string;
    email: string;
  };
}

export type PendingChange = {
  userId: number; // The user whose assignment is being changed
  type: "moderator" | "cm" | "client" | "cm_to_client" | "remove_client_cm"; // Added 'remove_client_cm'
  assignedId?: number | null;
  assignedName?: string | null;
  remove?: boolean;
  cmIdToRemove?: number | null; // For removing CM from moderator
  cmNameToRemove?: string | null; // For removing CM from moderator
  clientForCMAssignmentId?: number | null; // For CM to Client assignment
  cmToAssignToClientId?: number | null; // For CM to Client assignment
  cmToAssignToClientName?: string | null; // For CM to Client assignment
  cmToRemoveFromClientId?: number | null; // ID of the CM to remove from the client
  clientToRemoveCMFromId?: number | null; // ID of the client to remove the CM from
  cmNameToRemoveFromClient?: string | null; // Name of the CM to remove from the client (for display)
};
