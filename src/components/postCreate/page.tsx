"use client";

import React, { useRef, useState, useCallback, useEffect } from "react";
import {
  createPost,
  saveDraft,
  getAssignedClients,
} from "@/services/postService";
import { ShowcaseSection } from "@/components/Layouts/showcase-section";
import { SimpleWysiwyg } from "@/components/SimpleWysiwyg";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from "react-beautiful-dnd";
import {
  FaFacebook as Facebook,
  FaInstagram as Instagram,
  FaLinkedin as Linkedin,
} from "react-icons/fa";
import { toast } from "react-hot-toast";
import { useSearchParams } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import DOMPurify from "dompurify";
import { getClientPages } from "@/services/socialMedia";
import { SocialPage } from "@/types/social-page";

interface MediaFile {
  id: string;
  preview: string;
  file?: File;
  name?: string;
}

interface Client {
  id: string;
  name: string;
  email: string;
}

// Preview Components
const FacebookPostPreview = ({
  content,
  media,
  pageName = "Facebook User",
}: {
  content: string;
  media?: string[];
  pageName?: string;
}) => {
  const timeAgo = formatDistanceToNow(new Date(), { addSuffix: true });
  return (
    <div className="max-w-[500px] rounded-lg bg-white p-4 shadow-md">
      <div className="mb-2 flex items-center gap-3">
        <Facebook className="h-8 w-8 text-blue-600" />
        <div>
          <div className="font-semibold text-gray-800">{pageName}</div>
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
              <img
                src={media[0]}
                alt="Post Media"
                className="max-h-[500px] w-full object-contain"
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
                    <img
                      src={item}
                      alt={`Media ${index + 1}`}
                      className="h-full w-full object-cover"
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
  pageName = "Instagram User",
}: {
  content: string;
  media?: string[];
  pageName?: string;
}) => {
  const timeAgo = formatDistanceToNow(new Date(), { addSuffix: true });
  return (
    <div className="max-w-[470px] rounded-lg bg-white shadow-md">
      <div className="flex items-center justify-between p-3">
        <div className="flex items-center gap-3">
          <Instagram className="h-8 w-8 text-pink-500" />
          <div className="font-semibold text-gray-800">{pageName}</div>
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
                <img
                  src={media[0]}
                  alt="Post Media"
                  className="aspect-square w-full object-cover"
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
                  <img
                    src={media[0]}
                    alt="Post Media"
                    className="h-full w-full object-cover"
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
            <Instagram className="h-5 w-5 text-pink-500" />
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
  pageName = "LinkedIn User",
}: {
  content: string;
  media?: string[];
  pageName?: string;
}) => {
  const timeAgo = formatDistanceToNow(new Date(), { addSuffix: true });
  return (
    <div className="max-w-[550px] rounded-lg bg-white p-4 shadow-md">
      <div className="mb-2 flex items-center gap-3">
        <Linkedin className="h-8 w-8 text-blue-700" />
        <div>
          <div className="font-semibold text-gray-800">{pageName}</div>
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
              <img
                src={media[0]}
                alt="Post Media"
                className="max-h-[500px] w-full object-contain"
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
                    <img
                      src={item}
                      alt={`Media ${index + 1}`}
                      className="h-full w-full object-cover"
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

export function PostForm() {
  const searchParams = useSearchParams();
  const clientId = searchParams.get("clientId");

  // Refs
  const titleRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const hashtagInputRef = useRef<HTMLInputElement>(null);

  // State
  const [state, setState] = useState({
    mediaFiles: [] as MediaFile[],
    caption: "",
    selectedPlatforms: [] as string[],
    hashtags: [] as string[],
    scheduledAt: "",
    isLoading: false,
    isDrafting: false,
    error: null as string | null,
    isForClient: !!clientId,
    clientId: clientId || null,
  });

  // State to hold client data
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoadingClients, setIsLoadingClients] = useState(false);

  // Fetch assigned clients on component mount
  useEffect(() => {
    const fetchClients = async () => {
      setIsLoadingClients(true);
      try {
        const response = await getAssignedClients();
        setClients(response);
      } catch (error) {
        console.error("Failed to fetch clients:", error);
        toast.error("Failed to load client list");
      } finally {
        setIsLoadingClients(false);
      }
    };

    if (!clientId) {
      fetchClients();
    }
  }, [clientId]);

  // Set client ID from URL params on mount
  useEffect(() => {
    if (clientId) {
      setState((prev) => ({
        ...prev,
        isForClient: true,
        clientId,
      }));
    }
  }, [clientId]);

  // Platform icons
  const platformIcons = {
    facebook: <Facebook className="size-5 text-blue-600" />,
    instagram: <Instagram className="size-5 text-pink-500" />,
    linkedin: <Linkedin className="size-5 text-blue-700" />,
  };

  // File handling
  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      if (!files.length) return;

      const newMediaFiles = await Promise.all(
        files.map(async (file) => {
          const preview = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target?.result as string);
            reader.readAsDataURL(file);
          });
          return {
            id: URL.createObjectURL(file),
            preview,
            file,
            name: file.name,
          };
        }),
      );

      setState((prev) => ({
        ...prev,
        mediaFiles: [...prev.mediaFiles, ...newMediaFiles],
      }));
    },
    [],
  );

  const handleRemoveMedia = useCallback((indexToRemove: number) => {
    setState((prev) => {
      const removedFile = prev.mediaFiles[indexToRemove];
      URL.revokeObjectURL(removedFile.id); // Revoke URL
      return {
        ...prev,
        mediaFiles: prev.mediaFiles.filter(
          (_, index) => index !== indexToRemove,
        ),
      };
    });
  }, []);
  useEffect(() => {
    return () => {
      // Cleanup all object URLs on component unmount
      state.mediaFiles.forEach((file) => URL.revokeObjectURL(file.id));
    };
  }, [state.mediaFiles]);

  // Drag and drop
  const onDragEnd = useCallback(
    (result: DropResult) => {
      if (!result.destination) return;

      const items = [...state.mediaFiles];
      const [reorderedItem] = items.splice(result.source.index, 1);
      items.splice(result.destination.index, 0, reorderedItem);

      setState((prev) => ({ ...prev, mediaFiles: items }));
    },
    [state.mediaFiles],
  );

  // Hashtag management
  const handleAddHashtag = useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (event.key === "Enter" && hashtagInputRef.current) {
        event.preventDefault();
        const newHashtag = hashtagInputRef.current.value
          .trim()
          .replace(/\s+/g, "_");
        if (newHashtag) {
          const formattedHashtag = newHashtag.startsWith("#")
            ? newHashtag
            : `#${newHashtag}`;
          setState((prev) => ({
            ...prev,
            caption: `${prev.caption}\n${formattedHashtag}`,
          }));
          hashtagInputRef.current.value = "";
        }
      }
    },
    [],
  );

  const handleRemoveHashtag = useCallback((index: number) => {
    setState((prev) => ({
      ...prev,
      hashtags: prev.hashtags.filter((_, i) => i !== index),
    }));
  }, []);

  const handleAddHashSymbol = useCallback(() => {
    if (hashtagInputRef.current) {
      const currentValue = hashtagInputRef.current.value.trim();
      if (!currentValue.startsWith("#")) {
        hashtagInputRef.current.value = `#${currentValue}`;
      }
      hashtagInputRef.current.focus();
    }
  }, []);

  // State to hold client pages
  const [clientPages, setClientPages] = useState<SocialPage[]>([]);
  const [loadingPages, setLoadingPages] = useState(false);

  // Fetch client social media pages
  const fetchClientPages = useCallback(async () => {
    if (!state.clientId) return;

    setLoadingPages(true);
    try {
      const pages = await getClientPages(state.clientId);
      console.log("Client pages fetched:", pages);
      if (Array.isArray(pages)) {
        setClientPages(pages);
      } else if ("error" in pages) {
        console.error("Error fetching pages:", pages.error);
        toast.error("Failed to load client social media pages");
        setClientPages([]);
      }
    } catch (error) {
      console.error("Failed to fetch client pages:", error);
      toast.error("Failed to load client social media pages");
      setClientPages([]);
    } finally {
      setLoadingPages(false);
    }
  }, [state.clientId]);

  useEffect(() => {
    if (state.clientId) {
      fetchClientPages();
    }
  }, [state.clientId, fetchClientPages]);
  console.log("Client pages:", clientPages);

  // Form submission
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const title = titleRef.current?.value.trim();

    // Validation
    if (!title) {
      setState((prev) => ({ ...prev, error: "Please enter a title" }));
      return;
    }

    if (!state.selectedPlatforms.length) {
      setState((prev) => ({
        ...prev,
        error: "Please select at least one platform",
      }));
      return;
    }

    if (
      state.selectedPlatforms.includes("instagram") &&
      state.mediaFiles.length === 0
    ) {
      setState((prev) => ({
        ...prev,
        error: "Instagram posts must include at least one media file.",
      }));
      return;
    }

    if (!state.scheduledAt) {
      setState((prev) => ({
        ...prev,
        error: "Please select a scheduled time",
      }));
      return;
    }

    try {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      // Append hashtags to the caption
      const hashtagsString = state.hashtags.join(" ");
      const updatedCaption = `${state.caption}\n\n${hashtagsString}`;

      const formData = new FormData();
      formData.append("title", title);
      formData.append("description", updatedCaption);

      // Convert platforms array to JSON string as required by the backend
      formData.append("platforms", JSON.stringify(state.selectedPlatforms));

      formData.append("status", "scheduled");

      // Log the input date for debugging
      console.log("Original scheduled date:", state.scheduledAt);

      // Format the date properly with seconds and timezone (Z for UTC)
      let formattedDate = "";
      if (state.scheduledAt) {
        try {
          // Ensure the date has seconds and timezone
          const date = new Date(state.scheduledAt);
          formattedDate = date.toISOString();

          // Verify the date is valid and in the expected format
          if (isNaN(date.getTime())) {
            throw new Error("Invalid date");
          }
        } catch (err) {
          console.error("Date conversion error:", err);
          // Fallback format: add seconds and timezone if missing
          formattedDate = state.scheduledAt.replace(
            /T(\d{2}):(\d{2})$/,
            "T$1:$2:00Z",
          );
        }
      }

      // Log the formatted date to verify it's correct
      console.log("Formatted ISO date:", formattedDate);

      formData.append("scheduled_for", formattedDate);

      // Add client ID if present
      if (state.clientId) {
        formData.append("client_id", state.clientId.toString());
      }

      state.mediaFiles.forEach((media) => {
        if (media.file) {
          formData.append("media_files", media.file);
        }
      });

      console.log("Post create result:", formData.get("platforms"));
      const result = await createPost(formData);

      if (result.success) {
        toast.success(
          state.isForClient
            ? "Post created for client successfully!"
            : "Post created successfully!",
        );
        resetForm();
      } else {
        throw new Error(result.error || "Failed to create post");
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Submission failed";
      setState((prev) => ({ ...prev, error: message }));
      toast.error(message);
    } finally {
      setState((prev) => ({ ...prev, isLoading: false }));
    }
  };

  const resetForm = useCallback(() => {
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (titleRef.current) titleRef.current.value = "";

    setState((prev) => ({
      ...prev,
      mediaFiles: [],
      caption: "",
      selectedPlatforms: [],
      hashtags: [],
      scheduledAt: "",
      isLoading: false,
      isDrafting: false,
      error: null,
      // Keep client ID if it exists
      isForClient: !!prev.clientId,
      clientId: prev.clientId,
    }));
  }, []);

  const handleSaveAsDraft = useCallback(
    async (event: React.MouseEvent) => {
      event.preventDefault();
      const title = titleRef.current?.value.trim();

      // Basic validation
      if (!title) {
        setState((prev) => ({ ...prev, error: "Please enter a title" }));
        return;
      }

      if (!state.selectedPlatforms.length) {
        setState((prev) => ({
          ...prev,
          error: "Please select at least one platform",
        }));
        return;
      }

      if (
        state.selectedPlatforms.includes("instagram") &&
        state.mediaFiles.length === 0
      ) {
        setState((prev) => ({
          ...prev,
          error: "Instagram posts must include at least one media file.",
        }));
        return;
      }

      try {
        setState((prev) => ({ ...prev, isLoading: true, error: null }));

        // Append hashtags to the caption
        const hashtagsString = state.hashtags.join(" ");
        const updatedCaption = `${state.caption}\n\n${hashtagsString}`;

        const formData = new FormData();
        formData.append("title", title);
        formData.append("description", updatedCaption);

        // Convert platforms array to JSON string as required by the backend
        formData.append("platforms", JSON.stringify(state.selectedPlatforms));

        formData.append("status", "draft");

        // Add client ID if present
        if (state.clientId) {
          formData.append("client_id", state.clientId.toString());
        }

        state.mediaFiles.forEach((media) => {
          if (media.file) {
            formData.append("media_files", media.file);
          }
        });

        // Directly call saveDraft instead of going through handleSubmit
        const result = await saveDraft(formData);

        if (result.success) {
          toast.success("Draft saved successfully!");
          resetForm();
        } else {
          throw new Error(result.error || "Failed to save draft");
        }
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Failed to save draft";
        setState((prev) => ({ ...prev, error: message }));
        toast.error(message);
      } finally {
        setState((prev) => ({ ...prev, isLoading: false, isDrafting: false }));
      }
    },
    [
      state.caption,
      state.clientId,
      state.hashtags,
      state.mediaFiles,
      state.selectedPlatforms,
      resetForm,
    ],
  );

  const togglePlatform = useCallback((platform: string) => {
    setState((prev) => ({
      ...prev,
      selectedPlatforms: prev.selectedPlatforms.includes(platform)
        ? prev.selectedPlatforms.filter((p) => p !== platform)
        : [...prev.selectedPlatforms, platform],
    }));
  }, []);

  const renderPreview = () => {
    if (state.selectedPlatforms.length === 0 && state.caption.trim() === "") {
      return (
        <div className="py-4 text-center text-gray-400">
          Select a platform to preview your post.
        </div>
      );
    }

    return state.selectedPlatforms.map((platform) => {
      const mediaArray =
        state.mediaFiles.length > 0
          ? state.mediaFiles.map((file) => file.preview)
          : undefined;

      // Find the matching social page for this platform from clientPages if available
      const socialPage = clientPages.find((page) => page.platform === platform);

      switch (platform) {
        case "facebook":
          return (
            <FacebookPostPreview
              key="facebook"
              pageName={socialPage?.page_name || "Facebook User"}
              content={state.caption}
              media={mediaArray}
            />
          );
        case "instagram":
          return (
            <InstagramPostPreview
              key="instagram"
              pageName={socialPage?.page_name || "Instagram User"}
              content={state.caption}
              media={mediaArray}
            />
          );
        case "linkedin":
          return (
            <LinkedinPostPreview
              key="linkedin"
              pageName={socialPage?.page_name || "LinkedIn User"}
              content={state.caption}
              media={mediaArray}
            />
          );
        default:
          return null;
      }
    });
  };

  return (
    <ShowcaseSection
      title={state.isForClient ? "Create Post for Client" : "Create Post"}
      className="!p-7"
    >
      <div className="flex flex-col lg:flex-row lg:items-start lg:gap-8">
        {/* Form Section */}
        <div className="flex-1 space-y-8">
          {/* Client Selection Dropdown */}
          {!clientId && (
            <div className="mb-6">
              <label
                htmlFor="client-select"
                className="text-lg font-semibold text-gray-800 dark:text-white"
              >
                Select Client
              </label>
              <select
                id="client-select"
                className="mt-1 block w-full rounded-md border-gray-300 p-3 shadow-sm focus:border-primary focus:ring-primary dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                value={state.clientId || ""}
                onChange={(e) =>
                  setState((prev) => ({
                    ...prev,
                    clientId: e.target.value || null,
                    isForClient: !!e.target.value,
                  }))
                }
              >
                <option value="">-- Select a Client--</option>
                {isLoadingClients ? (
                  <option disabled>Loading clients...</option>
                ) : (
                  clients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.name}
                    </option>
                  ))
                )}
              </select>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
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
                  ref={titleRef}
                  type="text"
                  id="title"
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
                  value={state.caption}
                  onChange={(value) =>
                    setState((prev) => ({ ...prev, caption: value }))
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
                {state.hashtags.map((hashtag, index) => (
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

            {/* Scheduled At */}
            <div className="space-y-4">
              <label
                htmlFor="scheduled_at"
                className="block text-sm font-medium text-gray-700 dark:text-gray-200"
              >
                Scheduled At
              </label>
              <input
                type="datetime-local"
                id="scheduled_at"
                name="scheduled_at"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                value={state.scheduledAt}
                onChange={(e) =>
                  setState((prev) => ({ ...prev, scheduledAt: e.target.value }))
                }
              />
            </div>

            {/* Platforms */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
                Platforms
              </h2>
              {state.clientId && clientPages.length > 0 ? (
                <div className="mt-4 flex flex-wrap gap-4">
                  {clientPages.map((page) => (
                    <button
                      key={page.id}
                      type="button"
                      onClick={() => togglePlatform(page.platform)}
                      className={`flex flex-col items-center justify-center gap-1 rounded-md border px-3 py-2 ${
                        state.selectedPlatforms.includes(page.platform)
                          ? "border-primary bg-secondary text-white"
                          : "bg-gray-200 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                      }`}
                    >
                      <span className="flex items-center justify-items-start gap-2 font-semibold capitalize">
                        {
                          platformIcons[
                            page.platform as keyof typeof platformIcons
                          ]
                        }
                        {page.platform}
                      </span>

                      {page.page_name && (
                        <span
                          className={`text-blue-900 dark:text-white ${
                            state.selectedPlatforms.includes(page.platform)
                              ? "border-primary text-white"
                              : "text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                          }`}
                        >
                          {page.page_name}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              ) : state.clientId ? (
                <div className="mt-4 text-gray-500">
                  {loadingPages
                    ? "Loading available platforms..."
                    : "No connected social media accounts found for this client."}
                </div>
              ) : (
                <div className="mt-4 flex space-x-4">
                  {["facebook", "instagram", "linkedin"].map((platform) => (
                    <button
                      key={platform}
                      type="button"
                      onClick={() => togglePlatform(platform)}
                      className={`flex items-center justify-center rounded-md border px-4 py-2 ${
                        state.selectedPlatforms.includes(platform)
                          ? "border-primary bg-primary text-white"
                          : "bg-gray-200 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                      }`}
                    >
                      {platformIcons[platform as keyof typeof platformIcons]}
                      <span className="ml-2 capitalize">{platform}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Media */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
                Media
              </h2>
              <DragDropContext onDragEnd={onDragEnd}>
                <Droppable droppableId="media-previews" direction="horizontal">
                  {(provided) => (
                    <div
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                      className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4"
                    >
                      {state.mediaFiles.map((media, index) => (
                        <Draggable
                          key={media.id}
                          draggableId={media.id}
                          index={index}
                        >
                          {(provided) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className="relative h-40 w-40 overflow-hidden rounded-lg border border-gray-300 bg-white shadow-md dark:bg-gray-800"
                            >
                              {media.preview.startsWith("data:video") ||
                              /\.(mp4|mov)$/i.test(media.preview) ? (
                                <video
                                  controls
                                  preload="auto"
                                  className="h-full w-full object-cover"
                                >
                                  <source
                                    src={media.preview}
                                    type="video/mp4"
                                  />
                                  Your browser does not support the video tag.
                                </video>
                              ) : (
                                <img
                                  src={media.preview}
                                  alt={`Preview ${index}`}
                                  className="h-full w-full object-cover"
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
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>

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
            {state.error && (
              <div className="rounded-md bg-red-50 p-4 dark:bg-red-900 dark:bg-opacity-20">
                <p className="text-sm text-red-700 dark:text-red-300">
                  {state.error}
                </p>
              </div>
            )}

            {/* Buttons */}
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                className="rounded-md border border-gray-300 bg-gray-500 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50"
                onClick={handleSaveAsDraft}
                disabled={state.isLoading}
              >
                {state.isLoading ? "Saving..." : "Save as Draft"}
              </button>

              <button
                type="submit"
                className="hover:bg-primary-dark rounded-md border border-transparent bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50"
                disabled={state.isLoading}
              >
                {state.isLoading && !state.isDrafting
                  ? "Creating..."
                  : "Create Post"}
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
    </ShowcaseSection>
  );
}
