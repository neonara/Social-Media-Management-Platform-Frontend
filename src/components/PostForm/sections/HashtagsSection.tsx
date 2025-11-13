import HashtagSuggester from "@/components/AI-components/HashtagSuggester";
import React, { useCallback, useRef } from "react";

interface HashtagsSectionProps {
  caption: string;
  hashtags: string[];
  onHashtagsInsert: (hashtags: string[]) => void;
  onRemoveHashtag: (index: number) => void;
  onAddHashtag: (event: React.KeyboardEvent<HTMLInputElement>) => void;
}

export const HashtagsSection: React.FC<HashtagsSectionProps> = ({
  caption,
  hashtags,
  onHashtagsInsert,
  onRemoveHashtag,
  onAddHashtag,
}) => {
  const hashtagInputRef = useRef<HTMLInputElement>(null);

  const handleAddHashSymbol = useCallback(() => {
    if (hashtagInputRef.current) {
      const value = hashtagInputRef.current.value.trim();
      if (value && !value.startsWith("#")) {
        hashtagInputRef.current.value = `#${value}`;
      }
      hashtagInputRef.current.focus();
    }
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
          Hashtags
        </h2>
        <HashtagSuggester
          caption={caption}
          onInsertHashtags={onHashtagsInsert}
        />
      </div>
      <div className="mt-2 flex items-center justify-center gap-2">
        <input
          ref={hashtagInputRef}
          type="text"
          placeholder="Type a hashtag (no spaces) and press Enter"
          onKeyDown={onAddHashtag}
          className="block w-full rounded-md border border-gray-300 p-2 shadow-sm outline-none focus:border-primary focus:ring-primary dark:border-gray-600 dark:bg-gray-800 dark:text-white"
        />
        <button
          type="button"
          onClick={handleAddHashSymbol}
          className="rounded-md bg-gray-200 px-3 py-2 text-gray-700 hover:bg-gray-300 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
          title="Add #"
        >
          #
        </button>
      </div>
      <div className="mt-2 flex flex-wrap gap-2">
        {hashtags.map((hashtag, index) => (
          <span
            key={index}
            className="flex items-center gap-2 rounded-full bg-gray-200 px-3 py-1 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
          >
            {hashtag}
            <button
              type="button"
              onClick={() => onRemoveHashtag(index)}
              className="text-red-500 hover:text-red-700"
              title="Remove"
            >
              ✕
            </button>
          </span>
        ))}
      </div>
    </div>
  );
};
