"use client";

import React, { useEffect, useState } from "react";
import { getClientAssignments } from "@/services/clientService";
import { FaSearch } from "react-icons/fa";

type Assignment = {
  id: number;
  full_name: string;
  email: string;
  phone_number: string | null;
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
      } catch (err: any) {
        setError(err.message || "Failed to load assignments");
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
    <div className="rounded-xl bg-white p-6 shadow">
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
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="ml-4 flex items-center">
          <FaSearch className="mr-2 text-gray-500" />
          <input
            type="text"
            placeholder={`Search by Name in ${activeTab}`}
            className="block w-48 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {activeTab === "Moderators" && (
        <div>
          {moderator ? (
            <table className="mb-6 min-w-full table-auto">
              <thead>
                <tr>
                  <th className="border px-4 py-2 font-bold text-black">
                    Name
                  </th>
                  <th className="border px-4 py-2 font-bold text-black">
                    Email
                  </th>
                  <th className="border px-4 py-2 font-bold text-black">
                    Phone Number
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border px-4 py-2 text-gray-800">
                    {moderator.full_name}
                  </td>
                  <td className="border px-4 py-2 text-gray-800">
                    {moderator.email}
                  </td>
                  <td className="border px-4 py-2 text-gray-800">
                    {moderator.phone_number || "N/A"}
                  </td>
                </tr>
              </tbody>
            </table>
          ) : (
            <p className="text-gray-600">No Moderator assigned.</p>
          )}
        </div>
      )}

      {activeTab === "Community Managers" &&
        (filteredCommunityManagers.length > 0 ? (
          <table className="mb-6 min-w-full table-auto">
            <thead>
              <tr>
                <th className="border px-4 py-2 font-bold text-black">Name</th>
                <th className="border px-4 py-2 font-bold text-black">Email</th>
                <th className="border px-4 py-2 font-bold text-black">
                  Phone Number
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredCommunityManagers.map((cm) => (
                <tr key={cm.id}>
                  <td className="border px-4 py-2 text-gray-800">
                    {cm.full_name}
                  </td>
                  <td className="border px-4 py-2 text-gray-800">{cm.email}</td>
                  <td className="border px-4 py-2 text-gray-800">
                    {cm.phone_number || "N/A"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-gray-600">
            {communityManagers.length > 0
              ? "No community managers found matching your search."
              : "No Community Managers assigned."}
          </p>
        ))}
    </div>
  );
}
