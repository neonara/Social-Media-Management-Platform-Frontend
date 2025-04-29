import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import UsersTable from "@/components/UsersTable/UsersTable";

export const metadata = {
  title: "Users Table",
};

const UsersPage = () => {
  return (
    <>
      <Breadcrumb pageName="Post" />
      <UsersTable />
    </>
  );
};

export default UsersPage;
