import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import AssignmentTabs from "@/components/Assignment_Table/blank";

export const metadata = {
  title: "Assignment Table",
};

const UserAssignmentPage = () => {
  return (
    <>
      <Breadcrumb pageName="Post" />
      <AssignmentTabs />
    </>
  );
};

export default UserAssignmentPage;
