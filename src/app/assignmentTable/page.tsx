import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import AssignmentTabs from "@/components/Assignment_Table/blank";
import ModeratorTable from "@/components/ModeratorTable/moderatorTable";

import CmAssignmentsTable from "@/components/CmTable/cmTable";
import ClientAssignmentsTable from "@/components/ClientTable/page";

export const metadata = {
  title: "Assignment Table",
};

const UserAssignmentPage = () => {
  return (
    <>
      <Breadcrumb pageName="Post" />
      <AssignmentTabs />
      <div className="col-span-12 mt-6">
                <ModeratorTable />
              </div>
              <div className="col-span-12 mt-6">
                <CmAssignmentsTable/>
              </div>
              <div className="col-span-12 mt-6">
                <ClientAssignmentsTable />
              </div>
    </>
  );
};

export default UserAssignmentPage;
