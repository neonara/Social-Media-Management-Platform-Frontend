"use client";

import { SocialPage, SocialPlatform } from "@/types/social-page";
import React from "react";
import { getPlatformIconWithSize } from "../../platformIcons";

interface PlatformsSectionProps {
  selectedPlatforms: string[];
  clientPages: SocialPage[];
  loadingPages: boolean;
  onPlatformToggle: (platform: string) => void;
}

export const PlatformsSection: React.FC<PlatformsSectionProps> = ({
  selectedPlatforms,
  clientPages,
  loadingPages,
  onPlatformToggle,
}) => {
  const platforms = ["facebook", "instagram", "linkedin"];

  const getPageName = (platform: string): string => {
    const page = clientPages.find((p) => p.platform === platform);
    return page ? page.page_name : "Not connected";
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
          Platforms
        </h3>
        {selectedPlatforms.length === 0 && (
          <div className="rounded-lg bg-yellow-50 p-3 py-2 dark:bg-yellow-900/20">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              ⚠️ Select at least one platform to continue
            </p>
          </div>
        )}
      </div>

      {loadingPages && (
        <div className="py-4 text-center">
          <p className="text-gray-500 dark:text-gray-400">
            Loading platforms...
          </p>
        </div>
      )}

      <div className="flex gap-3">
        {platforms.map((platform) => {
          const isSelected = selectedPlatforms.includes(platform);
          const isAvailable = clientPages.some((p) => p.platform === platform);
          const pageName = getPageName(platform);

          return (
            <button
              key={platform}
              onClick={() => onPlatformToggle(platform)}
              disabled={!isAvailable && !isSelected}
              className={`flex items-center justify-between rounded-lg border-2 p-2 transition-all ${
                isSelected
                  ? "border-blue-500 bg-blue-50 dark:bg-blue-900/30"
                  : isAvailable
                    ? "border-gray-200 bg-white hover:border-blue-300 dark:border-gray-700 dark:bg-gray-800"
                    : "cursor-not-allowed border-gray-200 bg-gray-50 opacity-50 dark:border-gray-700 dark:bg-gray-800"
              }`}
            >
              <div className="flex items-center gap-2">
                {getPlatformIconWithSize(
                  platform as SocialPlatform,
                  "h-10 w-10",
                )}
                <div className="text-left">
                  <p className="font-medium capitalize text-gray-800 dark:text-white">
                    {platform}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {pageName}
                  </p>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
