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

  const queueRemoveAssignment = (user: User, cmToRemove?: User) => {
    const type: "moderator" | "cm" = cmToRemove ? "cm" : "moderator";
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
            const url = `http://localhost:8000/api/clients/${assignment.userId}/moderator/remove/`;
            await axios.delete(url);
          } else if (assignment.type === "cm" && assignment.cmIdToRemove) {
            const url = `http://localhost:8000/api/moderators/${assignment.userId}/community-manager/${assignment.cmIdToRemove}/remove/`;
            await axios.delete(url);
          }
        } else {
          if (assignment.type === "moderator" && assignment.assignedId) {
            const url = `http://localhost:8000/api/clients/${assignment.userId}/moderator/`;
            await axios.put(url, { moderator_id: assignment.assignedId });
          } else if (assignment.type === "cm" && assignment.assignedId) {
            const url = `http://localhost:8000/api/moderators/${assignment.userId}/community-manager/`;
            await axios.put(url, { cm_id: assignment.assignedId });
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

  return (
    <div className="p-6 bg-white rounded-xl shadow">
      <h1 className="mb-5.5 text-body-2xlg font-bold text-dark dark:text-white">
        Assignment Table


      </h1>
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

      {/* Pending Removals Display */}
      {pendingRemovals.length > 0 && (
        <div className="mb-6 p-4 bg-yellow-100 rounded-md shadow-sm">
          <h3 className="text-lg font-semibold mb-2 text-yellow-700">Pending Removals:</h3>
          <ul>
            {pendingRemovals.map((removal, index) => (
              <li key={index} className="text-yellow-600">
                 {users.find(u => u.id === removal.userId)?.full_name} - Removing his assigned {" "}
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
            <th className="px-4 py-2 border font-bold text-black">Name</th>
            <th className="px-4 py-2 border font-bold text-black">Email</th>
            <th className="px-4 py-2 border font-bold text-black">Roles</th>
            <th className="px-4 py-2 border font-bold text-black">Assigned To</th>
            <th className="px-4 py-2 border font-bold text-black">Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredUsers.map((user) => {
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
                      <span>Moderator: {user.assigned_moderator}</span>
                      <button
                        className="ml-2 px-2 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600"
                        onClick={(e) => {
                          e.stopPropagation();
                          const moderatorToRemove = users.find((u) => u.full_name === user.assigned_moderator);
                          if (moderatorToRemove) {
                            queueRemoveAssignment(user, moderatorToRemove);
                          }
                        }}
                      >
                        Remove
                      </button>
                    </div>
                  ) : user.assigned_communitymanagers ? (
                    <div className="flex items-center justify-between gap-2">
                      <span>CM: {user.assigned_communitymanagers}</span>
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