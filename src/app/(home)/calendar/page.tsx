import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import CalendarBox from "@/components/CalenderBox";
import AssignmentTabs from "@/components/UsersTable/blank";
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
        <AssignmentTabs />
      </div>
    </>
  );
};

export default CalendarPage;
