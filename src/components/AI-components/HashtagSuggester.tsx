"use client";

import { useThemedToast } from "@/hooks/useThemedToast";
import { suggestHashtags } from "@/services/aiService";
import { Check, Copy, Loader, Sparkles } from "lucide-react";
import React, { useState } from "react";

interface HashtagSuggesterProps {
  caption: string;
  onInsertHashtags: (hashtags: string[]) => void;
}

const HashtagSuggester: React.FC<HashtagSuggesterProps> = ({
  caption,
  onInsertHashtags,
}) => {
  const [loading, setLoading] = useState(false);
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);
  const themedToast = useThemedToast();

  const handleSuggestHashtags = async () => {
    if (!caption.trim()) {
      themedToast.error("Please write a caption first");
      return;
    }

    setLoading(true);
    try {
      const response = await suggestHashtags(caption, "instagram", 10);

      if (response.hashtags && response.hashtags.length > 0) {
        setHashtags(response.hashtags);
        themedToast.success("Hashtags suggested successfully!");
      } else {
        themedToast.error("No hashtags were suggested");
      }
    } catch (error) {
      console.error("Failed to suggest hashtags:", error);
      themedToast.error("Failed to suggest hashtags. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopyHashtags = () => {
    const hashtagString = hashtags.join(" ");
    navigator.clipboard.writeText(hashtagString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    themedToast.success("Hashtags copied to clipboard!");
  };

  const handleInsertHashtags = () => {
    onInsertHashtags(hashtags);
    setHashtags([]);
    themedToast.success("Hashtags added to caption!");
  };

  return (
    <div className="p-">
      {hashtags.length === 0 ? (
        <button
          onClick={handleSuggestHashtags}
          disabled={loading || !caption.trim()}
          className="flex w-full items-center justify-center gap-2 rounded-md bg-yellow-500 px-4 py-2 font-medium text-white hover:bg-yellow-600 disabled:bg-gray-400 dark:hover:bg-yellow-600"
        >
          {loading ? (
            <>
              <Loader size={16} className="animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Sparkles size={18} />
              Suggest Hashtags
            </>
          )}
        </button>
      ) : (
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {hashtags.map((tag, index) => (
              <span
                key={index}
                className="inline-block rounded-full bg-yellow-100 px-3 py-1 text-sm font-medium text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100"
              >
                {tag}
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleCopyHashtags}
              className="flex flex-1 items-center justify-center gap-2 rounded-md bg-gray-200 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
            >
              {copied ? (
                <>
                  <Check size={14} />
                  Copied!
                </>
              ) : (
                <>
                  <Copy size={14} />
                  Copy
                </>
              )}
            </button>
            <button
              onClick={handleInsertHashtags}
              className="flex flex-1 items-center justify-center gap-2 rounded-md bg-yellow-500 px-3 py-2 text-sm font-medium text-white hover:bg-yellow-600"
            >
              Insert to Caption
            </button>
            <button
              onClick={() => setHashtags([])}
              className="flex flex-1 items-center justify-center gap-2 rounded-md bg-gray-200 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
            >
              Clear
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default HashtagSuggester;
