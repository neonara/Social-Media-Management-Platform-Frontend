"use client";

import React, { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import AssignmentModal, { AssignmentType } from "./AssignmentModal";
import AssignCMToClientModal from "./AssignCMToClientModal";
import ConfirmModal from "./ConfirmModal";
import PendingChangesBanner from "./PendingChangesBanner";
import { useUserDataWebSocket } from "@/hooks/useUserDataWebSocket";
import {
  getUsers,
  removeModeratorServer,
  assignModeratorServer,
  removeCommunityManagerServer,
  assignCommunityManagerServer,
  assignCMToClientServerAction,
  getClientAssignedCommunityManagersServerAction,
  removeClientCommunityManagerServerAction,
} from "@/services/userService";
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Search,
  UserMinus,
} from "lucide-react";
import { getImageUrl } from "@/utils/image-url";
import { GetUser, User } from "@/types/user";
import { PendingChange } from "@/types/post";
import { useUser } from "@/context/UserContext";

const tabs = [
  "All",
  "Administrator",
  "Moderator",
  "Community Manager",
  "Client",
];

type ExtendedUser = User & { clientAssignedCommunityManagers?: GetUser[] };

type ServiceResult<T = unknown> = T | { error: string };
const isServiceError = (r: unknown): r is { error: string } => {
  if (typeof r !== "object" || r === null) return false;
  const val = r as Record<string, unknown>;
  return typeof val.error === "string";
};

