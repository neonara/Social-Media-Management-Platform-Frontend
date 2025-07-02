import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import EditPostForm from "@/components/postEdit/EditPostForm";

export const metadata = {
  title: "Edit Post",
};

const EditPostPage = async ({
  params,
}: {
  params: Promise<{ id: string }>;
}) => {
  const resolvedParams = await params;
  const postId = resolvedParams.id;

  return (
    <>
      <Breadcrumb pageName="Edit Post" />
      <EditPostForm postId={postId} />
    </>
  );
};

export default EditPostPage;
