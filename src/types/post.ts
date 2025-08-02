import { SocialPage } from "./social-page";
import { GetUser } from "./user";

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
  creator?: Partial<GetUser> & {
    id: number;
    full_name: string;
    type?: "client" | "team_member";
  };
  client?: Partial<GetUser> & {
    id: number;
    full_name: string;
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
  };
}
