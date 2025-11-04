// Chat-related TypeScript types

export interface ChatRoom {
  id: number;
  name: string | null;
  room_type: "team" | "direct";
  members: number[]; // User IDs
  member_details: ChatMember[];
  created_at: string;
  created_by: number;
  is_active: boolean;
  last_message?: Message | null;
  unread_count: number;
}

export interface ChatMember {
  id: number;
  name: string;
  email: string;
}

export interface Message {
  id: number;
  content: string;
  sender: number;
  sender_name: string;
  sender_email: string;
  created_at: string;
  is_read: boolean;
  read_at: string | null;
}

export interface CreateChatRoomData {
  name?: string;
  room_type: "team" | "direct";
  members: number[];
}

export interface SendMessageData {
  room_id: number;
  content: string;
}

// WebSocket message types for chat
export interface ChatWebSocketMessage {
  type:
    | "connection_established"
    | "message_sent"
    | "message_received"
    | "user_joined"
    | "user_left"
    | "error";
  room_id?: number;
  message?: Message;
  user_id?: number;
  username?: string;
  error?: string;
}

// Chat WebSocket hook interface
export interface ChatWebSocketHook {
  isConnected: boolean;
  connect: (roomId?: number) => void;
  disconnect: () => void;
  sendMessage: (message: Record<string, unknown>) => void;
  joinRoom: (roomId: number) => void;
  leaveRoom: (roomId: number) => void;
}
