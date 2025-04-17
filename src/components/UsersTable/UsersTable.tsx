"use client";

import React, { useState, useEffect } from "react";
import { FaTrash, FaPlus } from "react-icons/fa";
import { useRouter } from 'next/navigation';

type User = {
  id: number;
  email: string;
  full_name: string;
  phone_number: string;
  roles: string[];
};

type PendingDeletion = {
  userId: number;
};

const tabs = ["All", "Administrator", "Moderator", "Community Manager", "Client"];

export default function UsersTable() {
  const [users, setUsers] = useState<User[]>([]);
  const [activeTab, setActiveTab] = useState("All");
  const [pendingDeletions, setPendingDeletions] = useState<PendingDeletion[]>([]);
  const router = useRouter();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await fetch("http://localhost:8000/api/users/");
      if (!res.ok) {
        const message = `An error occurred: ${res.status}`;
        throw new Error(message);
      }
      const data = await res.json();
      setUsers(data);
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

  const queueDeleteUser = (userId: number) => {
    const alreadyPending = pendingDeletions.some((deletion) => deletion.userId === userId);
    if (!alreadyPending) {
      setPendingDeletions((prev) => [...prev, { userId }]);
      alert("Deletion queued. Review pending deletions and save to confirm.");
    } else {
      alert("This user is already marked for deletion.");
    }
  };

  const saveDeletions = async () => {
    if (pendingDeletions.length === 0) {
      alert("No users are marked for deletion.");
      return;
    }

    if (!window.confirm(`Are you sure you want to delete ${pendingDeletions.length} user(s)?`)) {
      return;
    }

    try {
      for (const deletion of pendingDeletions) {
        const res = await fetch(`http://localhost:8000/api/users/delete/${deletion.userId}/`, {
          method: "DELETE",
        });
        if (!res.ok) {
          const message = `An error occurred: ${res.status}`;
          throw new Error(message);
        }
      }
      setPendingDeletions([]);
      fetchUsers();
      alert("Selected users deleted successfully!");
    } catch (err: any) {
      console.error("Error deleting users:", err);
      alert("Failed to delete selected users.");
    }
  };

  const clearPendingDeletions = () => {
    setPendingDeletions([]);
    alert("Pending deletions cleared.");
  };

  const hasPendingDeletions = pendingDeletions.length > 0;

  return (
    <div className="p-6 bg-white rounded-xl shadow">
      <h1 className=" mb-7 text-body-2xlg font-bold text-dark dark:text-white">
        USERS TABLE
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

      {/* Pending Deletions Display */}
      {hasPendingDeletions && (
        <div className="mb-6 p-4 bg-yellow-100 rounded-md shadow-sm"> {/* Reduced padding and font size */}
          <h3 className="text-lg font-semibold mb-2 text-yellow-700">Pending Deletions:</h3> {/* Reduced margin-bottom */}
          <ul>
            {pendingDeletions.map((deletion) => {
              const userToDelete = users.find((user) => user.id === deletion.userId);
              return (
                <li key={deletion.userId} className="text-orange-600">
                  {userToDelete?.full_name}
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* Table */}
      <table className="min-w-full table-auto mb-6">
        <thead>
          <tr>
            <th className="px-4 py-2 border font-bold text-black">Name</th>
            <th className="px-4 py-2 border font-bold text-black">Email</th>
            <th className="px-4 py-2 border font-bold text-black">Phone Number</th>
            <th className="px-4 py-2 border font-bold text-black">Roles</th>
            <th className="px-4 py-2 border font-bold text-black">Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredUsers.map((user) => {
            const isPendingDelete = pendingDeletions.some((deletion) => deletion.userId === user.id);
            return (
              <tr key={user.id} >
                <td className="px-4 py-2 border text-gray-800">{user.full_name}</td>
                <td className="px-4 py-2 border text-gray-800">{user.email}</td>
                <td className="px-4 py-2 border text-gray-800">{user.phone_number}</td>
                <td className="px-4 py-2 border text-gray-800">{user.roles.join(", ")}</td>
                <td className="px-4 py-2 border text-gray-800">
                  <span
                    className={`inline-flex items-center justify-center h-6 w-6 rounded-md cursor-pointer ${
                      isPendingDelete ? "bg-yellow-500 hover:bg-yellow-600 text-white" : "bg-red-500 hover:bg-red-600 text-white"
                    }`}
                    onClick={() => queueDeleteUser(user.id)}
                    style={{ userSelect: "none" }}
                  >
                    <FaTrash size={14} />
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>

      </table>
      <button
        className="mb-4 px-4 py-2 bg-[#7a6cc5] text-white rounded-full transition duration-300 ease-in-out"
        onClick={() => router.push('/create-user')}
      >
        <FaPlus className="inline-block mr-2" /> Add User
      </button>
      {/* Save and Cancel Buttons */}
      {hasPendingDeletions && (
        <div className="flex space-x-2">
          <button
            className="px-4 py-2 bg-primary text-white rounded-full hover:bg-primary-dark"
            onClick={saveDeletions}
          >
            Save Deletions
          </button>
          <button
            className="px-4 py-2 ml-2 bg-gray-300 text-gray-700 rounded-full hover:bg-gray-400"
            onClick={clearPendingDeletions}
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}