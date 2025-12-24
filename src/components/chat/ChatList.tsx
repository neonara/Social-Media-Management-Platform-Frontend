import type { ChatRoom } from "@/types/chat";
import { getDisplayName, getDisplayNameFromParts } from "@/utils/displayName";
import { cn } from "@/utils/utils";
import { format } from "date-fns";
import { MessageCircle, Users } from "lucide-react";
import React from "react";

interface ChatListProps {
  rooms: ChatRoom[];
  selectedRoomId?: number;
  currentUserId?: number;
  onRoomSelect: (roomId: number) => void;
  loading?: boolean;
}

export const ChatList: React.FC<ChatListProps> = ({
  rooms,
  selectedRoomId,
  currentUserId,
  onRoomSelect,
  loading = false,
}) => {
  const getDisplayNameFromMessage = (msg: any) => {
    if (!msg) return "";
    return getDisplayName(msg);
  };
  if (loading) {
    return (
      <div className="p-4">
        <div className="animate-pulse space-y-3">
          {[...Array(5)].map((_, i) => (
            <div
              key={`loading-${i}`}
              className="h-16 rounded-lg bg-gray-200 dark:bg-gray-700"
            ></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      {rooms.length === 0 ? (
        <div className="p-4 text-center text-gray-500 dark:text-gray-400">
          <MessageCircle className="mx-auto mb-2 h-12 w-12 opacity-50" />
          <p>No conversations yet</p>
        </div>
      ) : (
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {rooms.map((room) => (
            <div
              key={room.id}
              onClick={() => onRoomSelect(room.id)}
              className={cn(
                "cursor-pointer p-4 transition-colors hover:bg-blue-50 dark:hover:bg-gray-700",
                selectedRoomId === room.id
                  ? "border-r-2 border-blue-500 bg-blue-100 dark:border-blue-400 dark:bg-blue-900"
                  : "bg-gray-50",
              )}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    {room.room_type === "direct" ? (
                      <MessageCircle className="h-8 w-8 text-blue-500" />
                    ) : (
                      <Users className="h-8 w-8 text-green-500" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-gray-900 dark:text-white">
                      {room.name ||
                        (room.room_type === "direct"
                          ? (room.member_details || [])
                              .filter((m) => m.id !== (currentUserId ?? -1))
                              .map((m) =>
                                getDisplayNameFromParts(m.name, m.email),
                              )
                              .join(", ")
                          : `Team Chat (${room.members.length} members)`)}
                    </p>
                    {room.last_message && (
                      <p className="truncate text-sm text-gray-500 dark:text-gray-400">
                        {getDisplayNameFromMessage(room.last_message)}:{" "}
                        {(() => {
                          const last: any = room.last_message;
                          if (!last) return "";
                          const text = (last.content || "").toString();
                          return text.length > 120
                            ? text.slice(0, 120) + "…"
                            : text;
                        })()}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex flex-col items-end space-y-1">
                  {room.last_message && (
                    <p className="text-xs text-gray-400 dark:text-gray-300">
                      {format(new Date(room.last_message.created_at), "HH:mm")}
                    </p>
                  )}
                  {room.unread_count > 0 && (
                    <span className="inline-flex items-center justify-center rounded-full bg-red-500 px-2 py-1 text-xs font-bold leading-none text-white">
                      {room.unread_count}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
