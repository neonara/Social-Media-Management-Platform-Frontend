/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import { getPostById, updatePost } from "@/services/postService";
import { ShowcaseSection } from "@/components/Layouts/showcase-section";
import { SimpleWysiwyg } from "@/components/SimpleWysiwyg";
import { DndContext, useDraggable, closestCenter } from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useRouter } from "next/navigation";
import { FaFacebook, FaInstagram, FaLinkedin } from "react-icons/fa";
import { toast } from "react-hot-toast";
import { formatDistanceToNow } from "date-fns";
import DOMPurify from "dompurify";
import Image from "next/image";

interface MediaFile {
  id?: number;
  preview: string;
  file?: File;
  name?: string;
}

interface EditPostFormProps {
  postId: string;
}

//previews
const FacebookPostPreview = ({
  content,
  media,
}: {
  content: string;
  media?: string[];
}) => {
  const timeAgo = formatDistanceToNow(new Date(), { addSuffix: true });
  return (
    <div className="max-w-[500px] rounded-lg bg-white p-4 shadow-md">
      <div className="mb-2 flex items-center gap-3">
        <FaFacebook className="h-8 w-8 text-blue-600" />
        <div>
          <div className="font-semibold text-gray-800">Facebook User</div>
          <div className="text-xs text-gray-500">{timeAgo}</div>
        </div>
      </div>
      <div
        className="mb-2 whitespace-pre-wrap break-words text-gray-800"
        dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(content) }}
      />
      {media && media.length > 0 && (
        <div className="mt-2 overflow-hidden rounded-md">
          {media.length === 1 ? (
            media[0].startsWith("data:video") ||
            media[0].endsWith(".mp4") ||
            media[0].endsWith(".mov") ? (
              <video controls className="max-h-[500px] w-full object-contain">
                <source src={media[0]} type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            ) : (
              <Image
                src={media[0]}
                alt="Post Media"
                className="max-h-[500px] w-full object-contain"
                width={500}
                height={500}
              />
            )
          ) : (
            <div
              className={`grid gap-0.5 ${media.length === 2 ? "grid-cols-2" : media.length === 3 ? "grid-cols-2" : "grid-cols-2"}`}
            >
              {media.slice(0, 4).map((item, index) => (
                <div key={index} className="relative aspect-square">
                  {item.startsWith("data:video") ||
                  item.endsWith(".mp4") ||
                  item.endsWith(".mov") ? (
                    <video controls className="h-full w-full object-cover">
                      <source src={item} type="video/mp4" />
                    </video>
                  ) : (
                    <Image
                      src={item}
                      alt={`Media ${index + 1}`}
                      className="h-full w-full object-cover"
                      width={500}
                      height={500}
                    />
                  )}
                  {index === 3 && media.length > 4 && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 text-2xl font-bold text-white">
                      +{media.length - 4}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      <div className="mt-2 flex gap-4 text-sm text-gray-600">
        <span>Like</span>
        <span>Comment</span>
        <span>Share</span>
      </div>
    </div>
  );
};

const InstagramPostPreview = ({
  content,
  media,
}: {
  content: string;
  media?: string[];
}) => {
  const timeAgo = formatDistanceToNow(new Date(), { addSuffix: true });
  return (
    <div className="max-w-[470px] rounded-lg bg-white shadow-md">
      <div className="flex items-center justify-between p-3">
        <div className="flex items-center gap-3">
          <FaInstagram className="h-8 w-8 text-pink-500" />
          <div className="font-semibold text-gray-800">Instagram User</div>
        </div>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-6 w-6 text-gray-600"
        >
          <circle cx="12" cy="12" r="1.5"></circle>
          <circle cx="6" cy="12" r="1.5"></circle>
          <circle cx="18" cy="12" r="1.5"></circle>
        </svg>
      </div>
      <div className="rounded-md border border-gray-300">
        {media && media.length > 0 ? (
          <div className="relative">
            {media.length === 1 ? (
              media[0].startsWith("data:video") ||
              media[0].endsWith(".mp4") ||
              media[0].endsWith(".mov") ? (
                <video controls className="aspect-square w-full object-cover">
                  <source src={media[0]} type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
              ) : (
                <Image
                  src={media[0]}
                  alt="Post Media"
                  className="aspect-square w-full object-cover"
                  width={500}
                  height={500}
                />
              )
            ) : (
              <div className="relative aspect-square overflow-hidden">
                {media[0].startsWith("data:video") ||
                media[0].endsWith(".mp4") ||
                media[0].endsWith(".mov") ? (
                  <video controls className="h-full w-full object-cover">
                    <source src={media[0]} type="video/mp4" />
                  </video>
                ) : (
                  <Image
                    src={media[0]}
                    alt="Post Media"
                    className="h-full w-full object-cover"
                    width={500}
                    height={500}
                  />
                )}
                <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-1">
                  {media.map((_, index) => (
                    <div
                      key={index}
                      className={`h-2 w-2 rounded-full ${index === 0 ? "bg-blue-500" : "bg-gray-300"}`}
                    ></div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex aspect-square items-center justify-center rounded-t-md bg-gray-200 text-gray-400">
            Image/Video Placeholder
          </div>
        )}
        <div className="p-3">
          <div className="mb-1 flex items-center gap-2">
            <FaInstagram className="h-5 w-5 text-pink-500" />
            <span className="font-semibold text-gray-800">Instagram User</span>
            <span className="ml-1 text-xs text-gray-500">{timeAgo}</span>
          </div>
          <div
            className="whitespace-pre-wrap break-words text-gray-800"
            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(content) }}
          />
          <div className="mt-2 text-sm text-gray-600">
            <span>Like</span>
            <span>Comment</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const LinkedinPostPreview = ({
  content,
  media,
}: {
  content: string;
  media?: string[];
}) => {
  const timeAgo = formatDistanceToNow(new Date(), { addSuffix: true });
  return (
    <div className="max-w-[550px] rounded-lg bg-white p-4 shadow-md">
      <div className="mb-2 flex items-center gap-3">
        <FaLinkedin className="h-8 w-8 text-blue-700" />
        <div>
          <div className="font-semibold text-gray-800">LinkedIn User</div>
          <div className="text-xs text-gray-500">{timeAgo}</div>
        </div>
      </div>
      <div
        className="mb-2 whitespace-pre-wrap break-words text-gray-800"
        dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(content) }}
      />
      {media && media.length > 0 && (
        <div className="mt-2 overflow-hidden rounded-md border border-gray-200">
          {media.length === 1 ? (
            media[0].startsWith("data:video") ||
            media[0].endsWith(".mp4") ||
            media[0].endsWith(".mov") ? (
              <video controls className="max-h-[500px] w-full object-contain">
                <source src={media[0]} type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            ) : (
              <Image
                src={media[0]}
                alt="Post Media"
                className="max-h-[500px] w-full object-contain"
                width={500}
                height={500}
              />
            )
          ) : (
            <div
              className={`grid gap-0.5 ${media.length === 2 ? "grid-cols-2" : "grid-cols-2"}`}
            >
              {media.slice(0, 4).map((item, index) => (
                <div key={index} className="relative aspect-square">
                  {item.startsWith("data:video") ||
                  item.endsWith(".mp4") ||
                  item.endsWith(".mov") ? (
                    <video controls className="h-full w-full object-cover">
                      <source src={item} type="video/mp4" />
                    </video>
                  ) : (
                    <Image
                      src={item}
                      alt={`Media ${index + 1}`}
                      className="h-full w-full object-cover"
                      width={500}
                      height={500}
                    />
                  )}
                  {index === 3 && media.length > 4 && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 text-2xl font-bold text-white">
                      +{media.length - 4}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      <div className="mt-2 flex gap-4 text-sm text-gray-600">
        <span>Like</span>
        <span>Comment</span>
        <span>Share</span>
      </div>
    </div>
  );
};

const EditPostForm = ({ postId }: EditPostFormProps) => {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const hashtagInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    title: "",
    caption: "",
    scheduledTime: "",
    selectedPlatforms: [] as string[],
    hashtags: [] as string[],
    mediaFiles: [] as MediaFile[],
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [isDrafting, setIsDrafting] = useState(false);

  // Platform icons
  const platformIcons = {
    facebook: <FaFacebook className="text-blue-600" />,
    instagram: <FaInstagram className="text-pink-500" />,
    linkedin: <FaLinkedin className="text-blue-700" />,
  };

  // Fetch post data
  useEffect(() => {
    const fetchPostData = async () => {
      try {
        setLoading(true);
        const post = await getPostById(parseInt(postId));

        if (!post) {
          setError("Post not found");
          return;
        }

        let formattedHashtags: string[] = [];
        if (post.hashtags && typeof post.hashtags === "string") {
          formattedHashtags = (post.hashtags as string).split(",");
        } else if (Array.isArray(post.hashtags)) {
          formattedHashtags = post.hashtags;
        }

        setFormData({
          title: post.title,
          caption: post.description || "",
          scheduledTime: post.scheduled_for || "",
          selectedPlatforms: post.platforms || [],
          hashtags: formattedHashtags,
          mediaFiles:
            post.media?.map((media) => ({
              id: media.id,
              preview: media.file,
              name: media.name,
            })) || [],
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load post");
      } finally {
        setLoading(false);
      }
    };

    fetchPostData();
  }, [postId]);

  const handleAddHashtag = useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (event.key === "Enter" && hashtagInputRef.current) {
        event.preventDefault();
        const input = event.currentTarget.value.trim().replace(/\s+/g, "_");
        if (input) {
          const formattedHashtag = input.startsWith("#") ? input : `#${input}`;
          setFormData((prev) => ({
            ...prev,
            caption: `${prev.caption}\n${formattedHashtag}`,
          }));
          event.currentTarget.value = "";
        }
      }
    },
    [],
  );

  const handleRemoveHashtag = useCallback((index: number) => {
    setFormData((prev) => ({
      ...prev,
      hashtags: prev.hashtags.filter((_, i) => i !== index),
    }));
  }, []);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files) return;

      const newMediaFiles: MediaFile[] = [];

      Array.from(files).forEach((file) => {
        const reader = new FileReader();
        reader.onload = (event) => {
          if (event.target?.result) {
            newMediaFiles.push({
              preview: event.target.result as string,
              file,
              name: file.name,
            });

            if (newMediaFiles.length === files.length) {
              setFormData((prev) => ({
                ...prev,
                mediaFiles: [...prev.mediaFiles, ...newMediaFiles],
              }));
            }
          }
        };
        reader.readAsDataURL(file);
      });
    },
    [],
  );

  const handleRemoveMedia = useCallback((indexToRemove: number) => {
    setFormData((prev) => ({
      ...prev,
      mediaFiles: prev.mediaFiles.filter((_, index) => index !== indexToRemove),
    }));
  }, []);

  const handleDragEnd = useCallback(
    (event: any) => {
      const { active, over } = event;

      // Ignore if dropped outside the list
      if (!over) return;

      const oldIndex = Number(active.id);
      const newIndex = Number(over.id);

      // Ignore if dropped in the same position
      if (oldIndex === newIndex) return;

      setFormData((prev) => ({
        ...prev,
        mediaFiles: arrayMove(prev.mediaFiles, oldIndex, newIndex),
      }));
    },
    [setFormData],
  );

  const handleUpdate = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    // Validation
    if (!formData.title) {
      setError("Please enter a title");
      return;
    }

    if (!formData.selectedPlatforms.length) {
      setError("Please select at least one platform");
      return;
    }

    if (
      formData.selectedPlatforms.includes("instagram") &&
      formData.mediaFiles.length === 0
    ) {
      setError("Instagram posts must include at least one media file.");
      return;
    }

    if (!formData.scheduledTime) {
      setError("Please select a scheduled time");
      return;
    }

    try {
      setUploadProgress(0);
      const formDataToSend = new FormData();

      // Append all basic fields
      formDataToSend.append("title", formData.title);
      formDataToSend.append("description", formData.caption);

      // Convert platforms array to JSON string as required by the backend
      formDataToSend.append(
        "platforms",
        JSON.stringify(formData.selectedPlatforms),
      );

      formDataToSend.append("status", "scheduled");

      // Format the date properly with seconds and timezone (Z for UTC)
      let formattedDate = "";
      if (formData.scheduledTime) {
        try {
          // Ensure the date has seconds and timezone
          const date = new Date(formData.scheduledTime);
          formattedDate = date.toISOString();

          // Verify the date is valid and in the expected format
          if (isNaN(date.getTime())) {
            throw new Error("Invalid date");
          }
        } catch (err) {
          console.error("Date conversion error:", err);
          // Fallback format: add seconds and timezone if missing
          formattedDate = formData.scheduledTime.replace(
            /T(\d{2}):(\d{2})$/,
            "T$1:$2:00Z",
          );
        }
      }

      // Log the formatted date for debugging
      console.log("Formatted ISO date:", formattedDate);

      formDataToSend.append("scheduled_for", formattedDate);

      // Append existing media IDs
      formData.mediaFiles.forEach((media) => {
        if (media.id) {
          formDataToSend.append("existing_media", media.id.toString());
        }
      });

      // Add this to ensure backend knows we're changing from draft to scheduled
      formData.mediaFiles.forEach((media) => {
        if (media.file) {
          formDataToSend.append("media_files", media.file);
        }
      });

      const response = await updatePost(parseInt(postId), formDataToSend);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update post status");
      }

      setUploadSuccess(true);
      toast.success("Post scheduled successfully!");
      router.push("/posts");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to schedule post");
      toast.error("Failed to schedule post");
    } finally {
      setUploadProgress(null);
    }
  };

  const handleSaveAsDraft = useCallback(async () => {
    setIsDrafting(true);
    setError(null);

    try {
      const formDataToSend = new FormData();

      // Append all basic fields
      formDataToSend.append("title", formData.title);
      formDataToSend.append("description", formData.caption);

      // Convert platforms array to JSON string as required by the backend
      formDataToSend.append(
        "platforms",
        JSON.stringify(formData.selectedPlatforms),
      );

      formDataToSend.append("status", "draft"); // Set status to "draft"
      // Format the date properly if it exists
      const formattedDate = formData.scheduledTime
        ? new Date(formData.scheduledTime).toISOString()
        : "";
      formDataToSend.append("scheduled_for", formattedDate);

      // Append existing media IDs
      formData.mediaFiles.forEach((media) => {
        if (media.id) {
          formDataToSend.append("existing_media", media.id.toString());
        }
      });

      // Append new media files
      formData.mediaFiles.forEach((media) => {
        if (media.file) {
          formDataToSend.append("media_files", media.file);
        }
      });

      // Call the updatePost API for saving as draft
      const response = await updatePost(parseInt(postId), formDataToSend);

      if (response.ok) {
        toast.success("Draft saved successfully!");
        setUploadSuccess(true);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to save draft");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save draft");
      toast.error("Failed to save draft");
    } finally {
      setIsDrafting(false);
    }
  }, [formData, postId]);

  const handleAddHashSymbol = useCallback(() => {
    if (hashtagInputRef.current) {
      const value = hashtagInputRef.current.value.trim();
      if (value && !value.startsWith("#")) {
        hashtagInputRef.current.value = `#${value}`;
      }
      hashtagInputRef.current.focus();
    }
  }, []);

  const togglePlatform = useCallback((platform: string) => {
    setFormData((prev) => ({
      ...prev,
      selectedPlatforms: prev.selectedPlatforms.includes(platform)
        ? prev.selectedPlatforms.filter((p) => p !== platform)
        : [...prev.selectedPlatforms, platform],
    }));
  }, []);

  const renderPreview = () => {
    if (
      formData.selectedPlatforms.length === 0 &&
      formData.caption.trim() === ""
    ) {
      return (
        <div className="py-4 text-center text-gray-400">
          Select a platform to preview your post.
        </div>
      );
    }

    return formData.selectedPlatforms.map((platform) => {
      const mediaArray =
        formData.mediaFiles.length > 0
          ? formData.mediaFiles.map((file) => file.preview)
          : undefined;

      switch (platform) {
        case "facebook":
          return (
            <FacebookPostPreview
              key="facebook"
              content={formData.caption}
              media={mediaArray}
            />
          );
        case "instagram":
          return (
            <InstagramPostPreview
              key="instagram"
              content={formData.caption}
              media={mediaArray}
            />
          );
        case "linkedin":
          return (
            <LinkedinPostPreview
              key="linkedin"
              content={formData.caption}
              media={mediaArray}
            />
          );
        default:
          return null;
      }
    });
  };

  if (loading)
    return (
      <div className="flex justify-center p-8">
        <p>Loading...</p>
      </div>
    );
  if (error) return <div className="p-4 text-red-500">{error}</div>;

  return (
    <ShowcaseSection title="Edit Post" className="!p-7">
      <div className="flex flex-col lg:flex-row lg:items-start lg:gap-8">
        {/* Form Section */}
        <div className="flex-1 space-y-8">
          {uploadProgress !== null && (
            <div className="mb-4">
              <div className="h-2 rounded-full bg-gray-200">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
              <p className="mt-1 text-sm text-gray-600">
                Uploading: {uploadProgress}%
              </p>
            </div>
          )}

          <form onSubmit={handleUpdate} className="space-y-8">
            {/* Post Details */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
                Post Details
              </h2>
              <div>
                <label
                  htmlFor="title"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-200"
                >
                  Title
                </label>
                <input
                  type="text"
                  id="title"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, title: e.target.value }))
                  }
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                  required
                />
              </div>
              <div>
                <label
                  htmlFor="description"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-200"
                >
                  Caption
                </label>
                <SimpleWysiwyg
                  value={formData.caption}
                  onChange={(value) =>
                    setFormData((prev) => ({ ...prev, caption: value }))
                  }
                  placeholder="Write your post content here..."
                />
              </div>
            </div>

            {/* Hashtags */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
                Hashtags
              </h2>
              <div className="flex items-center gap-2">
                <input
                  ref={hashtagInputRef}
                  type="text"
                  placeholder="Type a hashtag (no spaces) and press Enter"
                  onKeyDown={handleAddHashtag}
                  className="mt-2 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary dark:border-gray-600 dark:bg-gray-800 dark:text-white"
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
                {formData.hashtags.map((hashtag, index) => (
                  <span
                    key={index}
                    className="flex items-center gap-2 rounded-full bg-gray-200 px-3 py-1 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                  >
                    {hashtag}
                    <button
                      type="button"
                      onClick={() => handleRemoveHashtag(index)}
                      className="text-red-500 hover:text-red-700"
                      title="Remove"
                    >
                      ✕
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Scheduled Time */}
            <div className="space-y-4">
              <label
                htmlFor="scheduled_at"
                className="text-lg font-semibold text-gray-800 dark:text-white"
              >
                Scheduled At
              </label>
              <input
                type="datetime-local"
                id="scheduled_at"
                name="scheduled_at"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                value={formData.scheduledTime}
                onChange={(e) => {
                  const selectedTime = new Date(e.target.value).getTime();
                  const currentTime = new Date().getTime();

                  if (selectedTime < currentTime) {
                    setError("The selected time cannot be in the past.");
                  } else {
                    setFormData((prev) => ({
                      ...prev,
                      scheduledTime: e.target.value,
                    }));
                    setError(null); // Clear the error if the time is valid
                  }
                }}
                min={new Date().toISOString().slice(0, 16)} // Set the minimum date and time
              />
              {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
            </div>

            {/* Platforms */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
                Platforms
              </h2>
              <div className="mt-4 flex space-x-4">
                {["facebook", "instagram", "linkedin"].map((platform) => (
                  <button
                    key={platform}
                    type="button"
                    onClick={() => togglePlatform(platform)}
                    className={`flex items-center justify-center rounded-md border px-4 py-2 ${
                      formData.selectedPlatforms.includes(platform)
                        ? "border-primary bg-primary text-white"
                        : "bg-gray-200 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                    }`}
                  >
                    {platformIcons[platform as keyof typeof platformIcons]}
                    <span className="ml-2 capitalize">{platform}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Media */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
                Media
              </h2>
              <DndContext
                onDragEnd={handleDragEnd}
                collisionDetection={closestCenter}
              >
                <SortableContext
                  items={formData.mediaFiles.map((_, index) =>
                    index.toString(),
                  )}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                    {formData.mediaFiles.map((media, index) => (
                      <div key={media.id || index} className="relative">
                        <DraggableItem
                          media={media}
                          index={index}
                          handleRemoveMedia={handleRemoveMedia}
                        />
                      </div>
                    ))}
                  </div>
                </SortableContext>
              </DndContext>

              {/* Buttons for Adding Media */}
              <div className="flex gap-4">
                {/* Add Photos Button */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center justify-center rounded-md bg-gray-200 px-4 py-2 text-gray-700 hover:bg-gray-300 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                  title="Add Photos"
                >
                  Add Photos
                </button>
                <input
                  ref={fileInputRef}
                  id="photos"
                  name="photos"
                  type="file"
                  className="sr-only"
                  multiple
                  accept="image/*"
                  onChange={handleFileChange}
                />

                {/* Add Videos Button */}
                <button
                  type="button"
                  onClick={() => videoInputRef.current?.click()}
                  className="flex items-center justify-center rounded-md bg-gray-200 px-4 py-2 text-gray-700 hover:bg-gray-300 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                  title="Add Videos"
                >
                  Add Videos
                </button>
                <input
                  ref={videoInputRef}
                  id="videos"
                  name="videos"
                  type="file"
                  className="sr-only"
                  multiple
                  accept="video/*"
                  onChange={handleFileChange}
                />
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="rounded-md bg-red-50 p-4 dark:bg-red-900 dark:bg-opacity-20">
                <p className="text-sm text-red-700 dark:text-red-300">
                  {error}
                </p>
              </div>
            )}

            {/* Buttons */}
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                className="rounded-md border border-gray-300 bg-gray-500 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50"
                onClick={handleSaveAsDraft}
                disabled={uploadProgress !== null}
              >
                {uploadProgress !== null && isDrafting
                  ? "Saving..."
                  : "Save as Draft"}
              </button>

              <button
                type="submit"
                className="hover:bg-primary-dark rounded-md border border-transparent bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50"
                disabled={uploadProgress !== null}
              >
                {uploadProgress !== null && !isDrafting
                  ? "Updating..."
                  : "Update Post"}
              </button>
            </div>
          </form>
        </div>

        {/* Preview Section */}
        <div className="w-full space-y-4 lg:w-1/3">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
            Post Preview
          </h2>
          <div className="space-y-4">{renderPreview()}</div>
        </div>
      </div>

      {uploadSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-96 rounded-lg bg-white p-6 shadow-lg">
            <h2 className="text-lg font-semibold text-gray-800">Success</h2>
            <p className="mt-2 text-sm text-gray-600">
              {isDrafting
                ? "Draft saved successfully!"
                : "Post updated successfully!"}
            </p>
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => {
                  setUploadSuccess(false);
                  if (!isDrafting) {
                    router.push("/posts");
                  }
                }}
                className="hover:bg-primary-dark rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </ShowcaseSection>
  );
};

const DraggableItem = ({
  media,
  index,
  handleRemoveMedia,
}: {
  media: MediaFile;
  index: number;
  handleRemoveMedia: (index: number) => void;
}) => {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: media.id?.toString() || index.toString(),
  });

  const style = {
    transform: transform
      ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
      : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="relative h-40 w-40 overflow-hidden rounded-lg border border-gray-300 bg-white shadow-md dark:bg-gray-800"
    >
      {media.preview.startsWith("data:video") ||
      /\.(mp4|mov)$/i.test(media.preview) ? (
        <video controls preload="auto" className="h-full w-full object-cover">
          <source src={media.preview} type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      ) : (
        <Image
          src={media.preview}
          alt={`Preview ${index}`}
          className="h-full w-full object-cover"
          width={500}
          height={500}
        />
      )}
      <button
        type="button"
        onClick={() => handleRemoveMedia(index)}
        className="absolute right-2 top-2 rounded-full bg-red-500 p-1 text-white shadow hover:bg-red-600 focus:outline-none"
        title="Remove"
      >
        ✕
      </button>
    </div>
  );
};

export default EditPostForm;
