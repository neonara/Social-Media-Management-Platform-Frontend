"use client";

import React, { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import PostForm from "@/components/PostForm";

function CreatePostContent() {
  const searchParams = useSearchParams();
  const clientId = searchParams.get("clientId");

  return <PostForm mode="create" clientId={clientId} />;
}

const CreatePostPage = () => {
  return (
    <>
      <Breadcrumb pageName="Create Post" />
      <Suspense fallback={<div>Loading...</div>}>
        <CreatePostContent />
      </Suspense>
    </>
  );
};

export default CreatePostPage;
