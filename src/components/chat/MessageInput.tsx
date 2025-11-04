import { Send } from "lucide-react";
import React, { useState } from "react";

interface MessageInputProps {
  onSendMessage: (content: string) => void;
  disabled?: boolean;
  placeholder?: string;
  // Called when the input receives focus (user likely viewing the chat)
  onFocus?: () => void;
  // Called when user starts typing (also implies viewing)
  onUserTyping?: () => void;
}

export const MessageInput: React.FC<MessageInputProps> = ({
  onSendMessage,
  disabled = false,
  placeholder = "Type a message...",
  onFocus,
  onUserTyping,
}) => {
  const [message, setMessage] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !disabled) {
      onSendMessage(message.trim());
      setMessage("");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleFocus = () => {
    try {
      onFocus?.();
    } catch (e) {
      // ignore
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setMessage(val);
    try {
      // notify only when user starts typing (first character)
      if (val.length === 1) {
        onUserTyping?.();
      }
    } catch (err) {
      // ignore
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex gap-2 border-t bg-white p-4 dark:border-t dark:border-gray-700 dark:bg-gray-800"
    >
      <input
        type="text"
        value={message}
        onChange={handleChange}
        onKeyPress={handleKeyPress}
        onFocus={handleFocus}
        placeholder={placeholder}
        disabled={disabled}
        className="flex-1 rounded-md border border-gray-300 px-3 py-2 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
      />
      <button
        type="submit"
        disabled={disabled || !message.trim()}
        className="rounded-md bg-blue-500 px-4 py-2 text-white transition-colors hover:bg-blue-600 disabled:cursor-not-allowed disabled:bg-gray-300 dark:disabled:bg-gray-600"
      >
        <Send className="h-4 w-4" />
      </button>
    </form>
  );
};
