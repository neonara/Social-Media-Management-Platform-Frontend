import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import CalendarBox from "@/components/CalenderBox";
import UserTable from "@/components/users/userTable";
import { AssignmentTable } from "@/components/UsersTable/blank";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Calender Page",
  // other metadata
};

const CalendarPage = () => {
  return (
    <>
      <Breadcrumb pageName="Calendar" />

      <CalendarBox />
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">User List</h2>
        <AssignmentTable />
        <UserTable />
      </div>
    </>
  );
};

export default CalendarPage;
