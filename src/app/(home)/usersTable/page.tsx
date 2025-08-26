"use client";

import React, { useState, useEffect } from "react";
import {
  Trash2,
  Plus,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Search,
} from "lucide-react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { fetchAllUsersServer, deleteUserServer } from "@/services/userService";
import { GetUser } from "@/types/user";
import { getImageUrl } from "@/utils/image-url";

type PendingDeletion = {
  userId: number;
};

const tabs = [
  "All",
  "Administrator",
  "Moderator",
  "Community Manager",
  "Client",
];

const UsersPage = () => {
  const [users, setUsers] = useState<GetUser[]>([]);
  const [activeTab, setActiveTab] = useState("All");
  const [pendingDeletions, setPendingDeletions] = useState<PendingDeletion[]>(
    [],
  );
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true); // Add loading state
  const [fetchError, setFetchError] = useState<string | null>(null); // Add error state
  const [sortDirection, setSortDirection] = useState<"asc" | "desc" | null>(
    null,
  );
  const [sortColumn, setSortColumn] = useState<"full_name" | "role" | null>(
    null,
  );
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    loadUsers();

    // Listen for user data changes from other users
    const handleUserDataChange = () => {
      console.log("User data changed by another user, refreshing...");
      loadUsers(true); // Bypass cache to get fresh data
    };

    window.addEventListener("userDataChanged", handleUserDataChange);

    return () => {
      window.removeEventListener("userDataChanged", handleUserDataChange);
    };
  }, []);

  const loadUsers = async (bypassCache: boolean = false) => {
    setIsLoading(true);
    setFetchError(null);
    console.log(
      bypassCache
        ? "Loading users (bypassing cache due to changes)"
        : "Loading users (using Redis cache)",
    );
    const result = await fetchAllUsersServer(bypassCache);
    setIsLoading(false);
    if (result && typeof result === "object" && "error" in result) {
      setFetchError(result.error);
      console.error("Error loading users:", result.error);
      return;
    }
    if (result) {
      console.log("Raw user data:", result); // Debug log
      console.log("First user user_image:", result[0]?.user_image); // Debug specific field

      setUsers(result);
    }
  };

  const sortUsers = (column: "full_name" | "role") => {
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
      } else if (column === "role") {
        valueA = a.role;
        valueB = b.role;
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
      : users.filter((user) => {
          if (!user.role) return false;
          const formattedRole =
            user.role === "community_manager"
              ? "Community Manager"
              : user.role === "super_administrator"
                ? "Super Administrator"
                : user.role.charAt(0).toUpperCase() +
                  user.role.slice(1).replace(/_/g, " ");
          return formattedRole === activeTab;
        });

  const filteredByName = filteredByRole.filter((user) =>
    user.full_name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const queueDeleteUser = (userId: number) => {
    const alreadyPending = pendingDeletions.some(
      (deletion) => deletion.userId === userId,
    );
    if (!alreadyPending) {
      setPendingDeletions((prev) => [...prev, { userId }]);
    } else {
    }
  };

  const saveDeletions = async () => {
    if (pendingDeletions.length === 0) {
      return;
    }

    if (
      !window.confirm(
        `Are you sure you want to delete ${pendingDeletions.length} user(s)?`,
      )
    ) {
      return;
    }

    try {
      for (const deletion of pendingDeletions) {
        const result = await deleteUserServer(deletion.userId);
        if (typeof result === "object" && result && "error" in result) {
          alert(
            `Failed to delete user with ID ${deletion.userId}: ${result.error}`,
          );
          // Optionally handle partial failures
          continue;
        }
      }
      setPendingDeletions([]);
      loadUsers(true); // Reload users after deletion (bypass cache since data was modified)

      // Notify other users that user data has changed
      const event = new CustomEvent("userDataChanged", {
        detail: { source: "user_deletion" },
      });
      window.dispatchEvent(event);
    } catch (err: unknown) {
      console.error("Error deleting users:", err);
    }
  };

  const clearPendingDeletions = () => {
    setPendingDeletions([]);
  };

  const hasPendingDeletions = pendingDeletions.length > 0;

  const sortedFilteredUsers = sortColumn
    ? [...filteredByName].sort((a, b) => {
        let valueA: string | undefined;
        let valueB: string | undefined;

        if (sortColumn === "full_name") {
          valueA = a.full_name?.toLowerCase();
          valueB = b.full_name?.toLowerCase();
        } else if (sortColumn === "role") {
          valueA = a.role?.toLowerCase();
          valueB = b.role?.toLowerCase();
        }

        const safeValueA = valueA ?? "";
        const safeValueB = valueB ?? "";

        return sortDirection === "asc"
          ? safeValueA.localeCompare(safeValueB)
          : safeValueB.localeCompare(safeValueA);
      })
    : filteredByName;

  if (isLoading) {
    return (
      <div className="text-gray-900 dark:text-white">Loading users...</div>
    );
  }

  if (fetchError) {
    return (
      <div className="text-red-600 dark:text-red-400">
        Error loading users: {fetchError}
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-white p-6 shadow dark:bg-gray-800">
      <h1 className="mb-7 text-body-2xlg font-bold text-dark dark:text-white">
        USERS TABLE
      </h1>
      {/* Search and Tabs */}
      <div className="mb-6 flex items-center justify-between">
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

        <button
          className="rounded-full bg-[#7a6cc5] px-4 py-2 text-white transition duration-300 ease-in-out hover:bg-[#6854b3]"
          onClick={() => router.push("/create-user")}
        >
          <Plus className="mr-2 inline-block" /> Add User
        </button>
        <div className="ml-4 flex items-center rounded-md border border-gray-300 bg-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700">
          <Search className="ml-2 text-gray-500 dark:text-gray-400" />
          <input
            type="text"
            placeholder={`Search by Name in ${activeTab}`}
            className="block w-48 bg-transparent p-3 text-gray-900 placeholder-gray-500 dark:text-white dark:placeholder-gray-400 sm:text-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Pending Deletions Display */}
      {hasPendingDeletions && (
        <div className="mb-6 flex justify-between rounded-md bg-yellow-100 p-4 shadow-sm dark:bg-yellow-900">
          <div>
            <h3 className="mb-2 text-lg font-semibold text-yellow-700 dark:text-yellow-200">
              Pending Deletions:
            </h3>
            <ul>
              {pendingDeletions.map((deletion) => {
                const userToDelete = users.find(
                  (user) => user.id === deletion.userId,
                );
                return (
                  <li
                    key={deletion.userId}
                    className="text-orange-600 dark:text-orange-400"
                  >
                    {userToDelete?.full_name}
                  </li>
                );
              })}
            </ul>
          </div>
          <div className="flex items-start">
            <button
              className="hover:bg-primary-dark rounded-full bg-primary px-4 py-2 text-white"
              onClick={saveDeletions}
            >
              Save Deletions
            </button>
            <button
              className="ml-2 rounded-full bg-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-400 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500"
              onClick={clearPendingDeletions}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <table className="mb-6 min-w-full table-auto border-collapse border border-gray-300 bg-white dark:border-gray-600 dark:bg-gray-800">
        <thead className="bg-gray-50 dark:bg-gray-700">
          <tr>
            <th
              className="flex cursor-pointer items-center gap-1 border border-gray-300 px-4 py-2 font-bold text-black dark:border-gray-600 dark:text-white"
              onClick={() => sortUsers("full_name")}
            >
              Name
              {sortColumn === "full_name" && sortDirection === "asc" && (
                <ArrowUp size={12} />
              )}
              {sortColumn === "full_name" && sortDirection === "desc" && (
                <ArrowDown size={12} />
              )}
              {sortColumn !== "full_name" && <ArrowUpDown size={12} />}
            </th>
            <th className="border border-gray-300 px-4 py-2 font-bold text-black dark:border-gray-600 dark:text-white">
              Email
            </th>
            <th className="border border-gray-300 px-4 py-2 font-bold text-black dark:border-gray-600 dark:text-white">
              Phone Number
            </th>
            <th
              className="flex cursor-pointer items-center gap-1 border border-gray-300 px-4 py-2 font-bold text-black dark:border-gray-600 dark:text-white"
              onClick={() => sortUsers("role")}
            >
              Role
              {sortColumn === "role" && sortDirection === "asc" && (
                <ArrowUp size={12} />
              )}
              {sortColumn === "role" && sortDirection === "desc" && (
                <ArrowDown size={12} />
              )}
              {sortColumn !== "role" && <ArrowUpDown size={12} />}
            </th>
            <th className="border border-gray-300 px-4 py-2 font-bold text-black dark:border-gray-600 dark:text-white">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {sortedFilteredUsers.map((user) => {
            const isPendingDelete = pendingDeletions.some(
              (deletion) => deletion.userId === user.id,
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
                          "Error loading user image for user:",
                          user.full_name,
                          "Image URL:",
                          user.user_image,
                          "Processed URL:",
                          getImageUrl(user.user_image),
                        );
                        // Fallback to default image if there's an error
                        e.currentTarget.src = "/images/user/user-03.png";
                      }}
                      onLoad={() => {
                        console.log(
                          "Successfully loaded image for user:",
                          user.full_name,
                          "Image URL:",
                          user.user_image,
                          "Processed URL:",
                          getImageUrl(user.user_image),
                        );
                      }}
                    />
                    <span>{user.full_name}</span>
                  </div>
                </td>
                <td className="border border-gray-300 px-4 py-2 text-gray-800 dark:border-gray-600 dark:text-gray-200">
                  {user.email}
                </td>
                <td className="border border-gray-300 px-4 py-2 text-gray-800 dark:border-gray-600 dark:text-gray-200">
                  {user.phone_number}
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
                <td className="border border-gray-300 px-4 py-2 text-gray-800 dark:border-gray-600 dark:text-gray-200">
                  <span
                    className={`inline-flex h-6 w-20 cursor-pointer items-center justify-between rounded-md px-2 py-4 ${
                      isPendingDelete
                        ? "bg-yellow-500 text-white hover:bg-yellow-600"
                        : "bg-red-500 text-white hover:bg-red-600"
                    }`}
                    onClick={() => queueDeleteUser(user.id)}
                    style={{ userSelect: "none" }}
                  >
                    <Trash2 size={14} />
                    Delete
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default UsersPage;
