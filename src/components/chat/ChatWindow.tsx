import type { Message } from "@/types/chat";
import { Info } from "lucide-react";
import React, { useEffect, useRef } from "react";
import { MessageInput } from "./MessageInput";
import { MessageItem } from "./MessageItem";

interface ChatWindowProps {
  messages: Message[];
  currentUserId: number;
  onSendMessage: (content: string) => void;
  loading?: boolean;
  roomName?: string;
  onMessagesViewed?: () => void;
  room?: import("@/types/chat").ChatRoom | null;
  onToggleSidebar?: () => void;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({
  messages,
  currentUserId,
  onSendMessage,
  loading = false,
  roomName,
  onMessagesViewed,
  onToggleSidebar,
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <div className="flex h-full flex-col">
      {/* Chat Header */}
      {roomName && (
        <div className="flex items-center border-b bg-white px-4 py-3 dark:border-gray-700 dark:bg-gray-800">
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {roomName}
            </h2>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {messages.length} messages
            </div>
          </div>
          <div>
            <button
              className="rounded-full p-2 text-gray-500 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
              onClick={() => onToggleSidebar?.()}
              title="Conversation info"
            >
              <Info className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}

      {/* Messages Area */}
      <div
        className="flex-1 space-y-2 overflow-y-auto p-4"
        onClick={() => {
          try {
            onMessagesViewed?.();
          } catch (e) {
            // ignore
          }
        }}
      >
        {loading ? (
          <div className="flex h-full items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-500"></div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-gray-500 dark:text-gray-400">
            <div className="mb-2 text-4xl">💬</div>
            <p className="text-lg">No messages yet</p>
            <p className="text-sm">Start the conversation!</p>
          </div>
        ) : (
          messages.map((message) => (
            <MessageItem
              key={message.id}
              message={message}
              isOwn={message.sender === currentUserId}
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <MessageInput
        onSendMessage={onSendMessage}
        disabled={loading}
        onFocus={() => onMessagesViewed?.()}
        onUserTyping={() => onMessagesViewed?.()}
      />
    </div>
  );
};
