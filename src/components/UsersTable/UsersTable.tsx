"use client";

import React, { useState, useEffect } from "react";
import { FaTrash, FaPlus, FaSort, FaSortUp, FaSortDown, FaSearch } from "react-icons/fa";
import { useRouter } from 'next/navigation';
import { fetchAllUsersServer, deleteUserServer } from "@/services/userService"; // Import server functions

type GetUser = {
  id: number;
  email: string;
  full_name: string;
  phone_number: string;
  roles: string[];
};

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
  const [isLoading, setIsLoading] = useState(true); // Add loading state
  const [fetchError, setFetchError] = useState<string | null>(null); // Add error state
  const [sortDirection, setSortDirection] = useState<"asc" | "desc" | null>(null);
  const [sortColumn, setSortColumn] = useState<"full_name" | "roles" | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setIsLoading(true);
    setFetchError(null);
    const result = await fetchAllUsersServer();
    setIsLoading(false);
    if (result && typeof result === 'object' && 'error' in result) {
      setFetchError(result.error);
      console.error("Error loading users:", result.error);
      return;
    }
    if (result) {
      setUsers((result as GetUser[]).map((user) => ({
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        phone_number: user.phone_number,
        roles: user.roles,
      })));
    }
  };

  const sortUsers = (column: "full_name" | "roles") => {
    let newSortDirection: "asc" | "desc";
    if (sortColumn === column && sortDirection === "asc") {
      newSortDirection = "desc";
    } else {
      newSortDirection = "asc";
    }
    setSortDirection(newSortDirection);
    setSortColumn(column);

    const sortedUsers = [...users].sort((a, b) => {
      let valueA: string | undefined;
      let valueB: string | undefined;

      if (column === "full_name") {
        valueA = a.full_name;
        valueB = b.full_name;
      } else if (column === "roles") {
        valueA = a.roles?.join(", ");
        valueB = b.roles?.join(", ");
      }

      const safeValueA = (valueA || "").toLowerCase();
      const safeValueB = (valueB || "").toLowerCase();

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
        const result = await deleteUserServer(deletion.userId);
        if (typeof result === 'object' && result && 'error' in result) {
          alert(`Failed to delete user with ID ${deletion.userId}: ${result.error}`);
          // Optionally handle partial failures
          continue;
        }
      }
      setPendingDeletions([]);
      loadUsers(); // Reload users after successful deletion
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

  const sortedFilteredUsers = sortColumn
    ? [...filteredByName].sort((a, b) => {
        let valueA: string | undefined;
        let valueB: string | undefined;

        if (sortColumn === "full_name") {
          valueA = a.full_name?.toLowerCase();
          valueB = b.full_name?.toLowerCase();
        } else if (sortColumn === "roles") {
          valueA = a.roles?.join(", ").toLowerCase();
          valueB = b.roles?.join(", ").toLowerCase();
        }

        const safeValueA = valueA ?? "";
        const safeValueB = valueB ?? "";

        return sortDirection === "asc" ? safeValueA.localeCompare(safeValueB) : safeValueB.localeCompare(safeValueA);
      })
    : filteredByName;

  if (isLoading) {
    return <div>Loading users...</div>;
  }

  if (fetchError) {
    return <div>Error loading users: {fetchError}</div>;
  }

  return (
    <div className="p-6 bg-white rounded-xl shadow">
      <h1 className=" mb-7 text-body-2xlg font-bold text-dark dark:text-white">
        USERS TABLE
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

      {/* Pending Deletions Display */}
      {hasPendingDeletions && (
        <div className="mb-6 p-4 bg-yellow-100 rounded-md shadow-sm">
          <h3 className="text-lg font-semibold mb-2 text-yellow-700">Pending Deletions:</h3>
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
            <th
              className="px-4 py-2 border font-bold text-black cursor-pointer flex items-center gap-1"
              onClick={() => sortUsers("full_name")}
            >
              Name
              {sortColumn === "full_name" && sortDirection === "asc" && <FaSortUp />}
              {sortColumn === "full_name" && sortDirection === "desc" && <FaSortDown />}
              {sortColumn !== "full_name" && <FaSort />}
            </th>
            <th className="px-4 py-2 border font-bold text-black">Email</th>
            <th className="px-4 py-2 border font-bold text-black">Phone Number</th>
            <th
              className="px-4 py-2 border font-bold text-black cursor-pointer flex items-center gap-1"
              onClick={() => sortUsers("roles")}
            >
              Roles
              {sortColumn === "roles" && sortDirection === "asc" && <FaSortUp />}
              {sortColumn === "roles" && sortDirection === "desc" && <FaSortDown />}
              {sortColumn !== "roles" && <FaSort />}
            </th>
            <th className="px-4 py-2 border font-bold text-black">Actions</th>
          </tr>
        </thead>
        <tbody>
          {sortedFilteredUsers.map((user) => {
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