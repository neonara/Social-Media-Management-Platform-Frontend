"use client";

import { SocialPage } from "@/types/social-page";
import React from "react";
import {
  FacebookPostPreview,
  InstagramPostPreview,
  LinkedinPostPreview,
} from "../../postPreview";

interface MediaFile {
  id?: number | string;
  preview: string;
  file?: File;
  name?: string;
}

interface PostPreviewProps {
  selectedPlatforms: string[];
  caption: string;
  mediaFiles: MediaFile[];
  clientPages: SocialPage[];
}

export const PostPreview: React.FC<PostPreviewProps> = ({
  selectedPlatforms,
  caption,
  mediaFiles,
  clientPages,
}) => {
  if (selectedPlatforms.length === 0 && caption.trim() === "") {
    return (
      <div className="py-4 text-center text-gray-400">
        Select a platform to preview your post.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {selectedPlatforms.map((platform) => {
        const mediaArray =
          mediaFiles.length > 0
            ? mediaFiles.map((file) => file.preview)
            : undefined;

        // Find the matching social page for this platform from clientPages if available
        const socialPage = clientPages.find(
          (page) => page.platform === platform,
        );

        switch (platform) {
          case "facebook":
            return (
              <FacebookPostPreview
                key="facebook"
                pageName={socialPage?.page_name || "Facebook Page"}
                content={caption}
                media={mediaArray}
              />
            );
          case "instagram":
            return (
              <InstagramPostPreview
                key="instagram"
                pageName={socialPage?.page_name || "Instagram Account"}
                content={caption}
                media={mediaArray}
              />
            );
          case "linkedin":
            return (
              <LinkedinPostPreview
                key="linkedin"
                pageName={socialPage?.page_name || "LinkedIn Page"}
                content={caption}
                media={mediaArray}
              />
            );
          default:
            return null;
        }
      })}
    </div>
  );
};
