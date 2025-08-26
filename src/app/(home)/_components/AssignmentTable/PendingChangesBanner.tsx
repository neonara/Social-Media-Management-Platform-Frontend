"use client";

import React from "react";
import { PendingChange } from "@/types/post";
import { User } from "@/types/user";

interface PendingChangesBannerProps {
  changes: PendingChange[];
  users: User[];
}

export default function PendingChangesBanner({
  changes,
  users,
}: PendingChangesBannerProps) {
  if (!changes.length) return null;

  return (
    <div className="mb-6 rounded-md bg-yellow-100 p-4 shadow-sm dark:bg-yellow-900">
      <h3 className="mb-2 text-lg font-semibold text-yellow-700 dark:text-yellow-300">
        Pending Changes:
      </h3>
      <ul>
        {changes.map((change, index) => (
          <li key={index} className="text-yellow-600 dark:text-yellow-400">
            {users.find((u) => u.id === change.userId)?.full_name} -
            {change.remove ? " Removing " : " Assigning "}
            {change.type === "moderator"
              ? "Moderator"
              : change.type === "client"
                ? "Client"
                : change.type === "cm"
                  ? "CM"
                  : change.type === "cm_to_client"
                    ? "CM to Client"
                    : change.type === "remove_client_cm"
                      ? "CM from Client"
                      : ""}
            {change.assignedName &&
              !change.remove &&
              change.type !== "cm_to_client" &&
              `to ${change.assignedName}`}
            {change.cmNameToRemove &&
              change.remove &&
              change.type === "cm" &&
              `(${change.cmNameToRemove})`}
            {change.cmToAssignToClientName &&
              change.type === "cm_to_client" &&
              `to ${change.cmToAssignToClientName}`}
            {change.cmNameToRemoveFromClient &&
              change.remove &&
              change.type === "remove_client_cm" &&
              `(${change.cmNameToRemoveFromClient})`}
          </li>
        ))}
      </ul>
    </div>
  );
}
