"use client";

import React, { useState, useEffect } from "react";
import {
  getUsers,
  removeModeratorServer,
  assignModeratorServer,
  removeCommunityManagerServer,
  assignCommunityManagerServer,
} from "@/services/userService";
import { FaSort, FaSortUp, FaSortDown, FaSearch } from "react-icons/fa"; // Import sort and search icons

type User = {
  id: number;
  email: string;
  full_name: string;
  roles: string[];
  assigned_moderator?: string | null;
  assigned_communitymanagers?: string | null;
};

type PendingAssignment = {
  userId: number;
  type: "moderator" | "cm";
  assignedId?: number | null;
  assignedName?: string;
  remove?: boolean;
  cmIdToRemove?: number;
  cmNameToRemove?: string;
};

const tabs = ["All", "Administrator", "Moderator", "Community Manager", "Client"];

export default function UsersTable() {
  const [users, setUsers] = useState<User[]>([]);
  const [activeTab, setActiveTab] = useState("All");
  const [showModal, setShowModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [assignmentType, setAssignmentType] = useState<"moderator" | "cm" | null>(null);
  const [selectedAssignId, setSelectedAssignId] = useState<number | null>(null);
  const [pendingAssignments, setPendingAssignments] = useState<PendingAssignment[]>([]);
  const [expandedRowId, setExpandedRowId] = useState<number | null>(null);
  const [pendingRemovals, setPendingRemovals] = useState<
    { userId: number; type: "moderator" | "cm"; assignedName?: string; cmIdToRemove?: number; cmNameToRemove?: string }[]
  >([]);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc" | null>(null);
  const [sortColumn, setSortColumn] = useState<"name" | "assignedTo" | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const fetchedUsers = await getUsers();
      if (fetchedUsers && Array.isArray(fetchedUsers)) {
        setUsers(fetchedUsers as User[]);
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
  };

  const sortUsers = (column: "name" | "assignedTo") => {
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
      } else if (column === "assignedTo") {
        const getAssignedToSort = (user: User): string => {
          if (pendingAssignments.find(p => p.userId === user.id && !p.remove)) {
            const pending = pendingAssignments.find(p => p.userId === user.id && !p.remove);
            return `pending ${pending?.type}: ${pending?.assignedName?.toLowerCase() || ""}`;
          }
          if (user.assigned_moderator) {
            return `moderator: ${user.assigned_moderator.toLowerCase()}`;
          }
          if (user.assigned_communitymanagers) {
            return `cm: ${user.assigned_communitymanagers.toLowerCase()}`;
          }
          return "";
        };
        valueA = getAssignedToSort(a);
        valueB = getAssignedToSort(b);
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

  const openAssignModal = (user: User, type: "moderator" | "cm") => {
    setSelectedUser(user);
    setAssignmentType(type);
    setShowModal(true);
    setSelectedAssignId(null);
  };

  const confirmAssignment = () => {
    if (!selectedUser || !assignmentType || !selectedAssignId) return;

    const selectedAssignUser = users.find((user) => user.id === selectedAssignId);
    if (!selectedAssignUser) return;

    const updated = [...pendingAssignments];
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

    setPendingAssignments(updated);
    setShowModal(false);
  };

  const queueRemoveAssignment = (user: User, userToRemove?: User | null) => {
    let type: "moderator" | "cm";
    let cmToRemove: User | undefined;

    if (userToRemove === null) {
      // Removing a moderator from a client
      type = "moderator";
    } else if (userToRemove) {
      // Removing a CM from a moderator
      type = "cm";
      cmToRemove = userToRemove;
    } else {
      console.warn("Unexpected call to queueRemoveAssignment without userToRemove");
      return;
    }

    const removalInfo = {
      userId: user.id,
      type: type,
      assignedName: cmToRemove ? cmToRemove.full_name : user.assigned_moderator || undefined,
      cmIdToRemove: cmToRemove?.id,
      cmNameToRemove: cmToRemove?.full_name,
    };

    setPendingRemovals((prev) => {
      const existing = prev.find(
        (r) => r.userId === user.id && r.type === removalInfo.type && r.cmIdToRemove === removalInfo.cmIdToRemove
      );
      return existing ? prev : [...prev, removalInfo];
    });

    setPendingAssignments((prev) => {
      const existing = prev.find(
        (p) => p.userId === user.id && p.remove && p.type === type && p.cmIdToRemove === removalInfo.cmIdToRemove
      );
      return existing ? prev : [...prev, { userId: user.id, type: type, remove: true, cmIdToRemove: removalInfo.cmIdToRemove, cmNameToRemove: cmToRemove?.full_name }];
    });

    alert("Removal queued. Please review and save assignments to apply.");
  };

  const saveAllAssignments = async () => {
    try {
      for (const assignment of pendingAssignments) {
        if (assignment.remove) {
          if (assignment.type === "moderator") {
            const result = await removeModeratorServer(assignment.userId);
            if (result?.error) {
              console.error(`Error removing moderator for user ${assignment.userId}:`, result.error);
              alert(`Error removing moderator for user ${assignment.userId}: ${result.error}`);
              return;
            }
          } else if (assignment.type === "cm" && assignment.cmIdToRemove) {
            const result = await removeCommunityManagerServer(assignment.userId, assignment.cmIdToRemove);
            if (result?.error) {
              console.error(`Error removing CM ${assignment.cmNameToRemove} for moderator ${assignment.userId}:`, result.error);
              alert(`Error removing CM ${assignment.cmNameToRemove} for moderator ${assignment.userId}: ${result.error}`);
              return;
            }
          }
        } else {
          if (assignment.type === "moderator" && assignment.assignedId) {
            const result = await assignModeratorServer(assignment.userId, assignment.assignedId);
            if (result?.error) {
              console.error(`Error assigning moderator ${assignment.assignedName} to user ${assignment.userId}:`, result.error);
              alert(`Error assigning moderator ${assignment.assignedName} to user ${assignment.userId}: ${result.error}`);
              return;
            }
          } else if (assignment.type === "cm" && assignment.assignedId) {
            const result = await assignCommunityManagerServer(assignment.userId, assignment.assignedId);
            if (result?.error) {
              console.error(`Error assigning CM ${assignment.assignedName} to moderator ${assignment.userId}:`, result.error);
              alert(`Error assigning CM ${assignment.assignedName} to moderator ${assignment.userId}: ${result.error}`);
              return;
            }
          }
        }
      }

      fetchUsers();
      setPendingAssignments([]);
      setPendingRemovals([]);
      alert("Assignments saved successfully!");
    } catch (err) {
      console.error("Error saving assignments:", err);
      alert("Failed to save assignments.");
    }
  };

  const clearPendingChanges = () => {
    setPendingAssignments([]);
    setPendingRemovals([]);
    alert("Pending changes cleared.");
  };

  const sortedFilteredUsers = sortColumn
    ? [...filteredByName].sort((a, b) => {
        let valueA: string | null | undefined;
        let valueB: string | null | undefined;

        if (sortColumn === "name") {
          valueA = a.full_name?.toLowerCase();
          valueB = b.full_name?.toLowerCase();
        } else if (sortColumn === "assignedTo") {
          const getAssignedToSort = (user: User): string => {
            if (pendingAssignments.find(p => p.userId === user.id && !p.remove)) {
              const pending = pendingAssignments.find(p => p.userId === user.id && !p.remove);
              return `pending ${pending?.type}: ${pending?.assignedName?.toLowerCase() || ""}`;
            }
            if (user.assigned_moderator) {
              return `moderator: ${user.assigned_moderator.toLowerCase()}`;
            }
            if (user.assigned_communitymanagers) {
              return `cm: ${user.assigned_communitymanagers.toLowerCase()}`;
            }
            return "";
          };
          valueA = getAssignedToSort(a);
          valueB = getAssignedToSort(b);
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

      {/* Pending Removals Display */}
      {pendingRemovals.length > 0 && (
        <div className="mb-6 p-4 bg-yellow-100 rounded-md shadow-sm">
          <h3 className="text-lg font-semibold mb-2 text-yellow-700">Pending Removals:</h3>
          <ul>
            {pendingRemovals.map((removal, index) => (
              <li key={index} className="text-yellow-600">
                {users.find(u => u.id === removal.userId)?.full_name} - Removing his assigned{" "}
                {removal.type === "moderator" ? "Moderator" : "CM"}{" "}
                {removal.cmNameToRemove && ` (${removal.cmNameToRemove})`}
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
              className="px-4 py-2 border font-bold text-black cursor-pointer flex items-center gap-1"
              onClick={() => sortUsers("name")}
            >
              Name
              {sortColumn === "name" && sortDirection === "asc" && <FaSortUp />}
              {sortColumn === "name" && sortDirection === "desc" && <FaSortDown />}
              {sortColumn !== "name" && <FaSort />}
            </th>
            <th className="px-4 py-2 border font-bold text-black">Email</th>
            <th className="px-4 py-2 border font-bold text-black">Roles</th>
            <th
              className="px-4 py-2 border font-bold text-black cursor-pointer flex items-center gap-1"
              onClick={() => sortUsers("assignedTo")}
            >
              Assigned To
              {sortColumn === "assignedTo" && sortDirection === "asc" && <FaSortUp />}
              {sortColumn === "assignedTo" && sortDirection === "desc" && <FaSortDown />}
              {sortColumn !== "assignedTo" && <FaSort />}
            </th>
            <th className="px-4 py-2 border font-bold text-black">Actions</th>
          </tr>
        </thead>
        <tbody>
          {sortedFilteredUsers.map((user) => {
            const pending = pendingAssignments.find((a) => a.userId === user.id);
            return (
              <tr key={user.id}>
                <td className="px-4 py-2 border text-gray-800">{user.full_name}</td>
                <td className="px-4 py-2 border text-gray-800">{user.email}</td>
                <td className="px-4 py-2 border text-gray-800">{user.roles.join(", ")}</td>
                <td
                  className="px-4 py-2 border cursor-pointer text-gray-800"
                  onClick={() => setExpandedRowId(user.id === expandedRowId ? null : user.id)}
                >
                  {pending?.remove ? (
                    <span className="text-yellow-600 font-semibold">Pending Removal</span>
                  ) : pending ? (
                    `Pending: ${pending.type === "moderator" ? "Moderator" : "CM"} - ${pending.assignedName || "No Assigned Name"}`
                  ) : user.assigned_moderator ? (
                    <div className="flex items-center justify-between gap-2">
                      <span> <b>Moderator:</b> {user.assigned_moderator}</span>
                      <button
                       className="ml-2 px-2 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600"
                        onClick={(e) => {
                          e.stopPropagation();
                          queueRemoveAssignment(user, null); // Indicate removing a moderator
                        }}
                      >
                        Remove
                      </button>
                    </div>
                  ) : user.assigned_communitymanagers ? (
                    <div className="flex items-center justify-between gap-2">
                      <span><b>CM:</b> {user.assigned_communitymanagers}</span>
                      {/* Consider adding remove buttons for individual CMs here if needed */}
                    </div>
                  ) : (
                    "Not Assigned"
                  )}

                  {expandedRowId === user.id && (
                    <div className="mt-2 p-2 bg-gray-100 rounded shadow text-sm text-gray-800">
                      {user.roles.includes("moderator") ? (
                        <>
                          <strong>Assigned Community Managers:</strong>
                          <ul className="list-disc list-inside">
                            {user.assigned_communitymanagers
                              ? user.assigned_communitymanagers.split(",").map((cm, idx) => {
                                  const cmUser = users.find((u) => u.full_name === cm.trim());
                                  return (
                                    <li key={idx} className="flex justify-between items-center">
                                      <span>{cm.trim()}</span>
                                      {cmUser && (
                                        <button
                                          className="text-red-500 text-xs ml-2 hover:underline"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            queueRemoveAssignment(user, cmUser);
                                          }}
                                        >
                                          Remove
                                        </button>
                                      )}
                                    </li>
                                  );
                                })
                              : <li>No community managers assigned</li>}
                          </ul>
                        </>
                      ) : user.roles.includes("client") ? (
                        <>
                          <strong>Assigned Moderator:</strong>
                          <p>{user.assigned_moderator || "No moderator assigned"}</p>
                        </>
                      ) : null}
                    </div>
                  )}
                </td>
                <td className="px-4 py-2 border text-gray-800">
                  {user.roles.includes("moderator") && (
                    <button
                      className="px-4 py-2 text-white rounded-lg hover:bg-[#8a11df] hover:shadow-lg transition duration-300 ease-in-out"
                      style={{ backgroundColor: "#8a11df" }}
                      onClick={() => openAssignModal(user, "cm")}
                    >
                      Assign CM
                    </button>
                  )}

                  {user.roles.includes("client") && (
                    <button
                      className="px-4 py-2 text-white rounded-lg hover:bg-[#7a6cc5] hover:shadow-lg transition duration-300 ease-in-out"
                      style={{ backgroundColor: "#7a6cc5" }}
                      onClick={() => openAssignModal(user, "moderator")}
                    >
                      Assign Moderator
                    </button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Save and Cancel Buttons */}
      {(pendingAssignments.some((p) => p.assignedId !== undefined) || pendingRemovals.length > 0) && (
        <div className="flex space-x-2">
          <button
            className="px-4 py-2 bg-primary text-white rounded-full hover:bg-primary-dark"
            onClick={saveAllAssignments}
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
      {showModal && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg shadow-xl">
            <h2 className="text-lg font-semibold mb-4">Assign {assignmentType}</h2>
            <div>
              <label htmlFor="assignId" className="block mb-2">
                Select {assignmentType === "moderator" ? "Moderator" : "Community Manager"}:
              </label>
              <select
                id="assignId"
                className="border p-2 rounded w-full"
                onChange={(e) => setSelectedAssignId(Number(e.target.value))}
              >
                <option value="">-- Select --</option>
                {users
                  .filter((user) =>
                    user.roles.includes(assignmentType === "moderator" ? "moderator" : "community_manager")
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
    </div>
  );
}