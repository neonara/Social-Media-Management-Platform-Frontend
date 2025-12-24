"use client";

import { useThemedToast } from "@/hooks/useThemedToast";
import { rewriteCaptionByMood } from "@/services/aiService";
import { formatCaptionWithHashtags } from "@/utils/captionFormatter";
import { Loader, Sparkles } from "lucide-react";
import React, { useState } from "react";

interface RewriteByMoodProps {
  caption: string;
  platform: "instagram" | "facebook" | "linkedin";
  onReplaceCaption: (caption: string) => void;
}

const MOODS = [
  "professional",
  "casual",
  "humorous",
  "inspirational",
  "urgent",
  "friendly",
  "formal",
  "trendy",
];

const RewriteByMood: React.FC<RewriteByMoodProps> = ({
  caption,
  platform,
  onReplaceCaption,
}) => {
  const [loading, setLoading] = useState(false);
  const [selectedMood, setSelectedMood] = useState<string>("professional");
  const themedToast = useThemedToast();

  const handleRewriteCaption = async () => {
    if (!caption.trim()) {
      themedToast.error("Please write a caption first");
      return;
    }

    setLoading(true);
    try {
      const response = await rewriteCaptionByMood(
        caption,
        selectedMood,
        "neutral",
        platform,
      );

      console.debug("Rewrite caption response:", response);

      if (response.rewritten) {
        const formattedCaption = formatCaptionWithHashtags(response.rewritten);
        onReplaceCaption(formattedCaption);
        themedToast.success("Caption rewritten successfully!");
      } else {
        console.error("Rewrite response missing 'rewritten' field:", response);
        themedToast.error("Failed to rewrite caption");
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error("Failed to rewrite caption:", error, errorMsg);
      themedToast.error(`Failed to rewrite caption: ${errorMsg}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3 rounded-lg border border-purple-200 bg-purple-50 p-4 dark:border-purple-700 dark:bg-purple-900 dark:bg-opacity-20">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 font-semibold text-gray-800 dark:text-white">
          <Sparkles size={18} className="text-blue-500" />
          Rewrite
        </h3>
      </div>
      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
            Select Target Mood/Tone:
          </label>
          <select
            value={selectedMood}
            onChange={(e) => setSelectedMood(e.target.value)}
            className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          >
            {MOODS.map((mood) => (
              <option key={mood} value={mood}>
                {mood.charAt(0).toUpperCase() + mood.slice(1)}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={handleRewriteCaption}
          disabled={loading || !caption.trim()}
          className="flex w-full items-center justify-center gap-2 rounded-md bg-purple-500 px-4 py-2 font-medium text-white hover:bg-purple-600 disabled:bg-gray-400 dark:hover:bg-purple-600"
        >
          {loading ? (
            <>
              <Loader size={16} className="animate-spin" />
              Rewriting...
            </>
          ) : (
            <>
              <Sparkles size={16} />
              Rewrite Caption
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default RewriteByMood;
