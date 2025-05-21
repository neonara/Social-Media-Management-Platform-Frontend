"use client";

import AssignmentTabs from "@/components/Assignment_Table/blank";
import ModeratorTable from "@/components/ModeratorTable/moderatorTable";
import CmAssignmentsTable from "@/components/CmTable/cmTable";
import ClientAssignmentsTable from "@/components/ClientTable/page";
import { useUser } from "@/context/UserContext";

const UserAssignmentPage = () => {
  const { role } = useUser();

  return (
    <>
      {(role === "administrator" || role === "super_administrator") && (
        <AssignmentTabs />
      )}
      {role === "moderator" && (
        <div className="col-span-12 mt-6">
          <ModeratorTable />
        </div>
      )}
      {role === "community_manager" && (
        <div className="col-span-12 mt-6">
          <CmAssignmentsTable />
        </div>
      )}
      {role === "client" && (
        <div className="col-span-12 mt-6">
          <ClientAssignmentsTable />
        </div>
      )}
    </>
  );
};

export default UserAssignmentPage;
