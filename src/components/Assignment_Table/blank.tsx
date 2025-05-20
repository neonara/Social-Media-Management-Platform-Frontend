"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  getUsers,
  removeModeratorServer,
  assignModeratorServer,
  removeCommunityManagerServer,
  assignCommunityManagerServer,
  assignCMToClientServerAction,
  getClientAssignedCommunityManagersServerAction,
  removeClientCommunityManagerServerAction, // Import the new service function
} from "@/services/userService";
import { FaSort, FaSortUp, FaSortDown, FaSearch } from "react-icons/fa"; // Import sort and search icons

type GetUser = {
  id: number;
  full_name: string;
  email: string;
  // ... other relevant CM details
};

type User = {
  id: number;
  email: string;
  full_name: string;
  roles: string[];
  assigned_moderator?: string | null;
  assigned_communitymanagers?: string | null; // For moderators' CMs
  assigned_communitymanagerstoclient?: string | null; // For clients' CMs (currently a string)
  assigned_client?: string | null;
  managed_clients?: string[] | null; // New field for CMs
  clientAssignedCommunityManagers?: GetUser[]; // New field to hold assigned CMs for clients
};

type PendingChange = {
  userId: number; // The user whose assignment is being changed
  type: "moderator" | "cm" | "client" | "cm_to_client" | "remove_client_cm"; // Added 'remove_client_cm'
  assignedId?: number | null;
  assignedName?: string | null;
  remove?: boolean;
  cmIdToRemove?: number | null; // For removing CM from moderator
  cmNameToRemove?: string | null; // For removing CM from moderator
  clientForCMAssignmentId?: number | null; // For CM to Client assignment
  cmToAssignToClientId?: number | null; // For CM to Client assignment
  cmToAssignToClientName?: string | null; // For CM to Client assignment
  cmToRemoveFromClientId?: number | null; // ID of the CM to remove from the client
  clientToRemoveCMFromId?: number | null; // ID of the client to remove the CM from
  cmNameToRemoveFromClient?: string | null; // Name of the CM to remove from the client (for display)
};

const tabs = ["All", "Administrator", "Moderator", "Community Manager", "Client"];

