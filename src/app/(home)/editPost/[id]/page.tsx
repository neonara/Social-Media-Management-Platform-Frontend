"use client";

import React, { Suspense } from "react";
import { useParams } from "next/navigation";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import PostForm from "@/components/PostForm";

function EditPostContent() {
  const params = useParams();
  const postId = params.id as string;

  return <PostForm mode="edit" postId={postId} />;
}

const EditPostPage = () => {
  return (
    <>
      <Breadcrumb pageName="Edit Post" />
      <Suspense fallback={<div>Loading...</div>}>
        <EditPostContent />
      </Suspense>
    </>
  );
};

export default EditPostPage;
