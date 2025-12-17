"use client";

import { chatService } from "@/services/chatService";
import { getClientAssignments } from "@/services/clientService";
import { getClientAssignedCommunityManagersServerAction } from "@/services/userService";
import type { GetUser } from "@/types/user";
import { X } from "lucide-react";
import React, { useCallback, useEffect, useState } from "react";
import { FaRegMessage } from "react-icons/fa6";
import { GrGroup } from "react-icons/gr";

interface CreateChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateChat: (
    roomType: "team" | "direct",
    name: string,
    members: number[],
  ) => void;
  currentUserId: number;
}

export const CreateChatModal: React.FC<CreateChatModalProps> = ({
  isOpen,
  onClose,
  onCreateChat,
  currentUserId,
}) => {
  const [roomType, setRoomType] = useState<"team" | "direct">("direct");
  const [name, setName] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  const [users, setUsers] = useState<GetUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [existingDirectPartnerIds, setExistingDirectPartnerIds] = useState<
    Set<number>
  >(new Set());

  // Load users when modal opens
  useEffect(() => {
    if (isOpen) {
      loadUsers();
    } else {
      // Reset form when closing
      setRoomType("direct");
      setName("");
      setSelectedUsers([]);
    }
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  const loadUsers = useCallback(async () => {
    setLoadingUsers(true);
    try {
      console.debug("CreateChatModal: loading users for", currentUserId);
      // Fetch available users and existing chat rooms in parallel so we can
      // filter out users that already have a direct message room with the
      // current user.
      const [assignedCMsResult, roomsData, clientAssignmentsResult] =
        await Promise.all([
          // assigned CMs for this client (server action)
          getClientAssignedCommunityManagersServerAction(currentUserId),
          chatService.getChatRooms(),
          // client assignments (moderator + community managers) — used in dashboard
          getClientAssignments(),
        ] as const);

      console.debug("CreateChatModal: loadUsers results:", {
        assignedCMsResult,
        roomsData,
        clientAssignmentsResult,
      });

      // Build a set of user IDs who already have a direct DM with current user
      const dmPartnerIds = new Set<number>();
      if (Array.isArray(roomsData)) {
        for (const r of roomsData) {
          if (r.room_type === "direct" && Array.isArray(r.member_details)) {
            const other = r.member_details.find(
              (m: any) => m.id !== currentUserId,
            );
            if (other && other.id) dmPartnerIds.add(other.id);
          }
        }
      }

      setExistingDirectPartnerIds(dmPartnerIds);

      const assignedCMs = Array.isArray(assignedCMsResult)
        ? (assignedCMsResult as GetUser[])
        : [];

      // Extract community managers and moderator from client assignments
      let clientCMs: GetUser[] = [];
      let clientModerator: GetUser | null = null;
      if (clientAssignmentsResult && !("error" in clientAssignmentsResult)) {
        clientModerator = clientAssignmentsResult?.moderator || null;
        clientCMs = Array.isArray(clientAssignmentsResult?.community_managers)
          ? clientAssignmentsResult.community_managers
          : [];
      }

      // Merge assigned CMs (server action) with client-assigned CMs and include moderator
      const combinedMap = new Map<number, GetUser>();
      for (const u of [...assignedCMs, ...clientCMs]) {
        if (u && u.id) combinedMap.set(u.id, u);
      }
      if (clientModerator && clientModerator.id)
        combinedMap.set(clientModerator.id, clientModerator);

      const combined = Array.from(combinedMap.values()).filter(
        (user) => user.id !== currentUserId,
      );

      setUsers(combined);
    } catch (error) {
      console.error("Failed to load users:", error);
    } finally {
      setLoadingUsers(false);
    }
  }, [currentUserId]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (roomType === "team" && !name.trim()) {
        alert("Please enter a name for the team chat");
        return;
      }

      if (selectedUsers.length === 0) {
        alert("Please select at least one user");
        return;
      }

      if (roomType === "direct" && selectedUsers.length > 1) {
        alert("Direct messages can only have one other participant");
        return;
      }

      setLoading(true);
      try {
        await onCreateChat(roomType, name, selectedUsers);
        onClose();
      } catch (error) {
        console.error("Failed to create chat:", error);
        alert("Failed to create chat. Please try again.");
      } finally {
        setLoading(false);
      }
    },
    [roomType, name, selectedUsers, onCreateChat, onClose],
  );

  const toggleUserSelection = useCallback(
    (userId: number) => {
      // Prevent selecting a user for direct messages if a DM already exists
      if (roomType === "direct" && existingDirectPartnerIds.has(userId)) {
        return;
      }

      setSelectedUsers((prev) => {
        if (roomType === "direct") {
          // For direct messages, only allow one selection
          return prev.includes(userId) ? [] : [userId];
        } else {
          // For team chats, allow multiple selections
          return prev.includes(userId)
            ? prev.filter((id) => id !== userId)
            : [...prev, userId];
        }
      });
    },
    [roomType, existingDirectPartnerIds],
  );

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
      onClick={() => onClose()}
    >
      <div
        className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl dark:bg-gray-800"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Start New Conversation
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:text-gray-300 dark:hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Room Type Selection */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-200">
              Conversation Type
            </label>
            <div className="flex space-x-4">
              <label
                onClick={() => {
                  setRoomType("direct");
                  setSelectedUsers([]);
                }}
                className={`flex items-center rounded-xl border p-2 dark:border-gray-600 dark:hover:border-blue-400 ${
                  roomType === "direct"
                    ? "border-blue-500 bg-blue-50 text-gray-800"
                    : "border-gray-300 hover:border-blue-400"
                }`}
              >
                <input
                  type="radio"
                  value="direct"
                  checked={roomType === "direct"}
                  onChange={(e) => {
                    setRoomType(e.target.value as "direct");
                    setSelectedUsers([]); // Reset selections when changing type
                  }}
                  className="sr-only"
                />
                <FaRegMessage className="mr-2" />
                Direct Message
              </label>
              <label
                onClick={() => {
                  setRoomType("team");
                  setSelectedUsers([]);
                }}
                className={`flex items-center rounded-xl border p-2 dark:border-gray-600 dark:hover:border-blue-400 ${
                  roomType === "team"
                    ? "border-indigo-500 bg-indigo-50 text-gray-800"
                    : "border-gray-300 hover:border-blue-400"
                }`}
              >
                <input
                  type="radio"
                  value="team"
                  checked={roomType === "team"}
                  onChange={(e) => {
                    setRoomType(e.target.value as "team");
                    setSelectedUsers([]); // Reset selections when changing type
                  }}
                  className="sr-only"
                />
                <GrGroup className="mr-2" />
                Team Chat
              </label>
            </div>
          </div>

          {/* Team Name Input */}
          {roomType === "team" && (
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-200">
                Chat Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter chat name"
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                required
              />
            </div>
          )}

          {/* User Selection */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              {roomType === "direct" ? "Select User" : "Select Members"}
            </label>
            {loadingUsers ? (
              <div className="flex items-center justify-center py-4">
                <div className="h-5 w-5 animate-spin rounded-full border-b-2 border-blue-500"></div>
              </div>
            ) : (
              <div className="max-h-48 overflow-y-auto rounded-md border border-gray-300 dark:border-gray-700 dark:bg-gray-700">
                {users.map((user) => {
                  const disabledForDirect =
                    roomType === "direct" &&
                    existingDirectPartnerIds.has(user.id);
                  return (
                    <label
                      key={user.id}
                      className={`flex cursor-pointer items-center p-3 hover:bg-gray-50 dark:hover:bg-gray-700 ${
                        disabledForDirect ? "opacity-60" : ""
                      }`}
                    >
                      <input
                        type={roomType === "direct" ? "radio" : "checkbox"}
                        checked={selectedUsers.includes(user.id)}
                        onChange={() => toggleUserSelection(user.id)}
                        className="mr-3"
                        disabled={disabledForDirect}
                      />
                      <div className="flex items-center">
                        <div className="mr-3 flex h-8 w-8 items-center justify-center rounded-full bg-blue-500 text-sm font-medium text-white">
                          {user.first_name?.[0] || user.email[0].toUpperCase()}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">
                            {user.full_name?.trim() ||
                              `${user.first_name ?? ""} ${user.last_name ?? ""}`.trim() ||
                              user.email}
                            {disabledForDirect && (
                              <span className="ml-2 text-xs text-gray-500">
                                (DM exists)
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {user.email}
                          </div>
                        </div>
                      </div>
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md bg-gray-100 px-4 py-2 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || selectedUsers.length === 0}
              className="rounded-md bg-blue-500 px-4 py-2 text-white hover:bg-blue-600 disabled:opacity-50"
            >
              {loading ? "Creating..." : "Create Chat"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
