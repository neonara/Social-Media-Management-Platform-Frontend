"use client";

import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import AssignmentTabs from "@/components/Assignment_Table/blank";
import ModeratorTable from "@/components/ModeratorTable/moderatorTable";
import CmAssignmentsTable from "@/components/CmTable/cmTable";
import ClientAssignmentsTable from "@/components/ClientTable/page";
import { useUser } from "@/context/UserContext";

const UserAssignmentPage = () => {
  const { role } = useUser();

  return (
    <>
      <Breadcrumb pageName="Post" />
      {role === "administrator" && <AssignmentTabs />}
      {(role === "moderator" || role === "administrator") && (
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
