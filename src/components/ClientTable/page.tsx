"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { getClientAssignments } from "@/services/clientService";
import { FaSearch } from "react-icons/fa";
import { getImageUrl } from "@/utils/image-url";

type Assignment = {
  id: number;
  full_name: string;
  email: string;
  phone_number: string | null;
  user_image?: string;
};

const tabs = ["Moderators", "Community Managers"];

export default function ClientAssignmentsTable() {
  const [moderator, setModerator] = useState<Assignment | null>(null);
  const [communityManagers, setCommunityManagers] = useState<Assignment[]>([]);
  const [activeTab, setActiveTab] = useState("Moderators");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAssignments() {
      try {
        const data = await getClientAssignments();
        setModerator(data.moderator || null);
        setCommunityManagers(data.community_managers || []);
      } catch (err: unknown) {
        setError(
          err instanceof Error ? err.message : "Failed to load assignments",
        );
      } finally {
        setLoading(false);
      }
    }

    fetchAssignments();
  }, []);

  const filteredCommunityManagers = communityManagers.filter((cm) =>
    cm.full_name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div className="text-red-500">Error: {error}</div>;
  }

  return (
    <div className="rounded-xl bg-white p-6 shadow dark:bg-gray-800">
      <h1 className="mb-7 text-body-2xlg font-bold text-dark dark:text-white">
        {activeTab === "Moderators"
          ? "Assigned Moderator"
          : "Assigned Community Managers"}
      </h1>

      <div className="mb-4 flex items-center justify-between">
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

        <div className="ml-4 flex items-center rounded-md border border-gray-300 bg-white shadow-sm focus-within:border-indigo-500 focus-within:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700">
          <FaSearch className="ml-2 text-gray-500 dark:text-gray-400" />
          <input
            type="text"
            placeholder={`Search by Name in ${activeTab}`}
            className="block w-48 bg-transparent p-3 text-gray-900 placeholder-gray-500 focus:outline-none dark:text-white dark:placeholder-gray-400 sm:text-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {activeTab === "Moderators" && (
        <div>
          {moderator ? (
            <table className="mb-6 min-w-full table-auto bg-white dark:bg-gray-800">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="border border-gray-300 px-4 py-2 font-bold text-black dark:border-gray-600 dark:text-white">
                    Name
                  </th>
                  <th className="border border-gray-300 px-4 py-2 font-bold text-black dark:border-gray-600 dark:text-white">
                    Email
                  </th>
                  <th className="border border-gray-300 px-4 py-2 font-bold text-black dark:border-gray-600 dark:text-white">
                    Phone Number
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="border border-gray-300 px-4 py-2 text-gray-800 dark:border-gray-600 dark:text-gray-200">
                    <div className="flex items-center gap-3">
                      <Image
                        src={getImageUrl(moderator.user_image)}
                        className="size-8 rounded-full object-cover"
                        alt={`Avatar of ${moderator.full_name || "user"}`}
                        role="presentation"
                        width={32}
                        height={32}
                        onError={(e) => {
                          e.currentTarget.src = "/images/user/user-03.png";
                        }}
                      />
                      <span>{moderator.full_name}</span>
                    </div>
                  </td>
                  <td className="border border-gray-300 px-4 py-2 text-gray-800 dark:border-gray-600 dark:text-gray-200">
                    {moderator.email}
                  </td>
                  <td className="border border-gray-300 px-4 py-2 text-gray-800 dark:border-gray-600 dark:text-gray-200">
                    {moderator.phone_number || "N/A"}
                  </td>
                </tr>
              </tbody>
            </table>
          ) : (
            <p className="text-gray-600 dark:text-gray-400">
              No Moderator assigned.
            </p>
          )}
        </div>
      )}

      {activeTab === "Community Managers" &&
        (filteredCommunityManagers.length > 0 ? (
          <table className="mb-6 min-w-full table-auto bg-white dark:bg-gray-800">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="border border-gray-300 px-4 py-2 font-bold text-black dark:border-gray-600 dark:text-white">
                  Name
                </th>
                <th className="border border-gray-300 px-4 py-2 font-bold text-black dark:border-gray-600 dark:text-white">
                  Email
                </th>
                <th className="border border-gray-300 px-4 py-2 font-bold text-black dark:border-gray-600 dark:text-white">
                  Phone Number
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredCommunityManagers.map((cm) => (
                <tr
                  key={cm.id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <td className="border border-gray-300 px-4 py-2 text-gray-800 dark:border-gray-600 dark:text-gray-200">
                    <div className="flex items-center gap-3">
                      <Image
                        src={getImageUrl(cm.user_image)}
                        className="size-8 rounded-full object-cover"
                        alt={`Avatar of ${cm.full_name || "user"}`}
                        role="presentation"
                        width={32}
                        height={32}
                        onError={(e) => {
                          e.currentTarget.src = "/images/user/user-03.png";
                        }}
                      />
                      <span>{cm.full_name}</span>
                    </div>
                  </td>
                  <td className="border border-gray-300 px-4 py-2 text-gray-800 dark:border-gray-600 dark:text-gray-200">
                    {cm.email}
                  </td>
                  <td className="border border-gray-300 px-4 py-2 text-gray-800 dark:border-gray-600 dark:text-gray-200">
                    {cm.phone_number || "N/A"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-gray-600 dark:text-gray-400">
            {communityManagers.length > 0
              ? "No community managers found matching your search."
              : "No Community Managers assigned."}
          </p>
        ))}
    </div>
  );
}
