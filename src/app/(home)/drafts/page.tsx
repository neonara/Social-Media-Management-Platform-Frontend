import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import DraftPosts from "@/components/DraftPosts/page";

export const metadata = {
  title: "Drafts",
};

const DraftsPage = () => {
  return (
    <>
      <Breadcrumb pageName="Drafts" />
      <DraftPosts />
    </>
  );
};

export default DraftsPage;
