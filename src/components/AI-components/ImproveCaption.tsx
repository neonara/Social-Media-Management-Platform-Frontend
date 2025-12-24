"use client";

import { useThemedToast } from "@/hooks/useThemedToast";
import { improveCaption } from "@/services/aiService";
import { Loader, Sparkles } from "lucide-react";
import React, { useState } from "react";

interface ImproveCaptionProps {
  caption: string;
  platform: "instagram" | "facebook" | "linkedin";
  onReplaceCaption: (caption: string) => void;
}

const ImproveCaption: React.FC<ImproveCaptionProps> = ({
  caption,
  platform,
  onReplaceCaption,
}) => {
  const [loading, setLoading] = useState(false);
  const themedToast = useThemedToast();

  const handleImproveCaption = async () => {
    if (!caption.trim()) {
      themedToast.error("Please write a caption first");
      return;
    }

    setLoading(true);
    try {
      const response = await improveCaption(caption, platform);

      if (response.improved_caption) {
        onReplaceCaption(response.improved_caption);
        themedToast.success("Caption improved successfully!");
      } else {
        themedToast.error("Failed to improve caption");
      }
    } catch (error) {
      console.error("Failed to improve caption:", error);
      themedToast.error("Failed to improve caption. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3 rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-700 dark:bg-green-900 dark:bg-opacity-20">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 font-semibold text-gray-800 dark:text-white">
          <Sparkles size={18} className="text-green-500" />
          Improve Caption
        </h3>
      </div>

      <button
        onClick={handleImproveCaption}
        disabled={loading || !caption.trim()}
        className="flex w-full items-center justify-center gap-2 rounded-md bg-green-500 px-4 py-2 font-medium text-white hover:bg-green-600 disabled:bg-gray-400 dark:hover:bg-green-600"
      >
        {loading ? (
          <>
            <Loader size={16} className="animate-spin" />
            Improving...
          </>
        ) : (
          <>
            <Sparkles size={16} />
            Improve Caption
          </>
        )}
      </button>
    </div>
  );
};

export default ImproveCaption;
