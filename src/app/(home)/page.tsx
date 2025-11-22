"use client";

import AssignmentTabs from "@/app/(home)/_components/AssignmentTable/AssignmentTabs";
import ClientAssignmentsTable from "@/app/(home)/_components/AssignmentTable/ClientAssignments";
import CmAssignmentsTable from "@/app/(home)/_components/AssignmentTable/CmAssignments";
import ModeratorTable from "@/app/(home)/_components/AssignmentTable/ModeratorAssignments";
import ClientStats from "@/app/(home)/_components/ClientStats";
import { useUser } from "@/context/UserContext";
import { getClientAssignments } from "@/services/clientService";
import { User } from "lucide-react";
import { useEffect, useState } from "react";

const UserAssignmentPage = () => {
  const { userProfile, isLoading, role } = useUser();
  const [hasModerator, setHasModerator] = useState<boolean>(false);
  const [checkingAssignments, setCheckingAssignments] = useState<boolean>(true);

  // Check if client has a moderator assigned
  useEffect(() => {
    async function checkClientAssignments() {
      if (role === "client") {
        try {
          const data = await getClientAssignments();
          setHasModerator(!!data.moderator);
        } catch (error) {
          console.error("Error checking assignments:", error);
          setHasModerator(false);
        } finally {
          setCheckingAssignments(false);
        }
      } else {
        setCheckingAssignments(false);
      }
    }

    if (!isLoading && userProfile) {
      checkClientAssignments();
    }
  }, [role, isLoading, userProfile]);

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
        <div className="col-span-12 mt-2">
          <ModeratorTable />
        </div>
      )}

      {/* Community Manager Content */}
      {role === "community_manager" && (
        <div className="col-span-12 mt-2">
          <CmAssignmentsTable />
        </div>
      )}

      {/* Client Content */}
      {role === "client" && (
        <div className="col-span-12 mt-2">
          {checkingAssignments ? (
            <div className="flex items-center justify-center p-8">
              <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-gray-900"></div>
              <span className="ml-2 text-gray-600">
                Checking assignments...
              </span>
            </div>
          ) : hasModerator ? (
            <>
              <div className="mb-6 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 p-6 dark:from-gray-800 dark:to-gray-700">
                <h2 className="mb-2 text-xl font-semibold text-gray-900 dark:text-white">
                  Welcome to Your Dashboard
                </h2>
                <p className="text-gray-600 dark:text-gray-300">
                  View your social media performance and team members below.
                </p>
              </div>
              <ClientAssignmentsTable />
              {/* Stats Dashboard */}
              <div className="mt-6">
                <ClientStats />
              </div>
            </>
          ) : (
            <div className="rounded-xl border border-gray-200 bg-white p-8 text-center shadow-sm dark:border-gray-700 dark:bg-gray-800">
              <div className="mb-4">
                <User className="mx-auto h-16 w-16 text-gray-400" />
              </div>
              <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">
                No Team Assigned Yet
              </h2>
              <p className="mb-2 text-gray-600 dark:text-gray-300">
                You don&apos;t have any team members assigned to help manage
                your social media content yet.
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Please contact your administrator to assign a moderator and
                community managers who will help create and manage your content.
              </p>
            </div>
          )}
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