export default function UsersTable() {
  const [users, setUsers] = useState<User[]>([]);
  const [activeTab, setActiveTab] = useState("All");
  const [showModal, setShowModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [assignmentType, setAssignmentType] = useState<"moderator" | "cm" | "client" | null>(null);
  const [selectedAssignId, setSelectedAssignId] = useState<number | null>(null);
  const [pendingChanges, setPendingChanges] = useState<PendingChange[]>([]);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc" | null>(null);
  const [sortColumn, setSortColumn] = useState<"name" | "assignedClient" | "assignedModerators" | "assignedCMs" | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAssignCMToClientModal, setShowAssignCMToClientModal] = useState(false);
  const [selectedClientForCMAssignment, setSelectedClientForCMAssignment] = useState<User | null>(null);
  const [selectedCMToAssignToClient, setSelectedCMToAssignToClient] = useState<number | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false); // State for modal
  const [onConfirm, setOnConfirm] = useState<() => void>(() => () => {}); // Callback for confirm action

  const fetchUsers = useCallback(async () => {
    try {
      const fetchedUsers = await getUsers();
      if (fetchedUsers && Array.isArray(fetchedUsers)) {
        const usersWithAssignedCMs = await Promise.all(
          fetchedUsers.map(async (user: User) => {
            if (user.roles.includes("client")) {
              const assignedCMsResult = await getClientAssignedCommunityManagersServerAction(user.id);
              if (Array.isArray(assignedCMsResult)) {
                return { ...user, clientAssignedCommunityManagers: assignedCMsResult };
              } else if ('error' in assignedCMsResult) {
                console.error(`Error fetching assigned CMs for client ${user.full_name} (ID: ${user.id}):`, assignedCMsResult.error);
                return { ...user, clientAssignedCommunityManagers: [] };
              }
            }
            return user;
          })
        );
        setUsers(usersWithAssignedCMs as User[]);
      } else if (fetchedUsers?.error) {
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
    fetchUsers();
  }, [fetchUsers]);

  const sortUsers = (column: "name" | "assignedClient" | "assignedModerators" | "assignedCMs") => {
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
          if (user.roles.includes("client") && user.clientAssignedCommunityManagers) {
            return user.clientAssignedCommunityManagers.map(cm => cm.full_name).join(", ").toLowerCase();
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
      : users.filter((user) =>
          user.roles.some((role) => {
            const formattedRole =
              role === "community_manager"
                ? "Community Manager"
                : role.charAt(0).toUpperCase() + role.slice(1);
            return formattedRole === activeTab;
          })
        );

  const filteredByName = filteredByRole.filter(user =>
    user.full_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const openAssignModal = (user: User, type: "moderator" | "cm" | "client") => {
    setSelectedUser(user);
    setAssignmentType(type);
    setShowModal(true);
    setSelectedAssignId(null);
  };

  const confirmAssignment = () => {
    if (!selectedUser || !assignmentType || !selectedAssignId) return;

    const selectedAssignUser = users.find((user) => user.id === selectedAssignId);
    if (!selectedAssignUser) return;

    const updated = [...pendingChanges];
    const existingIndex = updated.findIndex(
      (item) => item.userId === selectedUser.id && item.type === assignmentType && !item.remove
    );

    if (existingIndex !== -1) {
      updated[existingIndex].assignedId = selectedAssignId;
      updated[existingIndex].assignedName = selectedAssignUser.full_name;
    } else {
      updated.push({
        userId: selectedUser.id,
        type: assignmentType,
        assignedId: selectedAssignId,
        assignedName: selectedAssignUser.full_name,
      });
    }

    setPendingChanges(updated);
    setShowModal(false);
  };

  const queueRemoveAssignment = (user: User, type: "moderator" | "cm" | "client", userToRemove?: GetUser | null) => {
    const cmIdToRemove = userToRemove?.id;
    const cmNameToRemove = userToRemove?.full_name;

    const existingRemoval = pendingChanges.find(
      (change) =>
        change.userId === user.id &&
        change.type === type &&
        change.remove === true &&
        change.cmIdToRemove === cmIdToRemove
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
        change.cmToRemoveFromClientId === cmToRemove.id
    );

    if (!existingRemoval) {
      setPendingChanges((prev) => [
        ...prev,
        {
          userId: client.id, // Using client ID as the main user for this change
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
            const result = await removeModeratorServer(change.userId);
            if (result?.error) {
              console.error(`Error removing moderator for user ${change.userId}:`, result.error);
              alert(`Error removing moderator for user ${change.userId}: ${result.error}`);
              return;
            }
          } else if (change.type === "cm" && change.cmIdToRemove) {
            const result = await removeCommunityManagerServer(change.userId, change.cmIdToRemove);
            if (result?.error) {
              console.error(`Error removing CM ${change.cmNameToRemove} for moderator ${change.userId}:`, result.error);
              alert(`Error removing CM ${change.cmNameToRemove} for moderator ${change.userId}: ${result.error}`);
              return;
            }
          } else if (change.type === "client") {
            // Assuming you have a removeClientServer function
            console.log("Calling removeClientServer (not implemented in this example)");
            // const result = await removeClientServer(change.userId);
            // if (result?.error) { ... }
          } else if (
            change.type === "remove_client_cm" &&
            change.clientToRemoveCMFromId &&
            change.cmToRemoveFromClientId
          ) {
            const result = await removeClientCommunityManagerServerAction(
              change.clientToRemoveCMFromId,
              change.cmToRemoveFromClientId
            );
            if (result?.error) {
              console.error(
                `Error removing CM ${change.cmNameToRemoveFromClient} from client ${change.clientToRemoveCMFromId}:`,
                result.error
              );
              alert(
                `Error removing CM ${change.cmNameToRemoveFromClient} from client ${change.clientToRemoveCMFromId}: ${result.error}`
              );
              return;
            }
          }
        } else if (change.type === "cm_to_client") {
          // Fix: Handle "add CM to client" logic
          if (
            change.clientForCMAssignmentId &&
            change.cmToAssignToClientId &&
            change.cmToAssignToClientName
          ) {
            const result = await assignCMToClientServerAction(
              change.clientForCMAssignmentId,
              change.cmToAssignToClientId
            );
            if (result?.error) {
              console.error(
                `Error assigning CM ${change.cmToAssignToClientName} to client ${change.clientForCMAssignmentId}:`,
                result.error
              );
              alert(
                `Error assigning CM ${change.cmToAssignToClientName} to client ${change.clientForCMAssignmentId}: ${result.error}`
              );
              return;
            }

            // Optimistically update the local users state
            (prevUsers: User[]): User[] =>
              prevUsers.map((user: User): User => {
              if (user.id === change.clientForCMAssignmentId) {
                return {
                ...user,
                clientAssignedCommunityManagers: [
                  ...(user.clientAssignedCommunityManagers || []),
                  {
                  id: change.cmToAssignToClientId ?? 0, // Default to 0 if null/undefined
                  full_name: change.cmToAssignToClientName || "Unknown", // Handle null/undefined
                  email: "", // Add other fields if necessary
                  } as GetUser,
                ],
                };
              }
              return user;
              });
          }
        } else if (change.assignedId) {
          if (change.type === "moderator") {
            const result = await assignModeratorServer(change.userId, change.assignedId);
            if (result?.error) {
              console.error(`Error assigning moderator ${change.assignedName} to user ${change.userId}:`, result.error);
              alert(`Error assigning moderator ${change.assignedName} to user ${change.userId}: ${result.error}`);
              return;
            }
            // Optimistically update the local users state
            setUsers((prevUsers) =>
              prevUsers.map((user) =>
                user.id === change.userId ? { ...user, assigned_moderator: change.assignedName } : user
              )
            );
          } else if (change.type === "cm" && change.assignedId) {
            const result = await assignCommunityManagerServer(change.userId, change.assignedId);
            if (result?.error) {
              console.error(`Error assigning CM ${change.assignedName} to moderator ${change.userId}:`, result.error);
              alert(`Error assigning CM ${change.assignedName} to moderator ${change.userId}: ${result.error}`);
              return;
            }
            // Optimistically update the local users state
            setUsers((prevUsers) =>
              prevUsers.map((user) =>
                user.id === change.userId ? { ...user, assigned_communitymanagers: user.assigned_communitymanagers ? `${user.assigned_communitymanagers}, ${change.assignedName}` : change.assignedName } : user
              )
            );
          } else if (change.type === "client" && change.assignedId) {
            // Assuming you have an assignClientServer function
            console.log("Calling assignClientServer (not implemented in this example)");
            // const result = await assignClientServer(change.userId, change.assignedId);
            // if (result?.error) { ... }
            // Optimistically update the local users state
            setUsers((prevUsers) =>
              prevUsers.map((user) =>
                user.id === change.userId ? { ...user, assigned_client: change.assignedName } : user
              )
            );
          }
        }
      }

      setPendingChanges([]);
      fetchUsers(); // Re-fetch to ensure data is up-to-date after all changes
    } catch (err) {
      console.error("Error saving assignments:", err);
    }
  };

  const clearPendingChanges = () => {
    setPendingChanges([]);
  };

  const openAssignCMToClientModal = (client: User) => {
    setSelectedClientForCMAssignment(client);
    setShowAssignCMToClientModal(true);
    setSelectedCMToAssignToClient(null); // Reset selected CM when opening modal
  };

  const confirmAssignCMToClient = () => {
    if (!selectedClientForCMAssignment?.id || !selectedCMToAssignToClient) {
      alert("Please select a community manager to assign.");
      return;
    }

    const cmToAssign = users.find(u => u.id === selectedCMToAssignToClient);
    if (!cmToAssign) {
      alert("Selected community manager not found.");
      return;
    }

    const updated = [...pendingChanges];
    updated.push({
      userId: selectedClientForCMAssignment.id,
      type: "cm_to_client",
      clientForCMAssignmentId: selectedClientForCMAssignment.id,
      cmToAssignToClientId: selectedCMToAssignToClient,
      cmToAssignToClientName: cmToAssign.full_name,
    });

    setPendingChanges(updated);
    setShowAssignCMToClientModal(false);
    alert(`Assignment of CM ${cmToAssign.full_name} to client ${selectedClientForCMAssignment.full_name} queued. Please save assignments.`);
  };

  const handleSaveAssignments = () => {
    // Show the confirmation modal
    setOnConfirm(() => async () => {
      try {
        await saveAllAssignments(); // Call the save function
        setShowConfirmModal(false); // Close the modal
      } catch (error) {
        console.error("Error saving assignments:", error);
        alert("Failed to save assignments.");
      }
    });
    setShowConfirmModal(true);
  };

  const sortedFilteredUsers = sortColumn
    ? [...filteredByName].sort((a, b) => {
        let valueA: string | null | undefined;
        let valueB: string | null | undefined;

        if (sortColumn === "name") {
          valueA = a.full_name?.toLowerCase();
          valueB = b.full_name?.toLowerCase();
        } else if (sortColumn === "assignedClient") {valueA = a.assigned_client?.toLowerCase() ?? "";
          valueB = b.assigned_client?.toLowerCase() ?? "";
        } else if (sortColumn === "assignedModerators") {
          valueA = a.assigned_moderator?.toLowerCase() ?? "";
          valueB = b.assigned_moderator?.toLowerCase() ?? "";
        } else if (sortColumn === "assignedCMs") {
          const getCMs = (user: User): string => {
            if (user.roles.includes("client") && user.clientAssignedCommunityManagers) {
              return user.clientAssignedCommunityManagers.map(cm => cm.full_name).join(", ").toLowerCase();
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

        return sortDirection === "asc" ? safeValueA.localeCompare(safeValueB) : safeValueB.localeCompare(safeValueA);
      })
    : filteredByName;

  return (
    <div className="p-6 bg-white rounded-xl shadow">
      <h1 className="mb-7 text-body-2xlg font-bold text-dark dark:text-white">
        Assignment Table
      </h1>
      {/* Search and Tabs */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex space-x-2">
          {tabs.map((tab) => (
            <button
              key={tab}
              className={`px-4 py-2 rounded-full font-medium transition-colors duration-200 ${
                activeTab === tab
                  ? "bg-primary text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
        </div>
        <div className="flex items-center ml-4">
          <FaSearch className="mr-2 text-gray-500" />
          <input
            type="text"
            placeholder="Search by Name"
            className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-48 sm:text-sm border-gray-300 rounded-md"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Pending Changes Display */}
      {pendingChanges.length > 0 && (
        <div className="mb-6 p-4 bg-yellow-100 rounded-md shadow-sm">
          <h3 className="text-lg font-semibold mb-2 text-yellow-700">Pending Changes:</h3>
          <ul>
            {pendingChanges.map((change, index) => (
              <li key={index} className="text-yellow-600">
                {users.find(u => u.id === change.userId)?.full_name} -
                {change.remove ? " Removing " : " Assigning "}
                {change.type === "moderator" ? "Moderator" : change.type === "client" ? "Client" : change.type === "cm" ? "CM" : change.type === "cm\_to\_client" ? "CM to Client" : change.type === "remove\_client\_cm" ? "CM from Client" : ""}
                {change.assignedName && !change.remove && change.type !== "cm_to_client" && `to ${change.assignedName}`}
                {change.cmNameToRemove && change.remove && change.type === "cm" && `(${change.cmNameToRemove})`}
                {change.cmToAssignToClientName && change.type === "cm\_to\_client" && `to ${change.cmToAssignToClientName}`}
                {change.cmNameToRemoveFromClient && change.remove && change.type === "remove\_client\_cm" && `(${change.cmNameToRemoveFromClient})`}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Table */}
      <table className="min-w-full table-auto mb-6">
         <thead>
          <tr>
            <th
              className="px-4 py-2 border font-bold text-black cursor-pointer"
              onClick={() => sortUsers("name")}
            >
              <div className="flex items-center gap-1">
                Name
                {sortColumn === "name" && sortDirection === "asc" && <FaSortUp />}
                {sortColumn === "name" && sortDirection === "desc" && <FaSortDown />}
                {sortColumn !== "name" && <FaSort />}
              </div>
            </th>
            <th className="px-4 py-2 border font-bold text-black">Email</th>
            <th className="px-4 py-2 border font-bold text-black">Roles</th>
            {/* Removed Assigned Client column */}
            <th
              className="px-4 py-2 border font-bold text-black cursor-pointer"
              onClick={() => sortUsers("assignedModerators")}
            >
              <div className="flex items-center gap-1">
                Assigned Moderators
                {sortColumn === "assignedModerators" && sortDirection === "asc" && <FaSortUp />}
                {sortColumn === "assignedModerators" && sortDirection === "desc" && <FaSortDown />}
                {sortColumn !== "assignedModerators" && <FaSort />}
              </div>
            </th>
            <th
              className="px-4 py-2 border font-bold text-black cursor-pointer"
              onClick={() => sortUsers("assignedCMs")}
            >
              <div className="flex items-center gap-1">
                Assigned CM(s)
                {sortColumn === "assignedCMs" && sortDirection === "asc" && <FaSortUp />}
                {sortColumn === "assignedCMs" && sortDirection === "desc" && <FaSortDown />}
                {sortColumn !== "assignedCMs" && <FaSort />}
              </div>
            </th>
            <th className="px-4 py-2 border font-bold text-black">Actions</th>
          </tr>
        </thead>
       
        <tbody>
          {sortedFilteredUsers.map((user) => {
            const pending = pendingChanges.find((a) => a.userId === user.id && !a.remove && a.type !== 'cm_to_client');
            const pendingRemoval = pendingChanges.find((a) => a.userId === user.id && a.remove && a.type !== 'remove_client_cm');
            const pendingCMToClient = pendingChanges.find(
              (a) => a.clientForCMAssignmentId === user.id && a.type === 'cm_to_client'
            );
            const pendingClientCMRemoval = pendingChanges.find(
              (a) => a.clientToRemoveCMFromId === user.id && a.type === 'remove_client_cm' && a.remove
            );

            return (
              <tr key={user.id}>
                <td className="px-4 py-2 border text-gray-800">{user.full_name}</td>
                <td className="px-4 py-2 border text-gray-800">{user.email}</td>
                <td className="px-4 py-2 border text-gray-800">{user.roles.join(", ")}</td>
                {/* Removed Assigned Client cell */}
                <td className="px-4 py-2 border text-gray-800">
                  {user.roles.includes("community_manager") ? (
                    user.assigned_moderator ? (
                      <span>{user.assigned_moderator}</span>
                    ) : (
                      <span className="text-gray-500">No Assigned Moderator</span>
                    )
                  ) : user.assigned_moderator ? (
                    <div className="flex items-center justify-between gap-2">
                      <span>{user.assigned_moderator}</span>
                      <button
                        className="ml-2 px-2 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600"
                        onClick={() => queueRemoveAssignment(user, "moderator")}
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <span className="text-gray-500">No Assignment</span>
                  )}
                  {pending?.type === "moderator" && (
                    <span className="text-yellow-600 font-semibold">Pending: {pending.assignedName}</span>
                  )}
                  {pendingRemoval?.type === "moderator" && (
                    <span className="text-red-600 font-semibold">Pending Removal</span>
                  )}
                </td>
                <td className="px-4 py-2 border text-gray-800">
                  {/* ...existing Assigned CM(s) cell code... */}
                  {user.roles.includes("client") && user.clientAssignedCommunityManagers && user.clientAssignedCommunityManagers.length > 0 ? (
                    <ul className="list-disc list-inside">
                      {user.clientAssignedCommunityManagers.map((cm) => (
                        <li key={cm.id} className="flex items-center justify-between gap-2">
                          <span>{cm.full_name}</span>
                          <button
                            className="ml-2 px-2 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600"
                            onClick={() => queueRemoveClientCM(user, cm)}
                          >
                            Remove
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : user.assigned_communitymanagers ? (
                    <ul className="list-disc list-inside">
                      {user.assigned_communitymanagers.split(",").map((cm, index) => {
                        const communityManager = users.find(u => u.full_name.trim() === cm.trim());
                        return (
                          <li key={index} className="flex items-center justify-between gap-2">
                            <span>{cm.trim()}</span>
                            {communityManager && (
                              <button
                                className="ml-2 px-2 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600"
                                onClick={() => queueRemoveAssignment(user, "cm", communityManager)}
                              >
                                Remove
                              </button>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  ) : (
                    <span className="text-gray-500">No Assignment</span>
                  )}
                  {pending?.type === "cm" && (
                    <span className="text-yellow-600 font-semibold block mt-1">Pending: {pending.assignedName}</span>
                  )}
                  {pendingRemoval?.type === "cm" && pendingRemoval.cmNameToRemove && (
                    <span className="text-red-600 font-semibold block mt-1">Pending Removal: {pendingRemoval.cmNameToRemove}</span>
                  )}
                  {user.roles.includes("client") && pendingClientCMRemoval?.type === 'remove_client_cm' && pendingClientCMRemoval.cmNameToRemoveFromClient && (
                    <span className="text-red-600 font-semibold block mt-1">Pending Removal: {pendingClientCMRemoval.cmNameToRemoveFromClient}</span>
                  )}
                  {user.roles.includes("client") && pendingCMToClient?.type === 'cm_to_client' && (
                    <span className="text-yellow-600 font-semibold block mt-1">Pending CM: {pendingCMToClient.cmToAssignToClientName}</span>
                  )}
                </td>
                <td className="px-4 py-2 border text-gray-800">
                  {/* ...existing Actions cell code... */}
                  {user.roles.includes("moderator") && (
                    <button
                      className="px-4 py-2 text-white rounded-lg hover:bg-[#8a11df] hover:shadow-lg transition duration-300 ease-in-out mb-2 block"
                      style={{ backgroundColor: "#8a11df" }}
                      onClick={() => openAssignModal(user, "cm")}
                    >
                      Assign CM
                    </button>
                  )}
                  {user.roles.includes("client") && (
                    <div>
                      <button
                        className="px-4 py-2 text-white rounded-lg hover:bg-[#7a6cc5] hover:shadow-lg transition duration-300 ease-in-out block mb-2"
                        style={{ backgroundColor: "#7a6cc5" }}
                        onClick={() => openAssignModal(user, "moderator")}
                      >
                        Assign Moderator
                      </button>
                      {user.assigned_moderator && (
                        <button
                          className="px-4 py-2 text-white rounded-lg hover:bg-[#7d009f] hover:shadow-lg transition duration-300 ease-in-out block mb-2"
                          style={{ backgroundColor: "#7d009f" }}
                          onClick={() => openAssignCMToClientModal(user)}
                        >
                          Assign CM to Client
                        </button>
                      )}
                      {pendingCMToClient?.type === 'cm_to_client' && (
                        <span className="text-yellow-600 font-semibold">Pending CM: {pendingCMToClient.cmToAssignToClientName}</span>
                      )}
                    </div>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Save and Cancel Buttons */}
      {pendingChanges.length > 0 && (
        <div className="flex space-x-2">
          <button
            className="px-4 py-2 bg-primary text-white rounded-full hover:bg-primary-dark"
            onClick={handleSaveAssignments}
          >
            Save All Assignments
          </button>
          <button
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded-full hover:bg-gray-400"
            onClick={clearPendingChanges}
          >
            Cancel
          </button>
        </div>
      )}

      {/* Assignment Modal */}
      {showModal && selectedUser && assignmentType && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg shadow-xl">
            <h2 className="text-lg font-semibold mb-4">Assign {assignmentType === "cm" ? "Community Manager" : assignmentType.charAt(0).toUpperCase() + assignmentType.slice(1)}</h2>
            <div>
              <label htmlFor="assignId" className="block mb-2">
                Select {assignmentType === "moderator" ? "Moderator" : assignmentType === "client" ? "Client" : "Community Manager"}:
              </label>
              <select
                id="assignId"
                className="border p-2 rounded w-full"
                onChange={(e) => setSelectedAssignId(Number(e.target.value))}
              >
                <option value="">-- Select --</option>
                {users
                  .filter((user) => {
                    if (assignmentType === "moderator") {
                      return user.roles.includes("moderator");
                    } else if (assignmentType === "client") {
                      return user.roles.includes("client");
                    } else if (assignmentType === "cm") {
                      return user.roles.includes("community_manager");
                    }
                    return false;
                  })
                  .map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.full_name}
                    </option>
                  ))}
              </select>
            </div>
            <div className="mt-4 flex justify-end">
              <button
                className="px-4 py-2 bg-primary text-white rounded-full hover:bg-primary-dark"
                onClick={confirmAssignment}
              >
                Confirm
              </button>
              <button
                className="px-4 py-2 ml-2 bg-gray-300 text-gray-700 rounded-full hover:bg-gray-400"
                onClick={() => setShowModal(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Assign CM to Client Modal */}
      {showAssignCMToClientModal && selectedClientForCMAssignment && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg shadow-xl">
            <h2 className="text-lg font-semibold mb-4">
              Assign CM to {selectedClientForCMAssignment.full_name}
            </h2>
            <div>
              <label htmlFor="cmToAssign" className="block mb-2">
                Select Community Manager:
              </label>
              <select
                id="cmToAssign"
                className="border p-2 rounded w-full"
                onChange={(e) => setSelectedCMToAssignToClient(Number(e.target.value))}
              >
                <option value="">-- Select --</option>
                {users
                  .filter(
                    (user) =>
                      user.roles.includes("community_manager") &&
                      selectedClientForCMAssignment.assigned_moderator &&
                      users.find(
                        (u) => u.full_name === selectedClientForCMAssignment.assigned_moderator
                      )?.assigned_communitymanagers?.split(",")?.map(cm => cm.trim().toLowerCase()).includes(user.full_name.toLowerCase())
                  )
                  .map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.full_name}
                    </option>
                  ))}
              </select>
            </div>
            <div className="mt-4 flex justify-end">
              <button
                className="px-4 py-2 bg-primary text-white rounded-full hover:bg-primary-dark"
                onClick={confirmAssignCMToClient}
              >
                Assign
              </button>
              <button
                className="px-4 py-2 ml-2 bg-gray-300 text-gray-700 rounded-full hover:bg-gray-400"
                onClick={() => setShowAssignCMToClientModal(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-96">
            <h2 className="text-lg font-semibold text-gray-800">
              Confirm Changes
            </h2>
            <p className="text-sm text-gray-600 mt-2">
              Are you sure you want to save these changes?
            </p>
            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={onConfirm}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-opacity-90"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}