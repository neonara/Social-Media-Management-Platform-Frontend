import type {
  ChatRoom,
  CreateChatRoomData,
  Message,
  SendMessageData,
} from "@/types/chat";
import { apiClient } from "@/utils/apiClient";

const CHAT_BASE_URL = "/collaboration";

export const chatService = {
  // Chat Rooms
  async getChatRooms(): Promise<ChatRoom[]> {
    const response = await apiClient.get(`${CHAT_BASE_URL}/chat-rooms/`);
    return response.data;
  },

  async createChatRoom(data: CreateChatRoomData): Promise<ChatRoom> {
    const response = await apiClient.post(`${CHAT_BASE_URL}/chat-rooms/`, data);
    return response.data;
  },

  async getChatRoom(roomId: number): Promise<ChatRoom> {
    const response = await apiClient.get(
      `${CHAT_BASE_URL}/chat-rooms/${roomId}/`,
    );
    return response.data;
  },

  async updateChatRoom(
    roomId: number,
    data: Partial<ChatRoom>,
  ): Promise<ChatRoom> {
    const response = await apiClient.patch(
      `${CHAT_BASE_URL}/chat-rooms/${roomId}/`,
      data,
    );
    return response.data;
  },

  async deleteChatRoom(roomId: number): Promise<void> {
    await apiClient.delete(`${CHAT_BASE_URL}/chat-rooms/${roomId}/`);
  },

  async getDirectMessageRoom(userId: number): Promise<ChatRoom> {
    const response = await apiClient.get(
      `${CHAT_BASE_URL}/chat-rooms/direct_message/?user_id=${userId}`,
    );
    return response.data;
  },

  // Messages
  async getRoomMessages(roomId: number): Promise<Message[]> {
    const response = await apiClient.get(
      `${CHAT_BASE_URL}/room-messages/${roomId}/`,
    );
    return response.data;
  },

  async sendMessage(data: SendMessageData): Promise<Message> {
    const response = await apiClient.post(
      `${CHAT_BASE_URL}/send-message/`,
      data,
    );
    return response.data;
  },

  async getAllMessages(): Promise<Message[]> {
    const response = await apiClient.get(`${CHAT_BASE_URL}/messages/`);
    return response.data;
  },
};
