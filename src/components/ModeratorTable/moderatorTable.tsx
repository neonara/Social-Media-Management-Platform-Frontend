"use client";

import React, { useState, useEffect } from "react";
import { getAssignedCommunityManagers, assignCommunityManagerToClient, getClients } from "@/services/moderatorsService";
import { FaSearch, FaPlus } from "react-icons/fa";
import { useRouter } from 'next/navigation';

type User = {
  id: number;
  email: string;
  full_name: string;
  phone_number: string;
  roles: string[];
};

type Client = {
  id: number;
  email: string;
  full_name: string;
  phone_number: string;
  roles: string[];
  assigned_community_manager?: {
    id: number;
    full_name: string;
  };
  
};

const tabs = ["Community Managers", "Clients"];

export default function AssignedCommunityManagersTable() {
  const [assignedCMs, setAssignedCMs] = useState<User[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [activeTab, setActiveTab] = useState("Community Managers");
  const [isLoadingCMs, setIsLoadingCMs] = useState(true);
  const [isLoadingClients, setIsLoadingClients] = useState(true);
  const [fetchCMsError, setFetchCMsError] = useState<string | null>(null);
  const [fetchClientsError, setFetchClientsError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedCMToAssign, setSelectedCMToAssign] = useState<User | null>(null);
  const [selectedClientToAssign, setSelectedClientToAssign] = useState<number | null>(null);
  const [isAssigning, setIsAssigning] = useState(false);
  const [assignError, setAssignError] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false); // State for modal
  const [onConfirm, setOnConfirm] = useState<() => void>(() => () => {}); // Callback for confirm action

  useEffect(() => {
    loadAssignedCMs();
    loadClients();
  }, []);

  const loadAssignedCMs = async () => {
    setIsLoadingCMs(true);
    setFetchCMsError(null);
    try {
      const data = await getAssignedCommunityManagers();
      if ('error' in data) {
        setFetchCMsError(data.error);
        console.error("Error fetching assigned CMs:", data.error);
        return;
      }
      setAssignedCMs(data.map((cm: any) => ({ ...cm, roles: cm.roles || [] })));
    } catch (error: any) {
      setFetchCMsError(`An unexpected error occurred: ${error.message}`);
      console.error("Unexpected error fetching assigned CMs:", error);
    } finally {
      setIsLoadingCMs(false);
    }
  };

  const loadClients = async () => {
    setIsLoadingClients(true);
    setFetchClientsError(null);
    try {
      const data = await getClients();
      if ('error' in data) {
        setFetchClientsError(data.error);
        console.error("Error fetching clients:", data.error);
        return;
      }
      setClients(data as Client[]);
    } catch (error: any) {
      setFetchClientsError(`An unexpected error occurred: ${error.message}`);
      console.error("Unexpected error fetching clients:", error);
    } finally {
      setIsLoadingClients(false);
    }
  };

  const handleNavigateToCreateCM = () => {
    router.push('/moderators/createCM');
  };

  const filteredAssignedCMs = assignedCMs.filter(cm =>
    cm.full_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredClients = clients.filter(client =>
    client.full_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAssignCMToClient = async () => {
    if (!selectedCMToAssign || !selectedClientToAssign) {
      setAssignError("Please select a client to assign to.");
      return;
    }

    // Show the confirmation modal
    setOnConfirm(() => async () => {
      setIsAssigning(true);
      setAssignError(null);

      try {
        const data = await assignCommunityManagerToClient(selectedCMToAssign.id, selectedClientToAssign);
        if ("error" in data) {
          setAssignError(data.error);
          console.error("Error assigning CM to client:", data.error);
          return;
        }
        setShowAssignModal(false);
        setSelectedCMToAssign(null);
        setSelectedClientToAssign(null);
        loadAssignedCMs(); // Refresh CM list after assignment
      } catch (error: any) {
        setAssignError(`An unexpected error occurred: ${error.message}`);
        console.error("Unexpected error assigning CM to client:", error);
      } finally {
        setIsAssigning(false);
        setShowConfirmModal(false); // Close the modal
      }
    });
    setShowConfirmModal(true);
  };

  if (isLoadingCMs || isLoadingClients) {
    return <div>Loading data...</div>;
  }

  if (fetchCMsError || fetchClientsError) {
    return <div>Error loading data: {fetchCMsError || fetchClientsError}</div>;
  }

  return (
    <div className="p-6 bg-white rounded-xl shadow">
      <h1 className="mb-7 text-body-2xlg font-bold text-dark dark:text-white">
        {activeTab === "Community Managers" ? "Assigned Community Managers" : "Clients"}
      </h1>
      <div className="flex items-center justify-between mb-4">
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
            placeholder={`Search by Name in ${activeTab}`}
            className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-48 sm:text-sm border-gray-300 rounded-md"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        {activeTab === "Community Managers" && (
          <button
            className="px-4 py-2 bg-[#7a6cc5] text-white rounded-full transition duration-300 ease-in-out"
            onClick={handleNavigateToCreateCM}
          >
            <FaPlus className="inline-block mr-2" /> Add Community Manager
          </button>
        )}
      </div>

      {activeTab === "Community Managers" && (
        filteredAssignedCMs.length > 0 ? (
          <table className="min-w-full table-auto mb-6">
            <thead>
              <tr>
                <th className="px-4 py-2 border font-bold text-black">Name</th>
                <th className="px-4 py-2 border font-bold text-black">Email</th>
                <th className="px-4 py-2 border font-bold text-black">Phone Number</th>
                <th className="px-4 py-2 border font-bold text-black">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAssignedCMs.map((cm) => (
                <tr key={cm.id}>
                  <td className="px-4 py-2 border text-gray-800">{cm.full_name}</td>
                  <td className="px-4 py-2 border text-gray-800">{cm.email}</td>
                  <td className="px-4 py-2 border text-gray-800">{cm.phone_number}</td>
                  <td className="px-4 py-2 border text-gray-800">
                    <button
                      className="px-4 py-2 text-white rounded-lg hover:bg-[#8a11df] hover:shadow-lg transition duration-300 ease-in-out"
                      style={{ backgroundColor: "#8a11df" }}
                      onClick={() => {
                        setSelectedCMToAssign(cm);
                        setShowAssignModal(true);
                        setSelectedClientToAssign(null);
                      }}
                    >
                      Assign to Client
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-gray-600">{assignedCMs.length > 0 ? "No community managers found matching your search." : "No Community Managers are currently assigned to you."}</p>
        )
      )}

{activeTab === "Clients" && (
  filteredClients.length > 0 ? (
    <table className="min-w-full table-auto mb-6">
      <thead>
        <tr>
          <th className="px-4 py-2 border font-bold text-black">Name</th>
          <th className="px-4 py-2 border font-bold text-black">Email</th>
          <th className="px-4 py-2 border font-bold text-black">Phone Number</th>
          <th className="px-4 py-2 border font-bold text-black">Assigned Community Manager</th>
          <th className="px-4 py-2 border font-bold text-black">Actions</th>
        </tr>
      </thead>
      <tbody>
        {filteredClients.map((client) => (
          <tr key={client.id}>
            <td className="px-4 py-2 border text-gray-800">{client.full_name}</td>
            <td className="px-4 py-2 border text-gray-800">{client.email}</td>
            <td className="px-4 py-2 border text-gray-800">{client.phone_number}</td>
            <td className="px-4 py-2 border text-gray-800">
              {client.assigned_community_manager
                ? client.assigned_community_manager.full_name
                : "Not Assigned"}
            </td>
            <td className="px-4 py-2 border text-gray-800">
            <button
    className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-600"
    onClick={() => {
      router.push(`/content/create?clientId=${client.id}`);
    }}
  >
                Create Posts
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  ) : (
    <p className="text-gray-600">
      {clients.length > 0
        ? "No clients found matching your search."
        : "No Clients available."}
    </p>
  )
)}

      {showAssignModal && selectedCMToAssign && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg shadow-xl">
            <h2 className="text-lg font-semibold mb-4">Assign {selectedCMToAssign.full_name} to Client</h2>
            {assignError && <p className="text-red-500 mb-2">{assignError}</p>}
            <div>
              <label htmlFor="clientId" className="block mb-2">Select Client:</label>
              <select
                id="clientId"
                className="border p-2 rounded w-full"
                onChange={(e) => setSelectedClientToAssign(Number(e.target.value))}
                value={selectedClientToAssign || ""}
              >
                <option value="">-- Select Client --</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.full_name}
                  </option>
                ))}
              </select>
            </div>
            <div className="mt-4 flex justify-end">
              <button
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-full hover:bg-gray-400 mr-2"
                onClick={() => setShowAssignModal(false)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-primary text-white rounded-full hover:bg-blue-600"
                onClick={handleAssignCMToClient}
                disabled={!selectedClientToAssign || isAssigning}
              >
                {isAssigning ? "Assigning..." : "Assign"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-96">
            <h2 className="text-lg font-semibold text-gray-800">
              Confirm Changes
            </h2>
            <p className="text-sm text-gray-600 mt-2">
              Are you sure you want to assign this Community Manager to the selected client?
            </p>
            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={onConfirm}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-opacity-90"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}