"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import {
  getAssignedCommunityManagers,
  assignCommunityManagerToClient,
  getClients,
} from "@/services/moderatorsService";
import { FaSearch, FaPlus } from "react-icons/fa";
import { useRouter } from "next/navigation";
import { GetUser } from "@/types/user";
import { getImageUrl } from "@/utils/image-url";

const tabs = ["Community Managers", "Clients"];

export default function AssignedCommunityManagersTable() {
  const [assignedCMs, setAssignedCMs] = useState<GetUser[]>([]);
  const [clients, setClients] = useState<GetUser[]>([]);
  const [activeTab, setActiveTab] = useState("Community Managers");
  const [isLoadingCMs, setIsLoadingCMs] = useState(true);
  const [isLoadingClients, setIsLoadingClients] = useState(true);
  const [fetchCMsError, setFetchCMsError] = useState<string | null>(null);
  const [fetchClientsError, setFetchClientsError] = useState<string | null>(
    null,
  );
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedCMToAssign, setSelectedCMToAssign] = useState<GetUser | null>(
    null,
  );
  const [selectedClientToAssign, setSelectedClientToAssign] = useState<
    number | null
  >(null);
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
      if ("error" in data) {
        setFetchCMsError(data.error);
        console.error("Error fetching assigned CMs:", data.error);
        return;
      }
      // Adjusted to use `role` instead of `roles`
      setAssignedCMs(
        data.map((cm: GetUser) => ({ ...cm, role: cm.role ?? undefined })),
      );
    } catch (error: unknown) {
      if (error instanceof Error) {
        setFetchCMsError(`An unexpected error occurred: ${error.message}`);
        console.error("Unexpected error fetching assigned CMs:", error);
      }
    } finally {
      setIsLoadingCMs(false);
    }
  };

  const loadClients = async () => {
    setIsLoadingClients(true);
    setFetchClientsError(null);
    try {
      const data = await getClients();
      if ("error" in data) {
        setFetchClientsError(data.error);
        console.error("Error fetching clients:", data.error);
        return;
      }
      setClients(data as GetUser[]);
    } catch (error: unknown) {
      if (error instanceof Error) {
        setFetchClientsError(`An unexpected error occurred: ${error.message}`);
        console.error("Unexpected error fetching clients:", error);
      } else {
        setFetchClientsError("An unexpected error occurred.");
        console.error("Unexpected error fetching clients:", error);
      }
    } finally {
      setIsLoadingClients(false);
    }
  };

  const handleNavigateToCreateCM = () => {
    router.push("/moderators/createCM");
  };

  const filteredAssignedCMs = assignedCMs.filter((cm) =>
    cm.full_name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const filteredClients = clients.filter((client) =>
    client.full_name.toLowerCase().includes(searchQuery.toLowerCase()),
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
        const data = await assignCommunityManagerToClient(
          selectedCMToAssign.id,
          selectedClientToAssign,
        );
        if ("error" in data) {
          setAssignError(data.error);
          console.error("Error assigning CM to client:", data.error);
          return;
        }
        setShowAssignModal(false);
        setSelectedCMToAssign(null);
        setSelectedClientToAssign(null);
        await loadAssignedCMs(); // Refresh CM list after assignment
        await loadClients(); // Refresh client list to update assigned CM
      } catch (error: unknown) {
        if (error instanceof Error) {
          setAssignError(`An unexpected error occurred: ${error.message}`);
          console.error("Unexpected error assigning CM to client:", error);
        } else {
          setAssignError("An unexpected error occurred.");
          console.error("Unexpected error assigning CM to client:", error);
        }
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
  console.log(
    "Assigned Client:",
    assignedCMs.map((cm) => cm.assigned_clients?.full_name),
    "Clients:",
    clients.map((client) => client.assigned_communitymanagers?.full_name),
  );

  return (
    <div className="rounded-xl bg-white p-6 shadow dark:bg-gray-800">
      <h1 className="mb-7 text-body-2xlg font-bold text-dark dark:text-white">
        {activeTab === "Community Managers"
          ? "Assigned Community Managers"
          : "Clients"}
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
        {activeTab === "Community Managers" && (
          <button
            className="rounded-full bg-[#7a6cc5] px-4 py-2 text-white transition duration-300 ease-in-out"
            onClick={handleNavigateToCreateCM}
          >
            <FaPlus className="mr-2 inline-block" /> Add Community Manager
          </button>
        )}
        <div className="ml-4 flex items-center rounded-md border border-gray-300 bg-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700">
          <FaSearch className="ml-2 text-gray-500 dark:text-gray-400" />
          <input
            type="text"
            placeholder={`Search by Name in ${activeTab}`}
            className="block w-48 bg-transparent p-3 text-gray-900 placeholder-gray-500 dark:text-white dark:placeholder-gray-400 sm:text-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {activeTab === "Community Managers" &&
        (filteredAssignedCMs.length > 0 ? (
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
                  Assigned Client
                </th>
                <th className="border border-gray-300 px-4 py-2 font-bold text-black dark:border-gray-600 dark:text-white">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredAssignedCMs.map((cm) => (
                <tr
                  key={cm.id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <td className="border border-gray-300 px-4 py-2 text-gray-800 dark:border-gray-600 dark:text-gray-200">
                    <div className="flex items-center gap-3">
                      <Image
                        src={getImageUrl(cm.user_image)}
                        className="size-12 rounded-full object-cover"
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
                    {cm.phone_number}
                  </td>
                  <td className="border border-gray-300 px-4 py-2 text-gray-800 dark:border-gray-600 dark:text-gray-200">
                    {cm.assigned_clients ? (
                      <div className="flex items-center gap-3">
                        <Image
                          src={getImageUrl(cm.assigned_clients.user_image)}
                          className="size-8 rounded-full object-cover"
                          alt={`Avatar of ${cm.assigned_clients.full_name || "user"}`}
                          role="presentation"
                          width={32}
                          height={32}
                          onError={(e) => {
                            e.currentTarget.src = "/images/user/user-03.png";
                          }}
                        />
                        <span>{cm.assigned_clients.full_name}</span>
                      </div>
                    ) : (
                      "Not Assigned"
                    )}
                  </td>
                  <td className="border border-gray-300 px-4 py-2 text-gray-800 dark:border-gray-600 dark:text-gray-200">
                    <button
                      className="rounded-lg px-4 py-2 text-white transition duration-300 ease-in-out hover:bg-[#8a11df] hover:shadow-lg"
                      style={{ backgroundColor: "#8a11df" }}
                      onClick={() => {
                        setSelectedCMToAssign(cm);
                        setShowAssignModal(true);
                        setSelectedClientToAssign(null);
                      }}
                    >
                      {cm.assigned_clients ? "Edit Assign" : "Assign to Client"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-gray-600 dark:text-gray-400">
            {assignedCMs.length > 0
              ? "No community managers found matching your search."
              : "No Community Managers are currently assigned to you."}
          </p>
        ))}

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
                  Assigned Community Manager
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
                        className="size-12 rounded-full object-cover"
                        alt={`Avatar of ${client.full_name || "user"}`}
                        role="presentation"
                        width={32}
                        height={32}
                        onError={(e) => {
                          e.currentTarget.src = "/images/user/user-03.png";
                        }}
                      />
                      <span>{client.full_name}</span>
                    </div>
                  </td>
                  <td className="border border-gray-300 px-4 py-2 text-gray-800 dark:border-gray-600 dark:text-gray-200">
                    {client.email}
                  </td>
                  <td className="border border-gray-300 px-4 py-2 text-gray-800 dark:border-gray-600 dark:text-gray-200">
                    {client.phone_number}
                  </td>
                  <td className="border border-gray-300 px-4 py-2 text-gray-800 dark:border-gray-600 dark:text-gray-200">
                    {client.assigned_communitymanagers ? (
                      <div className="flex items-center gap-3">
                        <Image
                          src={getImageUrl(
                            client.assigned_communitymanagers.user_image,
                          )}
                          className="size-8 rounded-full object-cover"
                          alt={`Avatar of ${client.assigned_communitymanagers.full_name || client.assigned_communitymanagers.email || "user"}`}
                          role="presentation"
                          width={32}
                          height={32}
                          onError={(e) => {
                            e.currentTarget.src = "/images/user/user-03.png";
                          }}
                        />
                        <span>
                          {client.assigned_communitymanagers.full_name ||
                            client.assigned_communitymanagers.email}
                        </span>
                      </div>
                    ) : (
                      "Not Assigned"
                    )}
                  </td>
                  <td className="border border-gray-300 px-4 py-2 text-gray-800 dark:border-gray-600 dark:text-gray-200">
                    <button
                      className="rounded-lg bg-primary px-4 py-2 text-white hover:bg-blue-600"
                      onClick={() => {
                        router.push(`/content?clientId=${client.id}`);
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
          <p className="text-gray-600 dark:text-gray-400">
            {clients.length > 0
              ? "No clients found matching your search."
              : "No Clients available."}
          </p>
        ))}

      {showAssignModal && selectedCMToAssign && (
        <div className="fixed inset-0 flex items-center justify-center bg-gray-500 bg-opacity-50 dark:bg-black dark:bg-opacity-60">
          <div className="rounded-lg bg-white p-6 shadow-xl dark:bg-gray-800">
            <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
              Assign {selectedCMToAssign.full_name} to Client
            </h2>
            {assignError && <p className="mb-2 text-red-500">{assignError}</p>}
            <div>
              <label
                htmlFor="clientId"
                className="mb-2 block text-gray-700 dark:text-gray-300"
              >
                Select Client:
              </label>
              <select
                id="clientId"
                className="w-full rounded border border-gray-300 bg-white p-2 text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                onChange={(e) =>
                  setSelectedClientToAssign(Number(e.target.value))
                }
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
                className="mr-2 rounded-full bg-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-400 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500"
                onClick={() => setShowAssignModal(false)}
              >
                Cancel
              </button>
              <button
                className="rounded-full bg-primary px-4 py-2 text-white hover:bg-blue-600"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 dark:bg-opacity-70">
          <div className="w-96 rounded-lg bg-white p-6 shadow-lg dark:bg-gray-800">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
              Confirm Changes
            </h2>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
              Are you sure you want to assign this Community Manager to the
              selected client?
            </p>
            <div className="mt-4 flex justify-end gap-3">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
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
