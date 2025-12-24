"use client";

import { chatService } from "@/services/chatService";
import type { ChatRoom } from "@/types/chat";
import { getDisplayNameFromParts } from "@/utils/displayName";
import { X } from "lucide-react";
import React, { useCallback, useState } from "react";

interface ChatSidebarProps {
  room: ChatRoom;
  currentUserId: number;
  onClose: () => void;
  onRoomUpdated?: (room: ChatRoom) => void;
  onRoomLeft?: (roomId: number) => void;
}

export const ChatSidebar: React.FC<ChatSidebarProps> = ({
  room,
  currentUserId,
  onClose,
  onRoomUpdated,
  onRoomLeft,
}) => {
  const [editingName, setEditingName] = useState(false);
  const [name, setName] = useState(room.name || "");
  const [loading, setLoading] = useState(false);

  const isCreator = room.created_by === currentUserId;

  const handleSaveName = useCallback(async () => {
    if (!room) return;
    setLoading(true);
    try {
      const updated = await chatService.updateChatRoom(room.id, { name });
      onRoomUpdated?.(updated);
      setEditingName(false);
    } catch (e) {
      console.error("Failed to update room name", e);
      alert("Failed to update room name");
    } finally {
      setLoading(false);
    }
  }, [room, name, onRoomUpdated]);

  const handleKick = useCallback(
    async (memberId: number) => {
      if (!room) return;
      if (!confirm("Remove this member from the group?")) return;
      setLoading(true);
      try {
        const remaining = room.members.filter((id) => id !== memberId);
        const updated = await chatService.updateChatRoom(room.id, {
          members: remaining as any,
        });
        onRoomUpdated?.(updated);
      } catch (e) {
        console.error("Failed to remove member", e);
        alert("Failed to remove member");
      } finally {
        setLoading(false);
      }
    },
    [room, onRoomUpdated],
  );

  const handleLeave = useCallback(async () => {
    if (!room) return;
    if (!confirm("Leave this conversation?")) return;
    setLoading(true);
    try {
      const remaining = room.members.filter((id) => id !== currentUserId);
      const updated = await chatService.updateChatRoom(room.id, {
        members: remaining as any,
      });
      onRoomUpdated?.(updated);
      onRoomLeft?.(room.id);
    } catch (e) {
      console.error("Failed to leave room", e);
      alert("Failed to leave room");
    } finally {
      setLoading(false);
    }
  }, [room, currentUserId, onRoomUpdated, onRoomLeft]);

  const handleDelete = useCallback(async () => {
    if (!room) return;
    if (!confirm("Delete this conversation? This action cannot be undone."))
      return;
    setLoading(true);
    try {
      await chatService.deleteChatRoom(room.id);
      onRoomLeft?.(room.id);
    } catch (e) {
      console.error("Failed to delete room", e);
      alert("Failed to delete conversation");
    } finally {
      setLoading(false);
    }
  }, [room, onRoomLeft]);

  return (
    <div className="h-full w-80 bg-white shadow-lg dark:border-l dark:border-gray-700 dark:bg-gray-800">
      <div className="flex items-center justify-between border-b px-4 py-3 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Details
        </h3>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700 dark:text-gray-300"
        >
          <X />
        </button>
      </div>

      <div className="h-[calc(100%-64px)] overflow-y-auto p-4">
        {room.room_type === "team" ? (
          <div>
            <div className="mb-4">
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">
                Group Name
              </label>
              {isCreator && editingName ? (
                <div className="flex gap-2">
                  <input
                    className="flex-1 rounded-md border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                  <button
                    className="rounded-md bg-blue-500 px-3 py-2 text-white"
                    onClick={handleSaveName}
                    disabled={loading}
                  >
                    Save
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-900 dark:text-white">
                    {room.name}
                  </div>
                  {isCreator && (
                    <button
                      className="text-sm text-blue-500"
                      onClick={() => setEditingName(true)}
                    >
                      Edit
                    </button>
                  )}
                </div>
              )}
            </div>

            <div className="mb-4">
              <h4 className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-200">
                Members
              </h4>
              <div className="space-y-2">
                {room.member_details.map((m) => (
                  <div key={m.id} className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">
                        {getDisplayNameFromParts(m.name, m.email)}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {m.email}
                      </div>
                    </div>
                    {isCreator && m.id !== currentUserId && (
                      <button
                        className="text-sm text-red-500"
                        onClick={() => handleKick(m.id)}
                        disabled={loading}
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6">
              <button
                className="w-full rounded-md bg-blue-100 px-4 py-2 text-left text-blue-800 hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-200"
                onClick={handleLeave}
                disabled={loading}
              >
                Leave Conversation
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            {room.member_details
              .filter((m) => m.id !== currentUserId)
              .map((m) => (
                <div key={m.id} className="space-y-1">
                  <div className="text-lg font-medium text-gray-900 dark:text-white">
                    {getDisplayNameFromParts(m.name, m.email)}
                  </div>
                  <div className="text-gray-500 dark:text-gray-400">
                    {m.email}
                  </div>
                  {/* additional fields like phone or role could be added if available */}
                </div>
              ))}

            <div className="mt-6">
              <button
                className="w-full rounded-md bg-red-100 px-4 py-2 text-left text-red-800 hover:bg-red-200 dark:bg-red-900 dark:text-red-200"
                onClick={handleDelete}
                disabled={loading}
              >
                Delete Conversation
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
