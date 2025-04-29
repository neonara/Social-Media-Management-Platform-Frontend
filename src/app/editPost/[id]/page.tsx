import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import EditPostForm from "@/components/postEdit/EditPostForm";

export const metadata = {
  title: "Edit Post",
};

const EditPostPage = async ({ params }: { params: { id: string } }) => {
  // Explicitly await the params.id
  const postId = await Promise.resolve(params.id);

  return (
    <>
      <Breadcrumb pageName="Edit Post" />
      <EditPostForm postId={postId} /> {/* Pass the resolved postId */}
    </>
  );
};

export default EditPostPage;