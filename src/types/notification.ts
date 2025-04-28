import { User } from "./user";

export interface Notification {
  id: number;
  recipient: User;
  title: string;
  message: string;
  type: string;
  url: string;
  is_read: boolean;
  created_at: string;
}
