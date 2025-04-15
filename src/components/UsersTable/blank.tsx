"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";

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
  assignedId: number;
  assignedName?: string;
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

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await axios.get("http://localhost:8000/api/users/");
      setUsers(res.data);
    } catch (err) {
      console.error("Error fetching users:", err);
    }
  };

  const filteredUsers =
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
      (item) => item.userId === selectedUser.id && item.type === assignmentType
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

  const removeAssignment = async (user: User, cmIdToRemove?: number) => {
    try {
      if (user.roles.includes("moderator") && cmIdToRemove) {
        const url = `http://localhost:8000/api/moderators/${user.id}/community-manager/${cmIdToRemove}/remove/`;
        await axios.delete(url);
      } else if (user.roles.includes("client")) {
        const url = `http://localhost:8000/api/clients/${user.id}/moderator/remove/`;
        await axios.delete(url);
      }

      fetchUsers();
      alert("Assignment removed successfully!");
    } catch (err) {
      console.error("Error removing assignment:", err);
      alert("Failed to remove assignment.");
    }
  };

  const saveAllAssignments = async () => {
    try {
      for (const assignment of pendingAssignments) {
        if (assignment.type === "moderator") {
          const url = `http://localhost:8000/api/clients/${assignment.userId}/moderator/`;
          await axios.put(url, { moderator_id: assignment.assignedId });
        } else if (assignment.type === "cm") {
          const url = `http://localhost:8000/api/moderators/${assignment.userId}/community-manager/`;
          await axios.put(url, { cm_id: assignment.assignedId });
        }
      }

      fetchUsers();
      setPendingAssignments([]);
      alert("Assignments saved successfully!");
    } catch (err) {
      console.error("Error saving assignments:", err);
      alert("Failed to save assignments.");
    }
  };

  return (
    <div className="p-6 bg-white rounded-xl shadow">
      {/* Tabs */}
      <div className="flex space-x-2 mb-6">
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

      {/* Table */}
      <table className="min-w-full table-auto mb-6">
        <thead>
          <tr>
            <th className="px-4 py-2 border">Name</th>
            <th className="px-4 py-2 border">Email</th>
            <th className="px-4 py-2 border">Roles</th>
            <th className="px-4 py-2 border">Assigned To</th>
            <th className="px-4 py-2 border">Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredUsers.map((user) => {
            const pending = pendingAssignments.find((a) => a.userId === user.id);
            return (
              <tr key={user.id}>
                <td className="px-4 py-2 border">{user.full_name}</td>
                <td className="px-4 py-2 border">{user.email}</td>
                <td className="px-4 py-2 border">{user.roles.join(", ")}</td>
                <td
                  className="px-4 py-2 border cursor-pointer"
                  onClick={() => setExpandedRowId(user.id === expandedRowId ? null : user.id)}
                >
                  {pending ? (
                    `Pending: ${pending.type === "moderator" ? "Moderator" : "CM"} - ${pending.assignedName || "No Assigned Name"}`
                  ) : user.assigned_moderator ? (
                    <div className="flex items-center justify-between gap-2">
                      <span>Moderator: {user.assigned_moderator}</span>
                      <button
                        className="ml-2 px-2 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeAssignment(user);
                        }}
                      >
                        Remove
                      </button>
                    </div>
                  ) : user.assigned_communitymanagers ? (
                    <div className="flex items-center justify-between gap-2">
                      <span>CM: {user.assigned_communitymanagers}</span>
                      <button
                        className="ml-2 px-2 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeAssignment(user);
                        }}
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    "Not Assigned"
                  )}

                  {expandedRowId === user.id && (
                    <div className="mt-2 p-2 bg-gray-100 rounded shadow text-sm">
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
                                            removeAssignment(user, cmUser.id);
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
                <td className="px-4 py-2 border">
                  {user.roles.includes("moderator") && (
                    <button
                      className="px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                      onClick={() => openAssignModal(user, "cm")}
                    >
                      Assign CM
                    </button>
                  )}
                  {user.roles.includes("client") && (
                    <button
                      className="px-2 py-1 bg-green-500 text-white rounded hover:bg-green-600"
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

      {/* Save Assignments */}
      {pendingAssignments.length > 0 && (
        <button
          className="px-4 py-2 bg-primary text-white rounded-full hover:bg-primary-dark"
          onClick={saveAllAssignments}
        >
          Save All Assignments
        </button>
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
