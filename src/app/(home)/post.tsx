"use client";

import { ShowcaseSection } from "@/components/Layouts/showcase-section";
import React, { useRef, useState } from "react";



const FacebookIcon = () => <span className="text-blue-500 text-sm mr-1">f</span>;
const InstagramIcon = () => <span className="text-pink-500 text-sm mr-1">📸</span>;

interface Platform {
  id: string;
  name: string;
  icon: React.ComponentType;
}

const platforms: Platform[] = [
  { id: "facebook", name: "Facebook", icon: FacebookIcon },
  { id: "instagram", name: "Instagram", icon: InstagramIcon },
  // Add more platforms here
];

export function PostForm() {
  const captionRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);

  const handleInsertHashtag = () => {
    if (captionRef.current) {
      const currentCursorPosition = captionRef.current.selectionStart;
      const newCaption =
        captionRef.current.value.substring(0, currentCursorPosition) +
        "#" +
        captionRef.current.value.substring(currentCursorPosition);
      captionRef.current.value = newCaption;
      captionRef.current.selectionStart = currentCursorPosition + 1;
      captionRef.current.selectionEnd = currentCursorPosition + 1;
      captionRef.current.focus();
    }
  };
  const handleInsertTag = () => {
    if (captionRef.current) {
      const currentCursorPosition = captionRef.current.selectionStart;
      const newCaption =
        captionRef.current.value.substring(0, currentCursorPosition) +
        "@" +
        captionRef.current.value.substring(currentCursorPosition);
      captionRef.current.value = newCaption;
      captionRef.current.selectionStart = currentCursorPosition + 1;
      captionRef.current.selectionEnd = currentCursorPosition + 1;
      captionRef.current.focus();
    }
  };

  const handleChooseFileClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      console.log("Selected files:", e.target.files);
      // Handle file upload logic here
    }
  };

  const handlePlatformSelect = (platformId: string) => {
    if (selectedPlatforms.includes(platformId)) {
      setSelectedPlatforms((prev) => prev.filter((id) => id !== platformId));
    } else {
      setSelectedPlatforms((prev) => [...prev, platformId]);
    }
  };

  return (
    <ShowcaseSection title="Create Post" className="!p-7">
      
      <form onSubmit={() => {}}>
        <div className="mb-5.5">
          <label htmlFor="description" className="mb-2 block text-sm font-medium text-gray-800 dark:text-white">
            Caption
          </label>
          <div className="flex items-center space-x-2">
            <textarea
              ref={captionRef}
              id="description"
              name="description"
              placeholder="Enter post description"
              rows={4}
              className="w-full rounded-md border border-gray-300 px-4 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:border-dark-3 dark:bg-dark-2 dark:text-white"
              required
            />
            <button
              type="button"
              onClick={handleInsertHashtag}
              className="rounded-md bg-gray-200 text-gray-700 px-2 py-1 text-sm font-semibold hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-primary dark:bg-dark-3 dark:text-white dark:hover:bg-dark-2"
            >
              #
            </button>
            <button
              type="button"
              onClick={handleInsertTag}
              className="rounded-md bg-gray-200 text-gray-700 px-2 py-1 text-sm font-semibold hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-primary dark:bg-dark-3 dark:text-white dark:hover:bg-dark-2"
            >
              @
            </button>
          </div>
        </div>

        <div className="mb-5.5">
          <label className="block text-sm font-medium text-gray-700 dark:text-white">Share to</label>
          <div className="mt-2 flex space-x-2">
            {platforms.map((platform) => (
              <button
                key={platform.id}
                type="button"
                onClick={() => handlePlatformSelect(platform.id)}
                className={`rounded-md border border-gray-300 px-3 py-2 flex items-center text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer ${
                  selectedPlatforms.includes(platform.id)
                    ? "bg-primary text-gray-2" // Style for selected button
                    : "bg-white text-gray-700 dark:bg-dark-2 dark:text-white" // Style for unselected button
                }`}
              >
                <platform.icon />
                {platform.name}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-5.5">
          <label htmlFor="scheduled_for" className="mb-2 block text-sm font-medium text-gray-700 dark:text-white">
            Schedule For
          </label>
          <input
            type="datetime-local"
            id="scheduled_for"
            name="scheduled_for"
            className="w-full rounded-md border border-gray-300 px-4 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:border-dark-3 dark:bg-dark-2 dark:text-white"
          />
        </div>

        <div className="mb-5.5">
          <label htmlFor="media" className="mb-2 block text-sm font-medium text-gray-700 dark:text-white">
            Media
          </label>
          <div
            className="relative flex items-center justify-center w-32 h-32 border-2 border-dashed border-gray-400 rounded-md cursor-pointer bg-gray-100 dark:bg-dark-2 dark:border-dark-3"
            onClick={handleChooseFileClick}
          >
            <span className="text-3xl text-gray-500 dark:text-gray-400">+</span>
            <span className="absolute top-0 left-0 w-full h-full opacity-0">
              <input
                type="file"
                id="media"
                name="media"
                multiple
                className="w-full h-full cursor-pointer"
                onChange={handleFileChange}
                ref={fileInputRef}
              />
            </span>
          </div>
          {/* Display selected files here if needed */}
        </div>

        <div className="flex justify-end gap-3">
          <button
            type="button"
            className="rounded-lg border border-stroke px-6 py-[7px] font-medium text-dark hover:shadow-1 dark:border-dark-3 dark:text-white"
          >
            Cancel
          </button>

          <button
            type="submit"
            className="rounded-lg bg-primary px-6 py-[7px] font-medium text-gray-2 hover:bg-opacity-90"
          >
            Create Post
          </button>
        </div>
      </form>
    </ShowcaseSection>
  );
}