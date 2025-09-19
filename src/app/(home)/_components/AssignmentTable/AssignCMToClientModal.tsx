"use client";

import React, { useState } from "react";
import { User } from "@/types/user";

interface AssignCMToClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (cmId: number) => void;
  users: User[];
  client: User;
}

export default function AssignCMToClientModal({
  isOpen,
  onClose,
  onConfirm,
  users,
  client,
}: AssignCMToClientModalProps) {
  const [selectedCMId, setSelectedCMId] = useState<number | "">("");

  if (!isOpen) return null;

  const eligibleCMs = users.filter((user) => {
    if (user.role !== "community_manager") return false;
    // Only CMs that are assigned to the client's moderator
    if (!client.assigned_moderator) return false;
    const moderator = users.find(
      (u) => u.full_name === client.assigned_moderator,
    );
    const cms = moderator?.assigned_communitymanagers
      ?.split(",")
      .map((cm) => cm.trim().toLowerCase());
    return cms?.includes(user.full_name?.toLowerCase() || "");
  });

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-gray-500 bg-opacity-50">
      <div className="rounded-lg bg-white p-6 shadow-xl dark:bg-gray-800">
        <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
          Assign CM to {client.full_name}
        </h2>
        <div>
          <label
            htmlFor="cmToAssign"
            className="mb-2 block text-gray-700 dark:text-gray-300"
          >
            Select Community Manager:
          </label>
          <select
            id="cmToAssign"
            className="w-full rounded border border-gray-300 bg-white p-2 text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            value={selectedCMId}
            onChange={(e) =>
              setSelectedCMId(e.target.value ? Number(e.target.value) : "")
            }
          >
            <option value="">-- Select CM --</option>
            {eligibleCMs.map((u) => (
              <option key={u.id} value={u.id}>
                {u.email || u.full_name}
              </option>
            ))}
          </select>
        </div>
        <div className="mt-4 flex justify-end">
          <button
            className="hover:bg-primary-dark rounded-full bg-primary px-4 py-2 text-white disabled:opacity-50"
            onClick={() =>
              typeof selectedCMId === "number" && onConfirm(selectedCMId)
            }
            disabled={selectedCMId === ""}
          >
            Assign
          </button>
          <button
            className="ml-2 rounded-full bg-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-400 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500"
            onClick={onClose}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
