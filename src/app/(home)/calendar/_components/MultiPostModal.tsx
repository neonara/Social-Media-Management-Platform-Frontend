"use client";

import React from "react";
import { format } from "date-fns";
import {
  FacebookSVG,
  InstagramSVG,
  LinkedinSVG,
} from "@/components/platformIcons";
import { useRouter } from "next/navigation";
import { ScheduledPost } from "@/types/post";

type Props = {
  visible: boolean;
  day: Date | null;
  posts: ScheduledPost[];
  onClose: () => void;
  onPick: (post: ScheduledPost) => void;
};

const MultiPostModal: React.FC<Props> = ({
  visible,
  day,
  posts,
  onClose,
  onPick,
}) => {
  const router = useRouter();

  if (!visible || !day) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="w-full max-w-2xl rounded-lg bg-white shadow-xl transition-all dark:bg-gray-dark">
        <div className="flex items-center justify-between border-b border-gray-300 p-4 dark:border-dark-3">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
            Posts for {format(day, "MMMM d, yyyy")} ({posts.length} posts)
          </h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-gray-100"
          >
            ✕
          </button>
        </div>

        <div className="max-h-96 space-y-3 overflow-y-auto p-6">
          {posts.map((post) => (
            <div
              key={post.id}
              onClick={() => {
                onPick(post);
              }}
              className="cursor-pointer rounded-lg border border-gray-200 p-4 transition-all hover:bg-gray-50 hover:shadow-md dark:border-dark-3 dark:hover:bg-dark-2"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900 dark:text-white">
                    {post.title || "Untitled Post"}
                  </h4>
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                    {post.description.length > 100
                      ? post.description.substring(0, 100) + "..."
                      : post.description}
                  </p>
                  <div className="mt-2 flex items-center gap-3">
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {format(new Date(post.scheduled_for), "h:mm a")}
                    </span>
                    <span
                      className={`rounded-full px-2 py-1 text-xs font-medium ${
                        post.status === "published"
                          ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                          : post.status === "scheduled"
                            ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                            : post.status === "pending"
                              ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                              : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                      }`}
                    >
                      {post.status}
                    </span>
                    <span
                      className={`flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${
                        post.platform === "Facebook"
                          ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                          : post.platform === "Instagram"
                            ? "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200"
                            : "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
                      }`}
                    >
                      {post.platform === "Facebook" && (
                        <FacebookSVG className="h-3 w-3" />
                      )}
                      {post.platform === "Instagram" && (
                        <InstagramSVG className="h-3 w-3" />
                      )}
                      {post.platform === "LinkedIn" && (
                        <LinkedinSVG className="h-3 w-3" />
                      )}
                      {post.platform}
                    </span>
                  </div>
                </div>
                <div className="ml-4 flex flex-col gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/editPost/${post.id}`);
                    }}
                    className="hover:bg-primary-dark rounded-md bg-primary px-3 py-1 text-xs font-medium text-white shadow-sm focus:outline-none"
                  >
                    Edit
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-end border-t border-gray-300 p-4 dark:border-dark-3">
          <button
            onClick={onClose}
            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 dark:border-dark-3 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-dark-2"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default MultiPostModal;
