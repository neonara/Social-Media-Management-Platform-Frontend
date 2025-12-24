"use client";

import React, { useState } from "react";
import AnalyzeMood from "./AnalyzeMood";
import GenerateByMood from "./GenerateByMood";
import RewriteByMood from "./RewriteByMood";

interface AIToolbarProps {
  caption: string;
  platform: "instagram" | "facebook" | "linkedin";
  onCaptionChange: (caption: string) => void;
  onHashtagsInsert: (hashtags: string[]) => void;
  allCaptions?: string[];
}

const AIToolbar: React.FC<AIToolbarProps> = ({
  caption,
  platform,
  onCaptionChange,
  onHashtagsInsert,
  allCaptions = [],
}) => {
  const [expandedTool, setExpandedTool] = useState<string | null>(null);

  return (
    <div className="py-6">
      <div className="mb-2 flex justify-between gap-2">
        {/* Generate by Mood */}

        <GenerateByMood
          topic={caption}
          platform={platform}
          onInsertCaption={onCaptionChange}
        />

        {/* Rewrite by Mood */}

        <RewriteByMood
          caption={caption}
          platform={platform}
          onReplaceCaption={onCaptionChange}
        />

        {/* Analyze Mood */}

        <AnalyzeMood caption={caption} />
      </div>

      <p className="text-xs text-gray-500 dark:text-gray-400">
        💡 Tip: Use these tools to enhance your captions with AI-powered
        suggestions
      </p>
    </div>
  );
};

export default AIToolbar;
