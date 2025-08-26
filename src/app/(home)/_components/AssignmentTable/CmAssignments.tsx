"use client";

import React, { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { getCMAssignments } from "@/services/cmService";
import { Plus } from "lucide-react";
import Link from "next/link";
import { getImageUrl } from "@/utils/image-url";
import ListSearchBar from "@/app/(home)/_components/AssignmentTable/ListSearchBar";

type Assignment = {
  id: number;
  full_name: string;
  email: string;
  phone_number: string | null;
  user_image?: string;
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
        const response = await getCMAssignments();
        if (!response?.success) {
          setError(response?.error || "Failed to load assignments");
          setClients([]);
          setModerators([]);
          return;
        }
        const data = (response.data || {}) as {
          clients?: Assignment[];
          moderators?: Assignment[];
        };
        setClients(data.clients ?? []);
        setModerators(data.moderators ?? []);
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

  const filteredClients = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return clients;
    return clients.filter((client) => {
      const name = (client.full_name || "").toLowerCase();
      const email = (client.email || "").toLowerCase();
      return name.includes(q) || email.includes(q);
    });
  }, [clients, searchQuery]);

  const filteredModerators = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return moderators;
    return moderators.filter((moderator) => {
      const name = (moderator.full_name || "").toLowerCase();
      const email = (moderator.email || "").toLowerCase();
      return name.includes(q) || email.includes(q);
    });
  }, [moderators, searchQuery]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div className="text-red-500">Error: {error}</div>;
  }

  return (
    <div className="rounded-xl bg-white p-6 shadow dark:bg-gray-800">
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

      {activeTab === "Clients" &&
        (filteredClients.length > 0 ? (
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
                <th className="border border-gray-300 px-4 py-2 font-bold text-black dark:border-gray-600 dark:text-white">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredClients.map((client) => (
                <tr
                  key={client.id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <td className="border border-gray-300 px-4 py-2 text-gray-800 dark:border-gray-600 dark:text-gray-200">
                    <div className="flex items-center gap-3">
                      <Image
                        src={getImageUrl(client.user_image)}
                        className="size-8 rounded-full object-cover"
                        alt={`Avatar of ${client.full_name || "user"}`}
                        role="presentation"
                        width={32}
                        height={32}
                        onError={(e) => {
                          e.currentTarget.src = "/images/user/user-03.png";
                        }}
                      />
                      <span>
                        {client.full_name || client.email.split("@")[0]}
                      </span>
                    </div>
                  </td>
                  <td className="border border-gray-300 px-4 py-2 text-gray-800 dark:border-gray-600 dark:text-gray-200">
                    {client.email}
                  </td>
                  <td className="border border-gray-300 px-4 py-2 text-gray-800 dark:border-gray-600 dark:text-gray-200">
                    {client.phone_number || "N/A"}
                  </td>
                  <td className="border border-gray-300 px-4 py-2 text-gray-800 dark:border-gray-600 dark:text-gray-200">
                    <Link
                      href={`/content?clientId=${client.id}`}
                      className="hover:bg-primary-dark flex w-fit items-center justify-center gap-1 rounded bg-primary px-4 py-2 text-white"
                    >
                      <Plus size={12} />
                      <span>Create Post</span>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-gray-600 dark:text-gray-400">
            {clients.length > 0
              ? "No clients found matching your search."
              : "No Clients assigned."}
          </p>
        ))}

      {activeTab === "Moderators" &&
        (filteredModerators.length > 0 ? (
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
              {filteredModerators.map((moderator) => (
                <tr
                  key={moderator.id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700"
                >
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
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-gray-600 dark:text-gray-400">
            {moderators.length > 0
              ? "No moderators found matching your search."
              : "No Moderators assigned."}
          </p>
        ))}
    </div>
  );
}
