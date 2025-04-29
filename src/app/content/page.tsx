import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { PostForm } from "@/components/postCreate/page";

export const metadata = {
  title: "Post Form",
};

const PostsPage = () => {
  return (
    <>
      <Breadcrumb pageName="Post" />
      <PostForm />
    </>
  );
};

export default PostsPage;
