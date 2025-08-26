"use client";

import React, { useState } from "react";
import { User } from "@/types/user";

export type AssignmentType = "moderator" | "cm" | "client";

interface AssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (assignId: number) => void;
  assignmentType: AssignmentType;
  users: User[];
}

export default function AssignmentModal({
  isOpen,
  onClose,
  onConfirm,
  assignmentType,
  users,
}: AssignmentModalProps) {
  const [selectedId, setSelectedId] = useState<number | "">("");

  if (!isOpen) return null;

  const label =
    assignmentType === "moderator"
      ? "Moderator"
      : assignmentType === "client"
        ? "Client"
        : "Community Manager";

  const filteredUsers = users.filter((user) => {
    if (assignmentType === "moderator") return user.role === "moderator";
    if (assignmentType === "client") return user.role === "client";
    if (assignmentType === "cm") return user.role === "community_manager";
    return false;
  });

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-gray-500 bg-opacity-50">
      <div className="rounded-lg bg-white p-6 shadow-xl dark:bg-gray-800">
        <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
          Assign {label}
        </h2>
        <div>
          <label
            htmlFor="assignId"
            className="mb-2 block text-gray-700 dark:text-gray-300"
          >
            Select {label}:
          </label>
          <select
            id="assignId"
            className="w-full rounded border border-gray-300 bg-white p-2 text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            value={selectedId}
            onChange={(e) =>
              setSelectedId(e.target.value ? Number(e.target.value) : "")
            }
          >
            <option value="">-- Select --</option>
            {filteredUsers.map((u) => (
              <option key={u.id} value={u.id}>
                {u.full_name || u.email.split("@")[0]}
              </option>
            ))}
          </select>
        </div>
        <div className="mt-4 flex justify-end">
          <button
            className="hover:bg-primary-dark rounded-full bg-primary px-4 py-2 text-white disabled:opacity-50"
            onClick={() =>
              typeof selectedId === "number" && onConfirm(selectedId)
            }
            disabled={selectedId === ""}
          >
            Confirm
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
