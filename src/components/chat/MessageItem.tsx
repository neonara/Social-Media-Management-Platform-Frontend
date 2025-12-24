import type { Message } from "@/types/chat";
import { getDisplayName } from "@/utils/displayName";
import { cn } from "@/utils/utils";
import { format } from "date-fns";
import React from "react";

interface MessageItemProps {
  message: Message;
  isOwn: boolean;
}

export const MessageItem: React.FC<MessageItemProps> = ({ message, isOwn }) => {
  const displayName = getDisplayName(message);
  return (
    <div className={cn("mb-4 flex", isOwn ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-xs rounded-lg px-4 py-2 lg:max-w-md",
          isOwn
            ? "rounded-br-none bg-blue-500 text-white dark:bg-blue-600"
            : "rounded-bl-none bg-gray-200 text-gray-900 dark:bg-gray-700 dark:text-gray-100",
        )}
      >
        {!isOwn && (
          <div className="mb-1 text-xs font-semibold text-gray-600 dark:text-gray-300">
            {displayName}
          </div>
        )}
        <div className="text-sm">{message.content}</div>
        <div
          className={cn(
            "mt-1 text-xs",
            isOwn
              ? "text-blue-100 dark:text-blue-200"
              : "text-gray-500 dark:text-gray-400",
          )}
        >
          {format(new Date(message.created_at), "HH:mm")}
        </div>
      </div>
    </div>
  );
};