export default function AssignmentTabs() {
  const [users, setUsers] = useState<ExtendedUser[]>([]);
  const [activeTab, setActiveTab] = useState("All");
  const [showModal, setShowModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [assignmentType, setAssignmentType] = useState<AssignmentType | null>(
    null,
  );
  // Removed unused selectedAssignId state
  const [pendingChanges, setPendingChanges] = useState<PendingChange[]>([]);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc" | null>(
    null,
  );
  const [sortColumn, setSortColumn] = useState<
    "name" | "assignedClient" | "assignedModerators" | "assignedCMs" | null
  >(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAssignCMToClientModal, setShowAssignCMToClientModal] =
    useState(false);
  const [selectedClientForCMAssignment, setSelectedClientForCMAssignment] =
    useState<User | null>(null);
  // Removed unused selectedCMToAssignToClient state
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [onConfirm, setOnConfirm] = useState<() => void>(() => () => {});
  const { role } = useUser();

  // WebSocket for real-time user data updates
  const {
    connect: connectUserDataWS,
    disconnect: disconnectUserDataWS,
    sendMessage: sendUserDataMessage,
  } = useUserDataWebSocket((message) => {
    if (
      message.type === "user_data_updated" ||
      message.type === "assignment_changed"
    ) {
      console.log("Received user data update via WebSocket:", message);
      // Refresh user data when changes are made by other users
      fetchUsers(true); // Bypass cache to get fresh data
    }
  });

  const fetchUsers = useCallback(async (bypassCache: boolean = false) => {
    try {
      console.log(
        bypassCache
          ? "Fetching users (bypassing cache due to changes)"
          : "Fetching users (using Redis cache)",
      );
      const fetchedUsers = await getUsers(bypassCache);
      if (fetchedUsers && Array.isArray(fetchedUsers)) {
        const usersWithAssignedCMs = await Promise.all(
          fetchedUsers.map(async (user: ExtendedUser) => {
            if (user.role === "client") {
              const assignedCMsResult =
                await getClientAssignedCommunityManagersServerAction(user.id);
              if (Array.isArray(assignedCMsResult)) {
                return {
                  ...user,
                  clientAssignedCommunityManagers: assignedCMsResult,
                };
              } else if ("error" in assignedCMsResult) {
                console.error(
                  `Error fetching assigned CMs for client ${user.full_name} (ID: ${user.id}):`,
                  assignedCMsResult.error,
                );
                return { ...user, clientAssignedCommunityManagers: [] };
              }
            }
            return user;
          }),
        );
        setUsers(usersWithAssignedCMs as ExtendedUser[]);
      } else if (isServiceError(fetchedUsers)) {
        console.error("Error fetching users:", fetchedUsers.error);
        alert(`Error fetching users: ${fetchedUsers.error}`);
      } else {
        console.error("Failed to fetch users");
        alert("Failed to fetch users.");
      }
    } catch (error) {
      console.error("An unexpected error occurred:", error);
      alert("An unexpected error occurred while fetching users.");
    }
  }, []);

  useEffect(() => {
    fetchUsers(); // Use cache by default on initial load

    // Connect to WebSocket for real-time updates
    connectUserDataWS();

    // Listen for user data changes from other users via custom events (fallback)
    const handleUserDataChange = () => {
      console.log("User data changed by another user, refreshing...");
      fetchUsers(true); // Bypass cache to get fresh data
    };

    window.addEventListener("userDataChanged", handleUserDataChange);

    return () => {
      disconnectUserDataWS();
      window.removeEventListener("userDataChanged", handleUserDataChange);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sortUsers = (
    column: "name" | "assignedClient" | "assignedModerators" | "assignedCMs",
  ) => {
    let newSortDirection: "asc" | "desc";
    if (sortColumn === column && sortDirection === "asc") {
      newSortDirection = "desc";
    } else {
      newSortDirection = "asc";
    }
    setSortDirection(newSortDirection);
    setSortColumn(column);

    const sortedUsers = [...users].sort((a, b) => {
      let valueA: string | null | undefined;
      let valueB: string | null | undefined;

      if (column === "name") {
        valueA = a.full_name?.toLowerCase();
        valueB = b.full_name?.toLowerCase();
      } else if (column === "assignedClient") {
        valueA = a.assigned_client?.toLowerCase();
        valueB = b.assigned_client?.toLowerCase();
      } else if (column === "assignedModerators") {
        valueA = a.assigned_moderator?.toLowerCase();
        valueB = b.assigned_moderator?.toLowerCase();
      } else if (column === "assignedCMs") {
        const getCMs = (user: User): string => {
          if (user.role == "client" && user.clientAssignedCommunityManagers) {
            return user.clientAssignedCommunityManagers
              .map((cm) => cm.full_name)
              .join(", ")
              .toLowerCase();
          } else if (user.assigned_communitymanagers) {
            return user.assigned_communitymanagers.toLowerCase();
          }
          return "";
        };
        valueA = getCMs(a);
        valueB = getCMs(b);
      }

      const safeValueA = valueA ?? "";
      const safeValueB = valueB ?? "";

      if (safeValueA < safeValueB) {
        return newSortDirection === "asc" ? -1 : 1;
      }
      if (safeValueA > safeValueB) {
        return newSortDirection === "asc" ? 1 : -1;
      }
      return 0;
    });
    setUsers(sortedUsers);
  };

  const filteredByRole =
    activeTab === "All"
      ? users
      : users.filter((user) => {
          const formattedRole = user.role
            ? user.role === "community_manager"
              ? "Community Manager"
              : user.role.charAt(0).toUpperCase() + user.role.slice(1)
            : "";
          return formattedRole === activeTab;
        });

  const filteredByName = filteredByRole.filter((user) => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    const name = (user.full_name || "").toLowerCase();
    const email = (user.email || "").toLowerCase();
    return name.includes(q) || email.includes(q);
  });

  const openAssignModal = (user: User, type: AssignmentType) => {
    setSelectedUser(user);
    setAssignmentType(type);
    setShowModal(true);
  };

  const confirmAssignment = (assignId: number) => {
    if (!selectedUser || !assignmentType || !assignId) return;

    const selectedAssignUser = users.find((user) => user.id === assignId);
    if (!selectedAssignUser) return;

    const updated = [...pendingChanges];
    const existingIndex = updated.findIndex(
      (item) =>
        item.userId === selectedUser.id &&
        item.type === assignmentType &&
        !item.remove,
    );

    if (existingIndex !== -1) {
      updated[existingIndex].assignedId = assignId;
      updated[existingIndex].assignedName = selectedAssignUser.full_name;
    } else {
      updated.push({
        userId: selectedUser.id,
        type: assignmentType,
        assignedId: assignId,
        assignedName: selectedAssignUser.full_name,
      });
    }

    setPendingChanges(updated);
    setShowModal(false);
  };

  const queueRemoveAssignment = (
    user: User,
    type: "moderator" | "cm" | "client",
    userToRemove?: GetUser | null,
  ) => {
    const cmIdToRemove = userToRemove?.id;
    const cmNameToRemove = userToRemove?.full_name;

    const existingRemoval = pendingChanges.find(
      (change) =>
        change.userId === user.id &&
        change.type === type &&
        change.remove === true &&
        change.cmIdToRemove === cmIdToRemove,
    );

    if (!existingRemoval) {
      setPendingChanges((prev) => [
        ...prev,
        {
          userId: user.id,
          type: type,
          remove: true,
          cmIdToRemove: cmIdToRemove,
          cmNameToRemove: cmNameToRemove,
        },
      ]);
    }
  };

  const queueRemoveClientCM = (client: User, cmToRemove: GetUser) => {
    const existingRemoval = pendingChanges.find(
      (change) =>
        change.type === "remove_client_cm" &&
        change.clientToRemoveCMFromId === client.id &&
        change.cmToRemoveFromClientId === cmToRemove.id,
    );

    if (!existingRemoval) {
      setPendingChanges((prev) => [
        ...prev,
        {
          userId: client.id,
          type: "remove_client_cm",
          remove: true,
          clientToRemoveCMFromId: client.id,
          cmToRemoveFromClientId: cmToRemove.id,
          cmNameToRemoveFromClient: cmToRemove.full_name,
        },
      ]);
    }
  };

  const saveAllAssignments = async () => {
    try {
      for (const change of pendingChanges) {
        if (change.remove) {
          if (change.type === "moderator") {
            const result: ServiceResult = await removeModeratorServer(
              change.userId,
            );
            if (isServiceError(result)) {
              console.error(
                `Error removing moderator for user ${change.userId}:`,
                result.error,
              );
              alert(
                `Error removing moderator for user ${change.userId}: ${result.error}`,
              );
              return;
            }
          } else if (change.type === "cm" && change.cmIdToRemove) {
            const result: ServiceResult = await removeCommunityManagerServer(
              change.userId,
              change.cmIdToRemove,
            );
            if (isServiceError(result)) {
              console.error(
                `Error removing CM ${change.cmNameToRemove} for moderator ${change.userId}:`,
                result.error,
              );
              alert(
                `Error removing CM ${change.cmNameToRemove} for moderator ${change.userId}: ${result.error}`,
              );
              return;
            }
          } else if (change.type === "client") {
            console.log("remove client assignment not implemented");
          } else if (
            change.type === "remove_client_cm" &&
            change.clientToRemoveCMFromId &&
            change.cmToRemoveFromClientId
          ) {
            const result: ServiceResult =
              await removeClientCommunityManagerServerAction(
                change.clientToRemoveCMFromId,
                change.cmToRemoveFromClientId,
              );
            if (isServiceError(result)) {
              console.error(
                `Error removing CM ${change.cmNameToRemoveFromClient} from client ${change.clientToRemoveCMFromId}:`,
                result.error,
              );
              alert(
                `Error removing CM ${change.cmNameToRemoveFromClient} from client ${change.clientToRemoveCMFromId}: ${result.error}`,
              );
              return;
            }
          }
        } else if (change.type === "cm_to_client") {
          if (
            change.clientForCMAssignmentId &&
            change.cmToAssignToClientId &&
            change.cmToAssignToClientName
          ) {
            const result: ServiceResult = await assignCMToClientServerAction(
              change.clientForCMAssignmentId,
              change.cmToAssignToClientId,
            );
            if (isServiceError(result)) {
              console.error(
                `Error assigning CM ${change.cmToAssignToClientName} to client ${change.clientForCMAssignmentId}:`,
                result.error,
              );
              alert(
                `Error assigning CM ${change.cmToAssignToClientName} to client ${change.clientForCMAssignmentId}: ${result.error}`,
              );
              return;
            }
          }
        } else if (change.assignedId) {
          if (change.type === "moderator") {
            const result: ServiceResult = await assignModeratorServer(
              change.userId,
              change.assignedId,
            );
            if (isServiceError(result)) {
              console.error(
                `Error assigning moderator ${change.assignedName} to user ${change.userId}:`,
                result.error,
              );
              alert(
                `Error assigning moderator ${change.assignedName} to user ${change.userId}: ${result.error}`,
              );
              return;
            }
            setUsers((prevUsers) =>
              prevUsers.map((user) =>
                user.id === change.userId
                  ? { ...user, assigned_moderator: change.assignedName }
                  : user,
              ),
            );
          } else if (change.type === "cm") {
            const result: ServiceResult = await assignCommunityManagerServer(
              change.userId,
              change.assignedId,
            );
            if (isServiceError(result)) {
              console.error(
                `Error assigning CM ${change.assignedName} to moderator ${change.userId}:`,
                result.error,
              );
              alert(
                `Error assigning CM ${change.assignedName} to moderator ${change.userId}: ${result.error}`,
              );
              return;
            }
            setUsers((prevUsers) =>
              prevUsers.map((user) =>
                user.id === change.userId
                  ? {
                      ...user,
                      assigned_communitymanagers:
                        user.assigned_communitymanagers
                          ? `${user.assigned_communitymanagers}, ${change.assignedName}`
                          : change.assignedName,
                    }
                  : user,
              ),
            );
          } else if (change.type === "client") {
            console.log("assign client not implemented");
            setUsers((prevUsers) =>
              prevUsers.map((user) =>
                user.id === change.userId
                  ? { ...user, assigned_client: change.assignedName }
                  : user,
              ),
            );
          }
        }
      }

      // Refresh data to reflect server state after changes (bypass cache since data was modified)
      await fetchUsers(true);
      setPendingChanges([]);

      // Notify other users via WebSocket that user data has changed
      sendUserDataMessage({
        type: "assignment_changed",
        action: "assignment_updated",
        data: {
          source: "assignment_changes",
          changes_count: pendingChanges.length,
        },
      });

      // Also dispatch custom event as fallback
      const event = new CustomEvent("userDataChanged", {
        detail: { source: "assignment_changes" },
      });
      window.dispatchEvent(event);
    } catch (error) {
      console.error("An error occurred while saving assignments:", error);
      alert("An error occurred while saving assignments.");
    }
  };

  const openAssignCMToClientModal = (user: User) => {
    setSelectedClientForCMAssignment(user);
    setShowAssignCMToClientModal(true);
  };

  const confirmAssignCMToClient = (cmId: number) => {
    if (!selectedClientForCMAssignment) {
      alert("No client selected for CM assignment.");
      return;
    }
    if (!cmId) {
      alert("Please select a community manager to assign.");
      return;
    }
    const cmToAssign = users.find((u) => u.id === cmId);
    if (!cmToAssign) {
      alert("Selected community manager not found.");
      return;
    }
    const updated = [...pendingChanges];
    updated.push({
      userId: selectedClientForCMAssignment.id,
      type: "cm_to_client",
      clientForCMAssignmentId: selectedClientForCMAssignment.id,
      cmToAssignToClientId: cmId,
      cmToAssignToClientName: cmToAssign.full_name,
    });
    setPendingChanges(updated);
    setShowAssignCMToClientModal(false);
    alert(
      `Assignment of CM ${cmToAssign.full_name} to client ${selectedClientForCMAssignment.full_name} queued. Please save assignments.`,
    );
  };

  const handleSaveAssignments = () => {
    setOnConfirm(() => async () => {
      try {
        await saveAllAssignments();
        setShowConfirmModal(false);
      } catch (error) {
        console.error("Error saving assignments:", error);
        alert("Failed to save assignments.");
      }
    });
    setShowConfirmModal(true);
  };

  const clearPendingChanges = () => setPendingChanges([]);

  const sortedFilteredUsers = sortColumn
    ? [...filteredByName].sort((a, b) => {
        let valueA: string | null | undefined;
        let valueB: string | null | undefined;
        if (sortColumn === "name") {
          valueA = a.full_name?.toLowerCase();
          valueB = b.full_name?.toLowerCase();
        } else if (sortColumn === "assignedClient") {
          valueA = a.assigned_client?.toLowerCase() ?? "";
          valueB = b.assigned_client?.toLowerCase() ?? "";
        } else if (sortColumn === "assignedModerators") {
          valueA = a.assigned_moderator?.toLowerCase() ?? "";
          valueB = b.assigned_moderator?.toLowerCase() ?? "";
        } else if (sortColumn === "assignedCMs") {
          const getCMs = (user: ExtendedUser): string => {
            if (user.role == "client" && user.clientAssignedCommunityManagers) {
              return user.clientAssignedCommunityManagers
                .map((cm) => cm.full_name)
                .join(", ")
                .toLowerCase();
            } else if (user.assigned_communitymanagers) {
              return user.assigned_communitymanagers.toLowerCase();
            }
            return "";
          };
          valueA = getCMs(a);
          valueB = getCMs(b);
        }
        const safeValueA = valueA ?? "";
        const safeValueB = valueB ?? "";
        return sortDirection === "asc"
          ? safeValueA.localeCompare(safeValueB)
          : safeValueB.localeCompare(safeValueA);
      })
    : filteredByName;

  return (
    <div className="rounded-xl bg-white p-6 shadow dark:bg-gray-800">
      <h1 className="mb-7 text-body-2xlg font-bold text-dark dark:text-white">
        Assignment Table
      </h1>

      <div className="mb-6 flex flex-wrap items-center justify-between">
        <div className="flex space-x-2">
          {tabs.map((tab) => (
            <button
              key={tab}
              className={`rounded-full px-4 py-2 font-medium transition-colors duration-200 ${
                activeTab === tab
                  ? "bg-primary text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
              }`}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
        </div>
        <div className="flex items-center rounded-md border border-gray-300 bg-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 max-md:mt-4">
          <Search className="ml-2 text-gray-500 dark:text-gray-400" size={16} />
          <input
            type="text"
            placeholder="Search by name or email"
            className="block w-48 bg-transparent p-3 text-gray-900 placeholder-gray-500 dark:text-white dark:placeholder-gray-400 sm:text-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <PendingChangesBanner changes={pendingChanges} users={users} />

      <table className="mb-6 min-w-full table-auto bg-white dark:bg-gray-800">
        <thead className="bg-gray-50 dark:bg-gray-700">
          <tr>
            <th
              className="cursor-pointer border border-gray-300 px-4 py-2 font-bold text-black dark:border-gray-600 dark:text-white"
              onClick={() => sortUsers("name")}
            >
              <div className="flex items-center gap-1">
                Name
                {sortColumn === "name" && sortDirection === "asc" && (
                  <ArrowUp size={12} />
                )}
                {sortColumn === "name" && sortDirection === "desc" && (
                  <ArrowDown size={12} />
                )}
                {sortColumn !== "name" && <ArrowUpDown size={12} />}
              </div>
            </th>
            <th className="border border-gray-300 px-4 py-2 font-bold text-black dark:border-gray-600 dark:text-white">
              Email
            </th>
            <th className="border border-gray-300 px-4 py-2 font-bold text-black dark:border-gray-600 dark:text-white">
              Role
            </th>
            {activeTab !== "Client" && activeTab !== "Administrator" && (
              <th
                className="cursor-pointer border border-gray-300 px-4 py-2 font-bold text-black dark:border-gray-600 dark:text-white"
                onClick={() => sortUsers("assignedClient")}
              >
                <div className="flex items-center gap-1">
                  Assigned Client
                  {sortColumn === "assignedClient" &&
                    sortDirection === "asc" && <ArrowUp size={12} />}
                  {sortColumn === "assignedClient" &&
                    sortDirection === "desc" && <ArrowDown size={12} />}
                  {sortColumn !== "assignedClient" && <ArrowUpDown size={12} />}
                </div>
              </th>
            )}
            {activeTab !== "Moderator" && (
              <th
                className="cursor-pointer border border-gray-300 px-4 py-2 font-bold text-black dark:border-gray-600 dark:text-white"
                onClick={() => sortUsers("assignedModerators")}
              >
                <div className="flex items-center gap-1">
                  Assigned Moderators
                  {sortColumn === "assignedModerators" &&
                    sortDirection === "asc" && <ArrowUp size={12} />}
                  {sortColumn === "assignedModerators" &&
                    sortDirection === "desc" && <ArrowDown size={12} />}
                  {sortColumn !== "assignedModerators" && (
                    <ArrowUpDown size={12} />
                  )}
                </div>
              </th>
            )}
            {activeTab !== "Community Manager" &&
              activeTab !== "Administrator" && (
                <th
                  className="cursor-pointer border border-gray-300 px-4 py-2 font-bold text-black dark:border-gray-600 dark:text-white"
                  onClick={() => sortUsers("assignedCMs")}
                >
                  <div className="flex items-center gap-1">
                    Assigned CM(s)
                    {sortColumn === "assignedCMs" &&
                      sortDirection === "asc" && <ArrowUp size={12} />}
                    {sortColumn === "assignedCMs" &&
                      sortDirection === "desc" && <ArrowDown size={12} />}
                    {sortColumn !== "assignedCMs" && <ArrowUpDown size={12} />}
                  </div>
                </th>
              )}
            <th className="border border-gray-300 px-4 py-2 font-bold text-black dark:border-gray-600 dark:text-white">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {sortedFilteredUsers.map((user) => {
            const pending = pendingChanges.find(
              (a) =>
                a.userId === user.id && !a.remove && a.type !== "cm_to_client",
            );
            const pendingRemoval = pendingChanges.find(
              (a) =>
                a.userId === user.id &&
                a.remove &&
                a.type !== "remove_client_cm",
            );
            const pendingCMToClient = pendingChanges.find(
              (a) =>
                a.clientForCMAssignmentId === user.id &&
                a.type === "cm_to_client",
            );
            const pendingClientCMRemoval = pendingChanges.find(
              (a) =>
                a.clientToRemoveCMFromId === user.id &&
                a.type === "remove_client_cm" &&
                a.remove,
            );

            return (
              <tr
                key={user.id}
                className="hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <td className="border border-gray-300 px-4 py-2 text-gray-800 dark:border-gray-600 dark:text-gray-200">
                  <div className="flex items-center gap-3">
                    <Image
                      src={getImageUrl(user.user_image)}
                      className="size-12 rounded-full object-cover"
                      alt={`Avatar of ${user.full_name || "user"}`}
                      role="presentation"
                      width={48}
                      height={48}
                      priority
                      onError={(e) => {
                        console.error(
                          "Error loading user image",
                          user.full_name,
                        );
                        (e.currentTarget as HTMLImageElement).src =
                          "/images/user/user-03.png";
                      }}
                    />
                    <span>{user.full_name || user.email.split("@")[0]}</span>
                  </div>
                </td>
                <td className="border border-gray-300 px-4 py-2 text-gray-800 dark:border-gray-600 dark:text-gray-200">
                  {user.email}
                </td>
                <td className="border border-gray-300 px-4 py-2 text-gray-800 dark:border-gray-600 dark:text-gray-200">
                  {user.role
                    ? user.role === "community_manager"
                      ? "Community Manager"
                      : user.role === "super_administrator"
                        ? "Super Administrator"
                        : user.role.charAt(0).toUpperCase() +
                          user.role.slice(1).replace(/_/g, " ")
                    : "No Role"}
                </td>

                {activeTab !== "Client" && activeTab !== "Administrator" && (
                  <td className="border px-4 py-2 text-gray-800">
                    {user.assigned_client ? (
                      <div className="my-2 flex items-center justify-between gap-2">
                        <span>{user.assigned_client}</span>
                        <button
                          className="ml-2 rounded bg-red-500 px-2 py-1 text-xs text-white hover:bg-red-600"
                          onClick={() => queueRemoveAssignment(user, "client")}
                        >
                          Remove
                        </button>
                      </div>
                    ) : (
                      <span className="text-gray-500">No Assignment</span>
                    )}
                    {pending?.type === "client" && (
                      <span className="font-semibold text-yellow-600">
                        Pending: {pending.assignedName}
                      </span>
                    )}
                    {pendingRemoval?.type === "client" && (
                      <span className="font-semibold text-red-600">
                        Pending Removal
                      </span>
                    )}
                  </td>
                )}

                {activeTab !== "Moderator" && (
                  <td className="border border-gray-300 px-4 py-2 text-gray-800 dark:border-gray-600 dark:text-gray-200">
                    {user.role === "community_manager" ? (
                      user.assigned_moderator ? (
                        <div className="flex items-center gap-2">
                          {(() => {
                            const moderatorUser = users.find(
                              (u) => u.full_name === user.assigned_moderator,
                            );
                            return (
                              <Image
                                src={getImageUrl(moderatorUser?.user_image)}
                                className="size-8 rounded-full object-cover"
                                alt={`Avatar of ${user.assigned_moderator}`}
                                role="presentation"
                                width={32}
                                height={32}
                                onError={(e) => {
                                  (e.currentTarget as HTMLImageElement).src =
                                    "/images/user/user-03.png";
                                }}
                              />
                            );
                          })()}
                          <span>{user.assigned_moderator}</span>
                        </div>
                      ) : (
                        <span className="text-gray-500 dark:text-gray-400">
                          No Assigned Moderator
                        </span>
                      )
                    ) : user.assigned_moderator ? (
                      <div className="my-2 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          {(() => {
                            const moderatorUser = users.find(
                              (u) => u.full_name === user.assigned_moderator,
                            );
                            return (
                              <Image
                                src={getImageUrl(moderatorUser?.user_image)}
                                className="size-8 rounded-full object-cover"
                                alt={`Avatar of ${user.assigned_moderator}`}
                                role="presentation"
                                width={32}
                                height={32}
                                onError={(e) => {
                                  (e.currentTarget as HTMLImageElement).src =
                                    "/images/user/user-03.png";
                                }}
                              />
                            );
                          })()}
                          <span>{user.assigned_moderator}</span>
                        </div>
                        <button
                          className="flex rounded p-1 text-xs text-red-500 hover:text-red-700"
                          onClick={() =>
                            queueRemoveAssignment(user, "moderator")
                          }
                        >
                          <UserMinus size={22} />
                        </button>
                      </div>
                    ) : (
                      <span className="text-gray-500 dark:text-gray-400">
                        No Assignment
                      </span>
                    )}
                    {pending?.type === "moderator" && (
                      <span className="font-semibold text-yellow-600 dark:text-yellow-400">
                        Pending: {pending.assignedName}
                      </span>
                    )}
                    {pendingRemoval?.type === "moderator" && (
                      <span className="font-semibold text-red-600 dark:text-red-400">
                        Pending Removal
                      </span>
                    )}
                  </td>
                )}

                {activeTab !== "Community Manager" &&
                  activeTab !== "Administrator" && (
                    <td className="border border-gray-300 text-gray-800 dark:border-gray-600 dark:text-gray-200">
                      <div className="space-y-3">
                        <div>
                          {user.role === "client" &&
                          user.clientAssignedCommunityManagers &&
                          user.clientAssignedCommunityManagers.length > 0 ? (
                            <ul className="list-inside list-disc divide-y divide-gray-200 dark:divide-gray-600">
                              {user.clientAssignedCommunityManagers.map(
                                (cm) => (
                                  <li
                                    key={cm.id}
                                    className="flex items-center justify-between gap-2 px-4 py-2"
                                  >
                                    <div className="flex items-center gap-2">
                                      <Image
                                        src={getImageUrl(cm.user_image)}
                                        className="size-8 rounded-full object-cover"
                                        alt={`Avatar of ${cm.full_name || cm.email}`}
                                        role="presentation"
                                        width={32}
                                        height={32}
                                        onError={(e) => {
                                          (
                                            e.currentTarget as HTMLImageElement
                                          ).src = "/images/user/user-03.png";
                                        }}
                                      />
                                      <span>{cm.full_name || cm.email}</span>
                                    </div>
                                    <button
                                      className="flex rounded p-1 text-xs text-red-500 hover:text-red-700"
                                      onClick={() =>
                                        queueRemoveClientCM(user, cm)
                                      }
                                    >
                                      <UserMinus size={22} />
                                    </button>
                                  </li>
                                ),
                              )}
                            </ul>
                          ) : user.assigned_communitymanagers ? (
                            <ul className="list-inside list-disc divide-y divide-gray-200 dark:divide-gray-600">
                              {user.assigned_communitymanagers
                                .split(",")
                                .map((cm, index) => {
                                  const communityManager = users.find(
                                    (u) => u.full_name?.trim() === cm.trim(),
                                  );
                                  return (
                                    <li
                                      key={index}
                                      className="flex items-center justify-between gap-2 px-3 py-2"
                                    >
                                      <div className="flex items-center gap-2">
                                        <Image
                                          src={getImageUrl(
                                            communityManager?.user_image,
                                          )}
                                          className="size-8 rounded-full object-cover"
                                          alt={`Avatar of ${cm.trim() || communityManager?.email}`}
                                          role="presentation"
                                          width={32}
                                          height={32}
                                          onError={(e) => {
                                            (
                                              e.currentTarget as HTMLImageElement
                                            ).src = "/images/user/user-03.png";
                                          }}
                                        />
                                        <span>
                                          {cm.trim() || communityManager?.email}
                                        </span>
                                      </div>
                                      {communityManager && (
                                        <button
                                          className="flex rounded p-1 text-xs text-red-500 hover:text-red-700"
                                          onClick={() =>
                                            queueRemoveAssignment(user, "cm", {
                                              id: communityManager.id,
                                              full_name:
                                                communityManager.full_name ||
                                                "",
                                              email: communityManager.email,
                                              user_image:
                                                communityManager.user_image,
                                            } as GetUser)
                                          }
                                        >
                                          <UserMinus size={22} />
                                        </button>
                                      )}
                                    </li>
                                  );
                                })}
                            </ul>
                          ) : (
                            <span className="px-3 py-2 text-gray-500 dark:text-gray-400">
                              No Assignment
                            </span>
                          )}
                        </div>

                        {(pending?.type === "cm" ||
                          (pendingRemoval?.type === "cm" &&
                            pendingRemoval.cmNameToRemove) ||
                          (user.role === "client" &&
                            pendingClientCMRemoval?.type ===
                              "remove_client_cm" &&
                            pendingClientCMRemoval.cmNameToRemoveFromClient) ||
                          (user.role === "client" &&
                            pendingCMToClient?.type === "cm_to_client")) && (
                          <>
                            <hr className="mx-[-16px] border-gray-300 dark:border-gray-600" />
                            <div className="space-y-1">
                              {pending?.type === "cm" && (
                                <span className="block font-semibold text-yellow-600 dark:text-yellow-400">
                                  Pending: {pending.assignedName}
                                </span>
                              )}
                              {pendingRemoval?.type === "cm" &&
                                pendingRemoval.cmNameToRemove && (
                                  <span className="block font-semibold text-red-600 dark:text-red-400">
                                    Pending Removal:{" "}
                                    {pendingRemoval.cmNameToRemove}
                                  </span>
                                )}
                              {user.role === "client" &&
                                pendingClientCMRemoval?.type ===
                                  "remove_client_cm" &&
                                pendingClientCMRemoval.cmNameToRemoveFromClient && (
                                  <span className="block font-semibold text-red-600 dark:text-red-400">
                                    Pending Removal:{" "}
                                    {
                                      pendingClientCMRemoval.cmNameToRemoveFromClient
                                    }
                                  </span>
                                )}
                              {user.role === "client" &&
                                pendingCMToClient?.type === "cm_to_client" && (
                                  <span className="block font-semibold text-yellow-600 dark:text-yellow-400">
                                    Pending CM:{" "}
                                    {pendingCMToClient.cmToAssignToClientName}
                                  </span>
                                )}
                            </div>
                          </>
                        )}
                      </div>
                    </td>
                  )}

                <td className="border border-gray-300 px-4 py-2 text-gray-800 dark:border-gray-600 dark:text-gray-200">
                  {user.role === "moderator" && (
                    <button
                      className="mb-2 block rounded-lg px-4 py-2 text-white transition duration-300 ease-in-out hover:bg-[#8a11df] hover:shadow-lg"
                      style={{ backgroundColor: "#8a11df" }}
                      onClick={() => openAssignModal(user, "cm")}
                    >
                      Assign CM
                    </button>
                  )}
                  {user.role === "client" && (
                    <div>
                      <button
                        className="mb-2 block rounded-lg px-4 py-2 text-white transition duration-300 ease-in-out hover:bg-[#7a6cc5] hover:shadow-lg"
                        style={{ backgroundColor: "#7a6cc5" }}
                        onClick={() => openAssignModal(user, "moderator")}
                      >
                        Assign Moderator
                      </button>
                      {user.assigned_moderator && (
                        <button
                          className="mb-2 block rounded-lg px-4 py-2 text-white transition duration-300 ease-in-out hover:bg-[#7d009f] hover:shadow-lg"
                          style={{ backgroundColor: "#7d009f" }}
                          onClick={() => openAssignCMToClientModal(user)}
                        >
                          Assign CM to Client
                        </button>
                      )}
                      {pendingCMToClient?.type === "cm_to_client" && (
                        <span className="font-semibold text-yellow-600 dark:text-yellow-400">
                          Pending CM: {pendingCMToClient.cmToAssignToClientName}
                        </span>
                      )}
                    </div>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {pendingChanges.length > 0 && (
        <div className="flex space-x-2">
          <button
            className="hover:bg-primary-dark rounded-full bg-primary px-4 py-2 text-white"
            onClick={handleSaveAssignments}
          >
            Save All Assignments
          </button>
          <button
            className="rounded-full bg-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-400 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500"
            onClick={clearPendingChanges}
          >
            Cancel
          </button>
        </div>
      )}

      <AssignmentModal
        isOpen={showModal && !!selectedUser && !!assignmentType}
        onClose={() => setShowModal(false)}
        onConfirm={(id) => confirmAssignment(id)}
        assignmentType={assignmentType || "moderator"}
        users={users}
      />

      {showAssignCMToClientModal && selectedClientForCMAssignment && (
        <AssignCMToClientModal
          isOpen={showAssignCMToClientModal}
          onClose={() => setShowAssignCMToClientModal(false)}
          onConfirm={(cmId) => confirmAssignCMToClient(cmId)}
          users={users}
          client={selectedClientForCMAssignment}
        />
      )}

      <ConfirmModal
        isOpen={showConfirmModal}
        onCancel={() => setShowConfirmModal(false)}
        onConfirm={onConfirm}
      />
    </div>
  );
}
