"use client";

import { useChatWebSocket } from "@/hooks/useChatWebSocket";
import { chatService } from "@/services/chatService";
import type { ChatRoom, ChatWebSocketMessage, Message } from "@/types/chat";
import { getDisplayName, getDisplayNameFromParts } from "@/utils/displayName";
import { cn } from "@/utils/utils";
import { MessageCircle, Plus } from "lucide-react";
import React, { useCallback, useEffect, useState } from "react";
import { ChatList } from "./ChatList";
import { ChatSidebar } from "./ChatSidebar";
import { ChatWindow } from "./ChatWindow";
import { CreateChatModal } from "./CreateChatModal";

interface ChatProps {
  currentUserId: number;
  className?: string;
}

export const Chat: React.FC<ChatProps> = ({ currentUserId, className }) => {
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Ensure messages have a sender_name; if missing, derive from sender_email
  const normalizeMessage = (m: Message): Message => {
    try {
      const resolved = getDisplayName(m);
      return { ...m, sender_name: resolved };
    } catch (e) {
      return m;
    }
  };

  // WebSocket message handler (uses a ref to keep a stable function identity)
  const handleWebSocketMessage = useCallback(
    (message: ChatWebSocketMessage) => {
      switch (message.type) {
        case "message_received":
          if (message.message) {
            // Ensure sender_name exists; if not, derive from sender_email
            const normalized = normalizeMessage(message.message);

            if (message.room_id === selectedRoom?.id) {
              setMessages((prev) => {
                // Deduplicate by id: if we already have this message, skip appending
                if (prev.some((m) => m.id === normalized.id)) return prev;
                return [...prev, normalized];
              });
            }

            // Update room's last message
            setRooms((prev) =>
              prev.map((room) =>
                room.id === message.room_id
                  ? { ...room, last_message: normalized }
                  : room,
              ),
            );
          }
          break;
        case "user_joined":
          // Handle user joined notification
          break;
        case "user_left":
          // Handle user left notification
          break;
        case "error":
          console.error("Chat WebSocket error:", message.error);
          break;
      }
    },
    [selectedRoom?.id],
  );

  // Keep a ref to the latest message handler so we can pass a stable callback
  // to the WebSocket hook (prevents reconnect loops caused by changing function identity)
  const messageHandlerRef = React.useRef(handleWebSocketMessage);
  React.useEffect(() => {
    messageHandlerRef.current = handleWebSocketMessage;
  }, [handleWebSocketMessage]);

  // Listen for site-wide chat messages (dispatched by ChatNotifier) so we can
  // update room previews and unread counts even when this page isn't the
  // active consumer of the WebSocket.
  React.useEffect(() => {
    const onSiteMessage = (e: Event) => {
      try {
        const custom = e as CustomEvent;
        const msg = custom.detail as ChatWebSocketMessage;
        if (!msg || msg.type !== "message_received" || !msg.message) return;

        const normalized = normalizeMessage(msg.message as Message);

        setRooms((prev) =>
          prev.map((r) =>
            r.id === msg.room_id
              ? {
                  ...r,
                  last_message: normalized,
                  // If the user isn't viewing the room, increment unread_count
                  unread_count:
                    (r.unread_count || 0) + (selectedRoom?.id === r.id ? 0 : 1),
                }
              : r,
          ),
        );
      } catch (err) {
        // ignore
      }
    };

    window.addEventListener("chat:message", onSiteMessage as EventListener);
    return () =>
      window.removeEventListener(
        "chat:message",
        onSiteMessage as EventListener,
      );
  }, [normalizeMessage, selectedRoom]);

  const stableOnMessage = React.useCallback((msg: ChatWebSocketMessage) => {
    // delegate to latest handler
    messageHandlerRef.current(msg);
  }, []);

  const { isConnected, connect, disconnect, sendMessage, joinRoom, leaveRoom } =
    useChatWebSocket(stableOnMessage);

  // Load chat rooms
  const loadRooms = useCallback(async () => {
    try {
      const roomsData = await chatService.getChatRooms();
      setRooms(roomsData);
    } catch (error) {
      console.error("Failed to load chat rooms:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Apply any cached latest messages (written by ChatNotifier) to the rooms state
  const applyCachedLatestMessages = useCallback(() => {
    try {
      // @ts-ignore
      const cache = typeof window !== "undefined" ? window.__CHAT_LATEST : null;
      if (!cache) return;
      setRooms((prev) =>
        prev.map((r) => {
          const latest = cache[r.id];
          if (!latest) return r;
          // merge last_message safely
          return { ...r, last_message: latest };
        }),
      );
    } catch (e) {
      // ignore
    }
  }, []);

  // Load messages for selected room
  const loadMessages = useCallback(async (roomId: number) => {
    try {
      const messagesData = await chatService.getRoomMessages(roomId);
      // Normalize sender names for messages coming from the API
      setMessages(messagesData.map((m) => normalizeMessage(m)));
    } catch (error) {
      console.error("Failed to load messages:", error);
    }
  }, []);

  // Mark messages as viewed (clicking the messages area)
  const handleMessagesViewed = useCallback(async () => {
    if (!selectedRoom) return;
    try {
      const messagesData = await chatService.getRoomMessages(selectedRoom.id);
      // Normalize and refresh local messages (also marks messages as read on server)
      setMessages(messagesData.map((m) => normalizeMessage(m)));

      // Update the room unread_count locally
      setRooms((prev) =>
        prev.map((room) =>
          room.id === selectedRoom.id ? { ...room, unread_count: 0 } : room,
        ),
      );
    } catch (error) {
      console.error("Failed to mark messages as viewed:", error);
    }
  }, [selectedRoom]);

  // When user selects a room or the page becomes visible, mark messages viewed
  useEffect(() => {
    if (!selectedRoom) return;

    // If tab is visible when selecting the room, mark as viewed immediately
    if (
      typeof document !== "undefined" &&
      document.visibilityState === "visible"
    ) {
      handleMessagesViewed();
    }

    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        handleMessagesViewed();
      }
    };

    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [selectedRoom, handleMessagesViewed]);

  // Handle room selection
  const handleRoomSelect = useCallback(
    (roomId: number) => {
      const room = rooms.find((r) => r.id === roomId);
      if (room) {
        // Leave previous room
        if (selectedRoom) {
          leaveRoom(selectedRoom.id);
        }

        setSelectedRoom(room);
        loadMessages(roomId);

        // Join new room
        joinRoom(roomId);
      }
    },
    [rooms, selectedRoom, leaveRoom, joinRoom, loadMessages],
  );

  // Handle creating a new chat room
  const handleCreateChat = useCallback(
    async (roomType: "team" | "direct", name: string, members: number[]) => {
      try {
        const newRoom = await chatService.createChatRoom({
          room_type: roomType,
          name: roomType === "team" ? name : undefined,
          members: [...members, currentUserId], // Include current user
        });

        // Check if this room is already in the list (e.g., existing DM returned by backend)
        const existingRoom = rooms.find((r) => r.id === newRoom.id);
        if (!existingRoom) {
          // Add the new room to the list
          setRooms((prev) => [newRoom, ...prev]);
        }

        // Select the room (whether new or existing)
        setSelectedRoom(newRoom);
        loadMessages(newRoom.id);

        // Join the room via WebSocket
        joinRoom(newRoom.id);
      } catch (error) {
        console.error("Failed to create chat room:", error);
        throw error; // Re-throw to let the modal handle the error
      }
    },
    [currentUserId, loadMessages, joinRoom, rooms],
  );

  // Handle sending message
  const handleSendMessage = useCallback(
    async (content: string) => {
      if (!selectedRoom || sending) return;

      setSending(true);
      try {
        // Use WebSocket-only send to avoid double-saving via REST + WS.
        // The server will save the message and broadcast it back to all clients.
        sendMessage({
          action: "send_message",
          message: content,
        });
      } catch (error) {
        console.error("Failed to send message:", error);
      } finally {
        setSending(false);
      }
    },
    [selectedRoom, sending, sendMessage],
  );

  // Initialize
  useEffect(() => {
    loadRooms();
    connect();
    // If any messages arrived just before we mounted, apply them so the list
    // immediately shows the latest preview.
    applyCachedLatestMessages();

    return () => {
      disconnect();
    };
  }, [loadRooms, connect, disconnect]);

  return (
    <div className={cn("flex h-[85vh] bg-gray-50 dark:bg-gray-900", className)}>
      {/* Sidebar - Chat List */}
      <div className="flex w-80 animate-slide-in-left flex-col border-r border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
        <div className="border-b border-gray-200 p-4 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
              Messages
            </h1>
            <button
              onClick={() => setShowCreateModal(true)}
              className="rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white"
              title="Start new conversation"
            >
              <Plus className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-hidden">
          <ChatList
            rooms={rooms}
            selectedRoomId={selectedRoom?.id}
            onRoomSelect={handleRoomSelect}
            loading={loading}
          />
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex flex-1 flex-col">
        {selectedRoom ? (
          <ChatWindow
            messages={messages}
            currentUserId={currentUserId}
            onSendMessage={handleSendMessage}
            loading={false}
            onMessagesViewed={handleMessagesViewed}
            room={selectedRoom}
            onToggleSidebar={() => setSidebarOpen(true)}
            roomName={
              selectedRoom.name ||
              (selectedRoom.room_type === "direct"
                ? (selectedRoom.member_details || [])
                    .filter((m) => m.id !== currentUserId)
                    .map((m) => getDisplayNameFromParts(m.name, m.email))
                    .join(", ") || "Direct Message"
                : `Team Chat (${selectedRoom.members?.length || 0} members)`)
            }
          />
        ) : (
          <div className="flex flex-1 items-center justify-center bg-white dark:bg-gray-800">
            <div className="text-center">
              <MessageCircle className="mx-auto mb-4 h-16 w-16 text-gray-300 dark:text-gray-400" />
              <h3 className="mb-2 text-lg font-medium text-gray-900 dark:text-white">
                Select a conversation
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                Choose a chat room from the sidebar to start messaging
              </p>
            </div>
          </div>
        )}
      </div>
      {sidebarOpen && selectedRoom && (
        <div className="flex max-w-0 animate-expand-right overflow-hidden border-l border-gray-200 dark:border-gray-700">
          {/* animate-slide-in-right applies a quick slide from the right when opening */}
          <ChatSidebar
            room={selectedRoom}
            currentUserId={currentUserId}
            onClose={() => setSidebarOpen(false)}
            onRoomUpdated={(r) => {
              // update rooms list and selected room
              setRooms((prev) =>
                prev.map((room) => (room.id === r.id ? r : room)),
              );
              setSelectedRoom(r);
            }}
            onRoomLeft={(roomId) => {
              if (selectedRoom?.id === roomId) {
                setSelectedRoom(null);
              }
              loadRooms();
            }}
          />
        </div>
      )}
      {/* Connection Status */}
      {!isConnected && (
        <div className="fixed bottom-4 right-4 rounded-md border border-yellow-400 bg-yellow-100 px-4 py-2 text-yellow-700 dark:border-yellow-600 dark:bg-yellow-900 dark:text-yellow-200">
          Connecting to chat...
        </div>
      )}

      {/* Create Chat Modal */}
      <CreateChatModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreateChat={handleCreateChat}
        currentUserId={currentUserId}
      />
    </div>
  );
};
