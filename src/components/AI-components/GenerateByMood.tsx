"use client";

import { useThemedToast } from "@/hooks/useThemedToast";
import { generateContentByMood } from "@/services/aiService";
import { formatCaptionWithHashtags } from "@/utils/captionFormatter";
import { Loader, Sparkles } from "lucide-react";
import React, { useState } from "react";

interface GenerateByMoodProps {
  topic: string;
  platform: "instagram" | "facebook" | "linkedin";
  onInsertCaption: (caption: string) => void;
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

const GenerateByMood: React.FC<GenerateByMoodProps> = ({
  topic,
  platform,
  onInsertCaption,
}) => {
  const [loading, setLoading] = useState(false);
  const [selectedMood, setSelectedMood] = useState<string>("professional");
  const themedToast = useThemedToast();

  const handleGenerateByMood = async () => {
    if (!topic.trim()) {
      themedToast.error("Please write a caption first");
      return;
    }

    setLoading(true);
    try {
      const response = await generateContentByMood(
        topic,
        selectedMood,
        "neutral",
        platform,
        1,
      );

      // Handle both array of strings and array of objects
      let caption = "";
      if (Array.isArray(response.captions) && response.captions.length > 0) {
        const firstCaption = response.captions[0];
        caption =
          typeof firstCaption === "string"
            ? firstCaption
            : firstCaption.text || "";
      }

      if (caption) {
        const formattedCaption = formatCaptionWithHashtags(caption);
        onInsertCaption(formattedCaption);
        themedToast.success("Caption generated successfully!");
      } else {
        themedToast.error("No caption was generated");
      }
    } catch (error) {
      console.error("Failed to generate caption:", error);
      themedToast.error("Failed to generate caption. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3 rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-700 dark:bg-blue-900 dark:bg-opacity-20">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 font-semibold text-gray-800 dark:text-white">
          <Sparkles size={18} className="text-blue-500" />
          Generate
        </h3>
      </div>

      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
            Select Mood/Tone:
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
          onClick={handleGenerateByMood}
          disabled={loading || !topic.trim()}
          className="flex w-full items-center justify-center gap-2 rounded-md bg-blue-500 px-4 py-2 font-medium text-white hover:bg-blue-600 disabled:bg-gray-400 dark:hover:bg-blue-600"
        >
          {loading ? (
            <>
              <Loader size={16} className="animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Sparkles size={16} />
              Generate Caption
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default GenerateByMood;
