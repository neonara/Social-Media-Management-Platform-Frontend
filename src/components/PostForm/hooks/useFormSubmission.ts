import { useThemedToast } from "@/hooks/useThemedToast";
import { createPost, saveDraft, updatePost } from "@/services/postService";
import { DraftPost, ScheduledPost } from "@/types/post";
import { useCallback, useState } from "react";

interface MediaFile {
  id?: number | string;
  preview: string;
  file?: File;
  name?: string;
}

interface FormData {
  title: string;
  caption: string;
  scheduledTime: string;
  selectedPlatforms: string[];
  hashtags: string[];
  mediaFiles: MediaFile[];
}

interface UseFormSubmissionProps {
  mode: "create" | "edit";
  postId?: string;
  formData: FormData;
  selectedClientId: string | null;
  originalPost: ScheduledPost | DraftPost | null;
  role: string | undefined;
}

interface UseFormSubmissionReturn {
  uploadProgress: number | null;
  uploadSuccess: boolean;
  isDrafting: boolean;
  error: string | null;
  setError: (error: string | null) => void;
  handleSubmit: (title: string) => Promise<void>;
  handleSaveAsDraft: () => Promise<void>;
  resetSuccess: () => void;
}

// Function to determine the appropriate status when updating a post
const determineUpdateStatus = (
  currentPost: ScheduledPost | DraftPost,
  userRole: string | undefined,
): string => {
  const currentStatus = currentPost.status;

  switch (currentStatus) {
    case "rejected":
      return "pending";

    case "pending":
      return "pending";

    case "draft":
      return "scheduled";

    case "scheduled":
      if (
        userRole === "moderator" ||
        userRole === "administrator" ||
        userRole === "super_administrator"
      ) {
        return "pending";
      }
      return "scheduled";

    case "published":
      return "published";

    default:
      return "scheduled";
  }
};

export const useFormSubmission = ({
  mode,
  postId,
  formData,
  selectedClientId,
  originalPost,
  role,
}: UseFormSubmissionProps): UseFormSubmissionReturn => {
  const themedToast = useThemedToast();
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [isDrafting, setIsDrafting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = useCallback(
    async (title: string) => {
      // Prevent multiple submissions
      if (uploadProgress !== null) {
        return;
      }

      setError(null);

      // Validation
      if (!title) {
        setError("Please enter a title");
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
          console.debug("Create post response:", response);
          if (!response.success) {
            throw new Error(
              typeof response.error === "string"
                ? response.error
                : `Failed to ${mode} post`,
            );
          }
        } else {
          console.debug(
            "Updating post with ID:",
            postId,
            "formData keys:",
            Array.from(formDataToSend.keys()),
          );
          response = await updatePost(parseInt(postId!), formDataToSend);
          console.debug("Update post response:", response);
          if (!response.success) {
            throw new Error(response.error || `Failed to ${mode} post`);
          }
        }

        setUploadSuccess(true);
        themedToast.success(
          `Post ${mode === "create" ? "created" : "updated"} successfully!`,
        );
      } catch (err) {
        const errorMsg =
          err instanceof Error ? err.message : `Failed to ${mode} post`;
        console.error(`Error during ${mode}:`, err, errorMsg);
        setError(errorMsg);
        themedToast.error(errorMsg);
      } finally {
        setUploadProgress(null);
      }
    },
    [
      uploadProgress,
      formData,
      selectedClientId,
      mode,
      postId,
      originalPost,
      role,
      themedToast,
    ],
  );

  const handleSaveAsDraft = useCallback(async () => {
    // Prevent multiple submissions
    if (isDrafting || uploadProgress !== null) {
      return;
    }

    setIsDrafting(true);
    setError(null);

    try {
      const formDataToSend = new FormData();

      formDataToSend.append("title", formData.title);
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
  }, [
    isDrafting,
    uploadProgress,
    formData,
    selectedClientId,
    mode,
    postId,
    themedToast,
  ]);

  const resetSuccess = useCallback(() => {
    setUploadSuccess(false);
  }, []);

  return {
    uploadProgress,
    uploadSuccess,
    isDrafting,
    error,
    setError,
    handleSubmit,
    handleSaveAsDraft,
    resetSuccess,
  };
};
