"use client";

import React, { useEffect, useState } from "react";
import { getCMAssignments } from "@/services/cmService";
import { FaSearch, FaPlus } from "react-icons/fa";
import Link from "next/link";

type Assignment = {
  id: number;
  full_name: string;
  email: string;
  phone_number: string | null;
};

const tabs = ["Clients", "Moderators"];

export default function CmAssignmentsTable() {
  const [clients, setClients] = useState<Assignment[]>([]);
  const [moderators, setModerators] = useState<Assignment[]>([]);
  const [activeTab, setActiveTab] = useState("Clients");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAssignments() {
      try {
        const data = await getCMAssignments();
        setClients(data.clients || []);
        setModerators(data.moderators || []);
      } catch (err: any) {
        setError(err.message || "Failed to load assignments");
      } finally {
        setLoading(false);
      }
    }

    fetchAssignments();
  }, []);

  const filteredClients = clients.filter((client) =>
    client.full_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredModerators = moderators.filter((moderator) =>
    moderator.full_name.toLowerCase().includes(searchQuery.toLowerCase())
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
        {activeTab === "Clients" ? "Assigned Clients" : "Assigned Moderators"}
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

      {activeTab === "Clients" &&
        (filteredClients.length > 0 ? (
          <table className="mb-6 min-w-full table-auto">
            <thead>
              <tr>
                <th className="border px-4 py-2 font-bold text-black">Name</th>
                <th className="border px-4 py-2 font-bold text-black">Email</th>
                <th className="border px-4 py-2 font-bold text-black">
                  Phone Number
                </th>
                <th className="border px-4 py-2 font-bold text-black">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredClients.map((client) => (
                <tr key={client.id}>
                  <td className="border px-4 py-2 text-gray-800">
                    {client.full_name}
                  </td>
                  <td className="border px-4 py-2 text-gray-800">
                    {client.email}
                  </td>
                  <td className="border px-4 py-2 text-gray-800">
                    {client.phone_number || "N/A"}
                  </td>
                  <td className="border px-4 py-2 text-gray-800">
                    <Link
                      href={`/content?clientId=${client.id}`}
                      className="flex items-center justify-center gap-1 rounded bg-primary px-3 py-1 text-white hover:bg-primary-dark"
                    >
                      <FaPlus size={12} />
                      <span>Create Post</span>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-gray-600">
            {clients.length > 0
              ? "No clients found matching your search."
              : "No Clients assigned."}
          </p>
        ))}

      {activeTab === "Moderators" &&
        (filteredModerators.length > 0 ? (
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
              {filteredModerators.map((moderator) => (
                <tr key={moderator.id}>
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
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-gray-600">
            {moderators.length > 0
              ? "No moderators found matching your search."
              : "No Moderators assigned."}
          </p>
        ))}
    </div>
  );
}