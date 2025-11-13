"use client";

import AIToolbar from "@/components/AI-components/AIToolbar";
import { SimpleWysiwyg } from "@/components/SimpleWysiwyg";
import { Input } from "@/components/ui/input";
import React, { useRef } from "react";

interface PostDetailsSectionProps {
  mode: "create" | "edit";
  title: string;
  caption: string;
  selectedPlatforms?: string[];
  onTitleChange?: (title: string) => void;
  onCaptionChange: (caption: string) => void;
  onHashtagsInsert?: (hashtags: string[]) => void;
  titleRef?: React.RefObject<HTMLInputElement>;
}

export const PostDetailsSection: React.FC<PostDetailsSectionProps> = ({
  mode,
  title,
  caption,
  selectedPlatforms = [],
  onTitleChange,
  onCaptionChange,
  onHashtagsInsert,
  titleRef,
}) => {
  const localTitleRef = useRef<HTMLInputElement>(null);
  const finalTitleRef = titleRef || localTitleRef;

  // Default to instagram for AI toolbar if no platform selected
  const activePlatform = (
    selectedPlatforms.includes("instagram")
      ? "instagram"
      : selectedPlatforms.includes("facebook")
        ? "facebook"
        : selectedPlatforms.includes("linkedin")
          ? "linkedin"
          : "instagram"
  ) as "instagram" | "facebook" | "linkedin";

  return (
    <div className="space-y-4">
      <div>
        <label
          htmlFor="title"
          className="flex gap-2 text-sm font-medium text-gray-700"
        >
          <h3 className="text-lg font-semibold">Post Title </h3>
          {mode === "create" && <span className="text-red-500">*</span>}
        </label>
        <Input
          id="title"
          ref={finalTitleRef}
          type="text"
          placeholder="Enter post title"
          value={title}
          onChange={(e) => onTitleChange?.(e.target.value)}
          className="mt-1"
        />
      </div>

      {caption.trim().length > 0 && (
        <AIToolbar
          caption={caption}
          platform={activePlatform}
          onCaptionChange={onCaptionChange}
          onHashtagsInsert={onHashtagsInsert || (() => {})}
        />
      )}

      <div>
        <label
          htmlFor="caption"
          className="mb-1 flex gap-2 text-sm font-medium text-gray-700"
        >
          <h3 className="text-lg font-semibold">Caption</h3>{" "}
          {mode === "create" && <span className="text-red-500">*</span>}
        </label>
        <SimpleWysiwyg
          value={caption}
          onChange={onCaptionChange}
          caption={caption}
        />
      </div>
    </div>
  );
};
