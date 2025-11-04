/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import {
  getPostById,
  updatePost,
  createPost,
  saveDraft,
  getAssignedClients,
  getAllClientsForAdmin,
} from "@/services/postService";
import { ShowcaseSection } from "@/components/Layouts/showcase-section";
import { SimpleWysiwyg } from "@/components/SimpleWysiwyg";
import { DateSelector } from "./DateSelector";
import { TimeSelector } from "./TimeSelector";
import { DndContext, useDraggable, closestCenter } from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useRouter } from "next/navigation";
import { useThemedToast } from "@/hooks/useThemedToast";
import Image from "next/image";
import { fetchClientPages } from "@/services/clientPagesService";
import { SocialPage, SocialPlatform } from "@/types/social-page";
import {
  FacebookPostPreview,
  InstagramPostPreview,
  LinkedinPostPreview,
} from "../postPreview";
import { getPlatformIconWithSize } from "../platformIcons";
import { X, Save, Send } from "lucide-react";
import { useUser } from "@/context/UserContext";
import { ScheduledPost, DraftPost } from "@/types/post";
import { Button } from "@/components/ui-elements/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface MediaFile {
  id?: number | string;
  preview: string;
  file?: File;
  name?: string;
}

interface Client {
  id: number;
  name: string;
  email: string;
}

interface PostFormProps {
  mode: "create" | "edit";
  postId?: string;
  clientId?: string | null;
}

