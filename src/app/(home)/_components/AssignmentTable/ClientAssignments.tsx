"use client";

import React, { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { getClientAssignments } from "@/services/clientService";
import ListSearchBar from "@/app/(home)/_components/AssignmentTable/ListSearchBar";
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

  const filteredCommunityManagers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return communityManagers;
    return communityManagers.filter((cm) => {
      const name = (cm.full_name || "").toLowerCase();
      const email = (cm.email || "").toLowerCase();
      return name.includes(q) || email.includes(q);
    });
  }, [communityManagers, searchQuery]);

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

        <ListSearchBar
          placeholder={`Search by Name in ${activeTab}`}
          value={searchQuery}
          onChange={setSearchQuery}
        />
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
                      <span>
                        {moderator.full_name || moderator.email.split("@")[0]}
                      </span>
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
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-6 text-center dark:border-gray-600 dark:bg-gray-700">
              <div className="mb-2">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              </div>
              <h3 className="mb-2 text-lg font-medium text-gray-900 dark:text-white">
                No Moderator Assigned
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                You don&apos;t have a moderator assigned yet. Please contact
                your administrator to assign a moderator who will review and
                approve your content.
              </p>
            </div>
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
                      <span>{cm.full_name || cm.email.split("@")[0]}</span>
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
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-6 text-center dark:border-gray-600 dark:bg-gray-700">
            <div className="mb-2">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
            </div>
            <h3 className="mb-2 text-lg font-medium text-gray-900 dark:text-white">
              {communityManagers.length > 0
                ? "No community managers found matching your search."
                : "No Community Managers Assigned"}
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {communityManagers.length > 0
                ? "Try adjusting your search terms to find the community managers you're looking for."
                : "You don&apos;t have any community managers assigned yet. Please contact your administrator to assign community managers who will help create and manage your social media content."}
            </p>
          </div>
        ))}
    </div>
  );
}
