"use client";

import React, { useState, useEffect } from "react";
import { getAssignedCommunityManagers } from "@/services/moderatorsService"; // Import the updated service
import { FaSearch } from "react-icons/fa"; // Import the search icon

type User = {
  id: number;
  email: string;
  full_name: string;
  phone_number: string;
  roles: string[];
};

export default function AssignedCommunityManagersTable() {
  const [assignedCMs, setAssignedCMs] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    loadAssignedCMs();
  }, []);

  const loadAssignedCMs = async () => {
    setIsLoading(true);
    setFetchError(null);
    try {
      const data = await getAssignedCommunityManagers(); // Call the service function
      if ('error' in data) {
        setFetchError(data.error);
        console.error("Error fetching assigned CMs:", data.error);
        return;
      }
      setAssignedCMs(data.map((cm: any) => ({ ...cm, roles: cm.roles || [] })));
    } catch (error: any) {
      setFetchError(`An unexpected error occurred: ${error.message}`);
      console.error("Unexpected error fetching assigned CMs:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredAssignedCMs = assignedCMs.filter(cm =>
    cm.full_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return <div>Loading Assigned Community Managers...</div>;
  }

  if (fetchError) {
    return <div>Error loading Assigned Community Managers: {fetchError}</div>;
  }

  return (
    <div className="p-6 bg-white rounded-xl shadow">
      <h1 className="mb-7 text-body-2xlg font-bold text-dark dark:text-white">
        Assigned Community Managers
      </h1>
      <div className="flex items-center mb-4">
        <FaSearch className="mr-2 text-gray-500" />
        <input
          type="text"
          placeholder="Search by Name"
          className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-48 sm:text-sm border-gray-300 rounded-md"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>
      {filteredAssignedCMs.length > 0 ? (
        <table className="min-w-full table-auto mb-6">
          <thead>
            <tr>
              <th className="px-4 py-2 border font-bold text-black">Name</th>
              <th className="px-4 py-2 border font-bold text-black">Email</th>
              <th className="px-4 py-2 border font-bold text-black">Phone Number</th>
            </tr>
          </thead>
          <tbody>
            {filteredAssignedCMs.map((cm) => (
              <tr key={cm.id}>
                <td className="px-4 py-2 border text-gray-800">{cm.full_name}</td>
                <td className="px-4 py-2 border text-gray-800">{cm.email}</td>
                <td className="px-4 py-2 border text-gray-800">{cm.phone_number}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p className="text-gray-600">{assignedCMs.length > 0 ? "No community managers found matching your search." : "No Community Managers are currently assigned to you."}</p>
      )}
    </div>
  );
}