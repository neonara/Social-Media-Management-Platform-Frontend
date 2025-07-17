"use client";

import AssignmentTabs from "@/components/Assignment_Table/blank";
import ModeratorTable from "@/components/ModeratorTable/moderatorTable";
import CmAssignmentsTable from "@/components/CmTable/cmTable";
import ClientAssignmentsTable from "@/components/ClientTable/page";
import { useUser } from "@/context/UserContext";

const UserAssignmentPage = () => {
  const { userProfile, isLoading, role } = useUser();

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-32 w-32 animate-spin rounded-full border-b-2 border-gray-900"></div>
      </div>
    );
  }

  // Redirect to login if not authenticated (handled by UserContext)
  if (!userProfile) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-gray-600">Please log in to access this page.</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      {/* Admin and Super Admin Content */}
      {(role === "administrator" || role === "super_administrator") && (
        <AssignmentTabs />
      )}

      {/* Moderator Content */}
      {role === "moderator" && (
        <div className="col-span-12 mt-6">
          <ModeratorTable />
        </div>
      )}

      {/* Community Manager Content */}
      {role === "community_manager" && (
        <div className="col-span-12 mt-6">
          <CmAssignmentsTable />
        </div>
      )}

      {/* Client Content */}
      {role === "client" && (
        <div className="col-span-12 mt-6">
          <ClientAssignmentsTable />
        </div>
      )}

      {/* Fallback for unknown roles */}
      {![
        "administrator",
        "super_administrator",
        "moderator",
        "community_manager",
        "client",
      ].includes(role) && (
        <div className="flex min-h-64 items-center justify-center">
          <div className="text-gray-600">
            You don&apos;t have permission to view this content.
          </div>
        </div>
      )}
    </div>
  );
};

export default UserAssignmentPage;