const PostForm: React.FC<PostFormProps> = ({ mode, postId, clientId }) => {
  const router = useRouter();
  const themedToast = useThemedToast();
  const { role } = useUser();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const hashtagInputRef = useRef<HTMLInputElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);

  // Function to determine the appropriate status when updating a post
  const determineUpdateStatus = (
    currentPost: ScheduledPost | DraftPost,
    userRole: string | undefined,
  ): string => {
    // If creating a new post, default to scheduled
    if (mode === "create") {
      return "scheduled";
    }

    const currentStatus = currentPost.status;

    // Workflow logic based on current status and user role
    switch (currentStatus) {
      case "rejected":
        // When a rejected post is edited
        if (
          userRole === "moderator" ||
          userRole === "administrator" ||
          userRole === "super_administrator"
        ) {
          // Moderator editing a rejected post should go back to pending for client approval
          return "pending";
        } else if (userRole === "community_manager") {
          // CM editing a rejected post should also go back to pending
          return "pending";
        } else if (userRole === "client") {
          // Client editing their rejected post should go back to pending
          return "pending";
        }
        return "pending"; // Default for rejected posts being edited

      case "pending":
        // When a pending post is edited, it stays pending
        return "pending";

      case "draft":
        // When a draft is published/scheduled, it goes to scheduled
        return "scheduled";

      case "scheduled":
        // When a scheduled post is edited, it should go back to pending for re-approval
        if (
          userRole === "moderator" ||
          userRole === "administrator" ||
          userRole === "super_administrator"
        ) {
          return "pending"; // Moderator editing should require client approval again
        } else if (userRole === "community_manager") {
          return "pending"; // CM editing should require client approval again
        }
        return "scheduled"; // Client editing their own scheduled post keeps it scheduled

      case "published":
        // Published posts shouldn't be editable, but if they are, keep them published
        return "published";

      default:
        return "scheduled"; // Default fallback
    }
  };

  const [originalPost, setOriginalPost] = useState<
    ScheduledPost | DraftPost | null
  >(null);

  const [formData, setFormData] = useState({
    title: "",
    caption: "",
    scheduledTime: "",
    selectedPlatforms: [] as string[],
    hashtags: [] as string[],
    mediaFiles: [] as MediaFile[],
  });

  // Separate state for date and time components
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedTime, setSelectedTime] = useState<string>("");

  // Helper function to combine date and time into ISO string
  const combineDateTime = (date: string, time: string): string => {
    if (!date || !time) return "";
    try {
      const [hours, minutes] = time.split(":").map(Number);
      const dateObj = new Date(date);
      dateObj.setHours(hours, minutes, 0, 0);
      return dateObj.toISOString();
    } catch (error) {
      console.error("Error combining date and time:", error);
      return "";
    }
  };

  // Helper function to parse ISO string into separate date and time
  const parseDateTime = (isoString: string) => {
    if (!isoString) return { date: "", time: "" };
    try {
      const date = new Date(isoString);
      const dateString = date.toISOString().split("T")[0]; // YYYY-MM-DD
      const timeString = `${date.getHours().toString().padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}`; // HH:MM
      return { date: dateString, time: timeString };
    } catch (error) {
      console.error("Error parsing date time:", error);
      return { date: "", time: "" };
    }
  };

  const [loading, setLoading] = useState(mode === "edit");
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [isDrafting, setIsDrafting] = useState(false);

  // Client-related state
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoadingClients, setIsLoadingClients] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(
    clientId || null,
  );
  const [clientPages, setClientPages] = useState<SocialPage[]>([]);
  const [loadingPages, setLoadingPages] = useState(false);
  const [postClientInfo, setPostClientInfo] = useState<{
    id: number;
    full_name: string;
    email: string;
  } | null>(null);

  // Platform icons

  // Fetch clients for create mode
  useEffect(() => {
    const fetchClients = async () => {
      if (mode === "create" && !clientId) {
        setIsLoadingClients(true);
        try {
          try {
            let clientsArray: Client[] = [];

            // Check if user is admin or super admin - they can see all clients
            if (role === "administrator" || role === "super_administrator") {
              console.log("Admin user detected - fetching all clients");
              const adminResponse = await getAllClientsForAdmin();
              console.log("Admin response:", adminResponse);
              // Extract clients from the admin response structure
              clientsArray = adminResponse.clients.map((client) => ({
                id: client.id,
                name: client.full_name || client.email.split("@")[0],
                email: client.email,
              }));
              console.log("Processed admin clients:", clientsArray);
            } else {
              console.log("Non-admin user - fetching assigned clients");
              // For other roles, use assigned clients
              const response = await getAssignedClients();
              // Ensure response is always an array
              clientsArray = Array.isArray(response) ? response : [];
              console.log("Assigned clients:", clientsArray);
            }

            setClients(clientsArray);
          } catch (error) {
            console.error("Failed to fetch clients:", error);
            themedToast.error("Failed to load client list");
            // Set empty array on error to prevent crashes
            setClients([]);
          } finally {
            setIsLoadingClients(false);
          }
        } catch (error) {
          console.error("Failed to fetch clients:", error);
          themedToast.error("Failed to load client list");
          // Set empty array on error to prevent crashes
          setClients([]);
        } finally {
          setIsLoadingClients(false);
        }
      }
    };

    fetchClients();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, clientId, role]); // Added role as dependency

  // Fetch post data for edit mode
  useEffect(() => {
    const fetchPostData = async () => {
      if (mode === "edit" && postId) {
        try {
          setLoading(true);
          const post = await getPostById(parseInt(postId));

          if (!post) {
            setError("Post not found");
            return;
          }

          // Store the original post data for workflow decisions
          setOriginalPost(post);

          let formattedHashtags: string[] = [];
          if (post.hashtags && typeof post.hashtags === "string") {
            formattedHashtags = (post.hashtags as string).split(",");
          } else if (Array.isArray(post.hashtags)) {
            formattedHashtags = post.hashtags;
          }

          // Handle date formatting
          let formattedScheduledTime = "";
          if (post.scheduled_for) {
            try {
              const dateObj = new Date(post.scheduled_for);
              if (!isNaN(dateObj.getTime())) {
                const year = dateObj.getFullYear();
                const month = String(dateObj.getMonth() + 1).padStart(2, "0");
                const day = String(dateObj.getDate()).padStart(2, "0");
                const hours = String(dateObj.getHours()).padStart(2, "0");
                const minutes = String(dateObj.getMinutes()).padStart(2, "0");
                formattedScheduledTime = `${year}-${month}-${day}T${hours}:${minutes}`;
              }
            } catch (error) {
              console.error("Error formatting date:", error);
            }
          }

          setFormData({
            title: post.title,
            caption: post.description || "",
            scheduledTime: formattedScheduledTime,
            selectedPlatforms: Array.isArray(post.platforms)
              ? post.platforms
              : [],
            hashtags: formattedHashtags,
            mediaFiles:
              post.media?.map((media) => ({
                id: Number(media.id),
                preview: String(media.file),
                name: String(media.name || ""),
              })) || [],
          });

          // Set separate date and time states
          if (formattedScheduledTime) {
            const { date, time } = parseDateTime(formattedScheduledTime);
            setSelectedDate(date);
            setSelectedTime(time);
          }

          // Set client info for edit mode
          if (post.client_id) {
            setSelectedClientId(post.client_id.toString());
            if (post.client) {
              setPostClientInfo({
                id: Number(post.client.id),
                full_name: String(post.client.full_name || ""),
                email: String(post.client.email || ""),
              });
            }
          } else if (post.client) {
            // Handle case where client exists but client_id might not be set
            setSelectedClientId(post.client.id.toString());
            setPostClientInfo({
              id: Number(post.client.id),
              full_name: String(post.client.full_name || ""),
              email: String(post.client.email || ""),
            });
          }
        } catch (err) {
          setError(err instanceof Error ? err.message : "Failed to load post");
        } finally {
          setLoading(false);
        }
      }
    };

    fetchPostData();
  }, [mode, postId]);

  // Use the centralized fetchClientPages service
  const fetchClientPagesData = useCallback(
    async (clientId: string) => {
      console.log("fetchClientPagesData called with clientId:", clientId);
      setLoadingPages(true);
      try {
        const pages = await fetchClientPages(clientId);
        setClientPages(pages);
      } catch (error) {
        console.error("Failed to fetch client pages:", error);
        themedToast.error("Failed to load client social media pages");
        setClientPages([]);
      } finally {
        setLoadingPages(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [], // Stable function, themedToast should be stable but causing issues
  );

  useEffect(() => {
    console.log("useEffect for selectedClientId triggered:", selectedClientId);
    if (selectedClientId) {
      fetchClientPagesData(selectedClientId);
    } else {
      setClientPages([]);
    }
  }, [selectedClientId, fetchClientPagesData]);

  // Filter selected platforms when client pages are loaded
  useEffect(() => {
    if (selectedClientId && clientPages.length > 0) {
      const availablePlatforms = clientPages.map((page) => page.platform);
      const filteredPlatforms = formData.selectedPlatforms.filter((platform) =>
        availablePlatforms.includes(platform as SocialPlatform),
      );

      if (filteredPlatforms.length !== formData.selectedPlatforms.length) {
        setFormData((prev) => ({
          ...prev,
          selectedPlatforms: filteredPlatforms,
        }));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedClientId, clientPages]); // formData.selectedPlatforms intentionally omitted to avoid infinite loop

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

      Array.from(files).forEach((file, index) => {
        const reader = new FileReader();
        reader.onload = (event) => {
          if (event.target?.result) {
            newMediaFiles.push({
              id: mode === "create" ? `new-${Date.now()}-${index}` : undefined,
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
    [mode],
  );

  const handleRemoveMedia = useCallback(
    (indexToRemove: number) => {
      console.log("handleRemoveMedia called with index:", indexToRemove);
      console.log("Current mediaFiles:", formData.mediaFiles);
      setFormData((prev) => {
        const newMediaFiles = prev.mediaFiles.filter(
          (_, index) => index !== indexToRemove,
        );
        console.log("New mediaFiles after removal:", newMediaFiles);
        return {
          ...prev,
          mediaFiles: newMediaFiles,
        };
      });
    },
    [formData.mediaFiles],
  );

  const handleDragEnd = useCallback(
    (event: any) => {
      const { active, over } = event;
      if (!over) return;

      const oldIndex = formData.mediaFiles.findIndex(
        (file) => (file.id?.toString() || "") === active.id,
      );
      const newIndex = formData.mediaFiles.findIndex(
        (file) => (file.id?.toString() || "") === over.id,
      );

      if (oldIndex === newIndex) return;

      setFormData((prev) => ({
        ...prev,
        mediaFiles: arrayMove(prev.mediaFiles, oldIndex, newIndex),
      }));
    },
    [formData.mediaFiles],
  );

  const togglePlatform = useCallback(
    (platform: string) => {
      setFormData((prev) => {
        // If we have a client with specific pages, only allow platforms they have connected
        if (selectedClientId && clientPages.length > 0) {
          const hasConnectedPlatform = clientPages.some(
            (page) => page.platform === platform,
          );
          if (!hasConnectedPlatform) {
            themedToast.error(`${platform} is not connected for this client`);
            return prev;
          }
        }

        return {
          ...prev,
          selectedPlatforms: prev.selectedPlatforms.includes(platform)
            ? prev.selectedPlatforms.filter((p) => p !== platform)
            : [...prev.selectedPlatforms, platform],
        };
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [selectedClientId, clientPages], // themedToast is stable from the hook
  );

  const handleAddHashSymbol = useCallback(() => {
    if (hashtagInputRef.current) {
      const value = hashtagInputRef.current.value.trim();
      if (value && !value.startsWith("#")) {
        hashtagInputRef.current.value = `#${value}`;
      }
      hashtagInputRef.current.focus();
    }
  }, []);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    // Prevent multiple submissions
    if (uploadProgress !== null) {
      return;
    }

    setError(null);

    // Get title from ref for create mode, from state for edit mode
    const title =
      mode === "create" ? titleRef.current?.value || "" : formData.title;

    // Validation
    if (!title) {
      setError("Please enter a title");
      return;
    }

    // if (!formData.selectedPlatforms.length) {
    //   setError("Please select at least one platform");
    //   return;
    // }

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
      formDataToSend.append("title", title);
      formDataToSend.append("description", formData.caption);
      formDataToSend.append(
        "platforms",
        JSON.stringify(formData.selectedPlatforms),
      );

      // Determine the appropriate status based on the workflow logic
      const newStatus = originalPost
        ? determineUpdateStatus(originalPost, role)
        : "scheduled";
      formDataToSend.append("status", newStatus);

      // Add client ID if selected
      if (selectedClientId) {
        formDataToSend.append("client_id", selectedClientId);
      }

      // Format the date properly
      let formattedDate = "";
      if (formData.scheduledTime) {
        try {
          const date = new Date(formData.scheduledTime);
          formattedDate = date.toISOString();
          if (isNaN(date.getTime())) {
            throw new Error("Invalid date");
          }
        } catch (err) {
          console.error("Date conversion error:", err);
          formattedDate = formData.scheduledTime.replace(
            /T(\d{2}):(\d{2})$/,
            "T$1:$2:00Z",
          );
        }
      }
      formDataToSend.append("scheduled_for", formattedDate);

      // Handle media files
      if (mode === "edit") {
        // For edit mode, append existing media IDs
        formData.mediaFiles.forEach((media) => {
          if (media.id && typeof media.id === "number") {
            formDataToSend.append("existing_media", media.id.toString());
          }
        });
      }

      // Append new media files
      formData.mediaFiles.forEach((media) => {
        if (media.file) {
          formDataToSend.append("media_files", media.file);
        }
      });

      let response;
      if (mode === "create") {
        response = await createPost(formDataToSend);
        if (!response.success) {
          throw new Error(
            typeof response.error === "string"
              ? response.error
              : `Failed to ${mode} post`,
          );
        }
      } else {
        response = await updatePost(parseInt(postId!), formDataToSend);
        if (!response.success) {
          throw new Error(response.error || `Failed to ${mode} post`);
        }
      }

      setUploadSuccess(true);
      themedToast.success(
        `Post ${mode === "create" ? "created" : "updated"} successfully!`,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to ${mode} post`);
      themedToast.error(`Failed to ${mode} post`);
    } finally {
      setUploadProgress(null);
    }
  };

  const handleSaveAsDraft = useCallback(async () => {
    // Prevent multiple submissions
    if (isDrafting || uploadProgress !== null) {
      return;
    }

    setIsDrafting(true);
    setError(null);

    try {
      const title =
        mode === "create" ? titleRef.current?.value || "" : formData.title;
      const formDataToSend = new FormData();

      formDataToSend.append("title", title);
      formDataToSend.append("description", formData.caption);
      formDataToSend.append(
        "platforms",
        JSON.stringify(formData.selectedPlatforms),
      );
      formDataToSend.append("status", "draft");

      if (selectedClientId) {
        formDataToSend.append("client_id", selectedClientId);
      }

      let formattedDate = "";
      if (formData.scheduledTime) {
        try {
          const date = new Date(formData.scheduledTime);
          formattedDate = date.toISOString();
        } catch (err) {
          console.error("Date conversion error in draft save:", err);
          formattedDate = "";
        }
      }
      formDataToSend.append("scheduled_for", formattedDate);

      // Handle media files
      if (mode === "edit") {
        formData.mediaFiles.forEach((media) => {
          if (media.id && typeof media.id === "number") {
            formDataToSend.append("existing_media", media.id.toString());
          }
        });
      }

      formData.mediaFiles.forEach((media) => {
        if (media.file) {
          formDataToSend.append("media_files", media.file);
        }
      });

      let response;
      if (mode === "create") {
        response = await saveDraft(formDataToSend);
        if (!response.success) {
          throw new Error(response.error || "Failed to save draft");
        }
      } else {
        response = await updatePost(parseInt(postId!), formDataToSend);
        if (!response.success) {
          throw new Error(response.error || "Failed to save draft");
        }
      }

      themedToast.success("Draft saved successfully!");
      setUploadSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save draft");
      themedToast.error("Failed to save draft");
    } finally {
      setIsDrafting(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, formData, selectedClientId, postId]); // themedToast is stable from the hook

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

      // Find the matching social page for this platform from clientPages if available
      const socialPage = clientPages.find((page) => page.platform === platform);

      switch (platform) {
        case "facebook":
          return (
            <FacebookPostPreview
              key="facebook"
              pageName={socialPage?.page_name || "Facebook Page"}
              content={formData.caption}
              media={mediaArray}
            />
          );
        case "instagram":
          return (
            <InstagramPostPreview
              key="instagram"
              pageName={socialPage?.page_name || "Instagram Account"}
              content={formData.caption}
              media={mediaArray}
            />
          );
        case "linkedin":
          return (
            <LinkedinPostPreview
              key="linkedin"
              pageName={socialPage?.page_name || "LinkedIn Page"}
              content={formData.caption}
              media={mediaArray}
            />
          );
        default:
          return null;
      }
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <p>Loading...</p>
      </div>
    );
  }

  if (error && mode === "edit") {
    return <div className="p-4 text-red-500">{error}</div>;
  }

  return (
    <ShowcaseSection
      title={
        mode === "create"
          ? selectedClientId
            ? `Create Post for Client`
            : role === "administrator" || role === "super_administrator"
              ? "Create Post (Admin)"
              : "Create Post"
          : postClientInfo
            ? "Edit Client Post"
            : "Edit Post"
      }
      className="!p-7"
    >
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

          {/* Client Selection for Create Mode */}
          {mode === "create" && !clientId && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
                {role === "administrator" || role === "super_administrator"
                  ? "Client Selection"
                  : "Client Selection (Optional)"}
              </h2>

              <Select
                value={selectedClientId || "no-client"}
                disabled={isLoadingClients}
                onValueChange={(value) =>
                  setSelectedClientId(value === "no-client" ? null : value)
                }
              >
                <SelectTrigger className="w-full max-w-md">
                  <SelectValue
                    placeholder={
                      isLoadingClients
                        ? "Loading..."
                        : role === "administrator" ||
                            role === "super_administrator"
                          ? "Select a Client"
                          : "Select a Client (Optional)"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="no-client">
                    {isLoadingClients
                      ? "Loading..."
                      : role === "administrator" ||
                          role === "super_administrator"
                        ? "Select a Client"
                        : "Create Personal Post"}
                  </SelectItem>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id.toString()}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Client Information for Edit Mode */}
          {mode === "edit" && postClientInfo && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
                Client Information
              </h2>
              <div className="rounded-md bg-gray-50 p-4 dark:bg-gray-800">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                    Creating post for:
                  </span>
                  <span className="text-sm font-semibold text-primary">
                    {postClientInfo.full_name ||
                      postClientInfo.email.split("@")[0]}
                  </span>
                </div>
              </div>
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
                {mode === "create" ? (
                  <input
                    ref={titleRef}
                    type="text"
                    id="title"
                    className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm outline-none focus:border-primary focus:ring-primary dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                    required
                  />
                ) : (
                  <input
                    type="text"
                    id="title"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        title: e.target.value,
                      }))
                    }
                    className="mt-1 block w-full rounded-md border-gray-300 p-2 shadow-sm focus:border-primary focus:ring-primary dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                    required
                  />
                )}
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
              <div className="mt-2 flex items-center justify-center gap-2">
                <input
                  ref={hashtagInputRef}
                  type="text"
                  placeholder="Type a hashtag (no spaces) and press Enter"
                  onKeyDown={handleAddHashtag}
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

            <div className="flex justify-between">
              {/* Scheduled Time */}
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
                  Scheduled At
                </h2>

                <div className="grid grid-cols-2 gap-4">
                  <DateSelector
                    value={selectedDate}
                    onChange={(date: string) => {
                      setSelectedDate(date);
                      const combinedDateTime = combineDateTime(
                        date,
                        selectedTime,
                      );
                      if (combinedDateTime) {
                        const selectedTime = new Date(
                          combinedDateTime,
                        ).getTime();
                        const currentTime = new Date().getTime();
                        const minimumTime = currentTime + 1 * 60 * 1000;

                        if (selectedTime < minimumTime) {
                          setError(
                            "The selected time must be at least 1 minute in the future.",
                          );
                        } else {
                          setFormData((prev) => ({
                            ...prev,
                            scheduledTime: combinedDateTime,
                          }));
                          setError(null);
                        }
                      }
                    }}
                    label="Date"
                    isRequired
                    className={error ? "border-red-500" : ""}
                  />

                  <TimeSelector
                    value={selectedTime}
                    onChange={(time: string) => {
                      setSelectedTime(time);
                      const combinedDateTime = combineDateTime(
                        selectedDate,
                        time,
                      );
                      if (combinedDateTime) {
                        const selectedTime = new Date(
                          combinedDateTime,
                        ).getTime();
                        const currentTime = new Date().getTime();
                        const minimumTime = currentTime + 1 * 60 * 1000;

                        if (selectedTime < minimumTime) {
                          setError(
                            "The selected time must be at least 1 minute in the future.",
                          );
                        } else {
                          setFormData((prev) => ({
                            ...prev,
                            scheduledTime: combinedDateTime,
                          }));
                          setError(null);
                        }
                      }
                    }}
                    label="Time"
                    isRequired
                    className={error ? "border-red-500" : ""}
                  />
                </div>

                {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
              </div>

              {/* Platforms */}
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
                  Platforms
                </h2>
                {selectedClientId && clientPages.length > 0 ? (
                  <div className="mt-4 flex flex-wrap gap-4">
                    {clientPages.map((page) => (
                      <button
                        key={page.id}
                        type="button"
                        onClick={() => togglePlatform(page.platform)}
                        className={`flex flex-col items-center justify-center gap-1 rounded-md px-3 py-2 ${
                          formData.selectedPlatforms.includes(page.platform)
                            ? "border-primary bg-secondary text-white"
                            : "bg-gray-200 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                        }`}
                      >
                        <span className="flex items-center justify-items-start gap-2 font-semibold capitalize">
                          {getPlatformIconWithSize(page.platform, "h-6 w-6")}
                          {page.platform}
                        </span>

                        {page.page_name && (
                          <span
                            className={`text-blue-900 dark:text-white ${
                              formData.selectedPlatforms.includes(page.platform)
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
                ) : selectedClientId ? (
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
                        className={`flex items-center justify-center rounded-md px-4 py-2 ${
                          formData.selectedPlatforms.includes(platform)
                            ? "border-primary bg-primary text-white"
                            : "bg-gray-200 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                        }`}
                      >
                        <span className="h-6 w-6">
                          {getPlatformIconWithSize(platform, "h-6 w-6")}
                        </span>
                        <span className="ml-2 capitalize">{platform}</span>
                      </button>
                    ))}
                  </div>
                )}
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
                  items={formData.mediaFiles.map(
                    (file, index) => file.id?.toString() || index.toString(),
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
              {mode === "create" && (
                <Button
                  variant="outlineDark"
                  label={
                    uploadProgress !== null && isDrafting
                      ? "Saving..."
                      : "Save as Draft"
                  }
                  icon={<Save size={16} />}
                  onClick={handleSaveAsDraft}
                  {...(uploadProgress !== null && { disabled: true })}
                />
              )}

              <Button
                variant="primary"
                label={
                  uploadProgress !== null && !isDrafting
                    ? mode === "create"
                      ? "Creating..."
                      : "Updating..."
                    : mode === "create"
                      ? "Create Post"
                      : "Update Post"
                }
                icon={<Send size={16} />}
                onClick={handleSubmit as any}
                {...(uploadProgress !== null && { disabled: true })}
              />
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
                : `Post ${mode === "create" ? "created" : "updated"} successfully!`}
            </p>
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => {
                  setUploadSuccess(false);
                  if (!isDrafting) {
                    router.push("/drafts");
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

  const handleRemoveClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log("Remove button clicked for index:", index);
    handleRemoveMedia(index);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="relative h-40 w-40 overflow-hidden rounded-lg bg-white shadow-lg dark:bg-gray-800"
    >
      {/* Drag handle area - everything except the remove button */}
      <div
        {...attributes}
        {...listeners}
        className="absolute inset-0 cursor-move"
        style={{ zIndex: 1 }}
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
      </div>

      {/* Remove button - separate from drag handlers */}
      <button
        type="button"
        onClick={handleRemoveClick}
        onMouseDown={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
        className="absolute right-2 top-2 z-20 rounded-full bg-red-500 p-1 font-bold text-white shadow hover:bg-red-600 focus:outline-none"
        title="Remove"
        style={{ pointerEvents: "auto" }}
      >
        <X size={20} />
      </button>
    </div>
  );
};

export default PostForm;
