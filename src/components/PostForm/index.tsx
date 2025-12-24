/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import EngagementPredictionCard from "@/components/EngagementPredictionCard";
import { ShowcaseSection } from "@/components/Layouts/showcase-section";
import { Button } from "@/components/ui-elements/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useUser } from "@/context/UserContext";
import {
  formatTimeForDisplay,
  shouldReschedulePost,
  useEngagementPrediction,
} from "@/hooks/useEngagementPrediction";
import { fetchClientPages } from "@/services/clientPagesService";
import { SocialPage } from "@/types/social-page";
import { Save, Send } from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { PostPreview } from "./components/PostPreview";
import { SuccessDialog } from "./dialogs/SuccessDialog";
import { useClientData } from "./hooks/useClientData";
import { useFormSubmission } from "./hooks/useFormSubmission";
import { usePostData } from "./hooks/usePostData";
import { HashtagsSection } from "./sections/HashtagsSection";
import { MediaSection } from "./sections/MediaSection";
import { PlatformsSection } from "./sections/PlatformsSection";
import { PostDetailsSection } from "./sections/PostDetailsSection";
import { SchedulingSection } from "./sections/SchedulingSection";

interface MediaFile {
  id?: number | string;
  preview: string;
  file?: File;
  name?: string;
}

interface PostFormProps {
  mode: "create" | "edit";
  postId?: string;
  clientId?: string | null;
}

const PostForm: React.FC<PostFormProps> = ({ mode, postId, clientId }) => {
  const router = useRouter();
  const { role } = useUser();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const _initializedFromPost = useRef(false);

  // Use custom hooks for state management
  const postData = usePostData(mode, postId);
  const clientData = useClientData(mode, clientId, role);

  // State for form data and UI
  const [formData, setFormData] = useState({
    title: "",
    caption: "",
    scheduledTime: "",
    selectedPlatforms: [] as string[],
    hashtags: [] as string[],
    mediaFiles: [] as MediaFile[],
  });

  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [clientPages, setClientPages] = useState<SocialPage[]>([]);
  const [loadingPages, setLoadingPages] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Use form submission hook
  const submission = useFormSubmission({
    mode,
    postId,
    formData,
    selectedClientId: postData.selectedClientId,
    originalPost: postData.originalPost,
    role,
  });

  // Use engagement prediction hook
  const {
    prediction,
    loading: predicting,
    error: predictionError,
    predictEngagement,
  } = useEngagementPrediction();
  const [showPredictionAlert, setShowPredictionAlert] = useState(false);

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

  // Sync post data to form data when editing: initialize once when postData arrives
  useEffect(() => {
    // Only initialize once to avoid overwriting user edits
    if (
      mode === "edit" &&
      !_initializedFromPost.current &&
      ((postData.formData && postData.formData.title) || postData.originalPost)
    ) {
      // prefer structured formData but fall back to originalPost if present
      const sourceForm =
        postData.formData && postData.formData.title
          ? postData.formData
          : {
              title: postData.originalPost?.title || "",
              caption: postData.originalPost?.description || "",
              scheduledTime: postData.originalPost?.scheduled_for || "",
              selectedPlatforms: Array.isArray(
                (postData.originalPost as any)?.platforms,
              )
                ? (postData.originalPost as any).platforms
                : [],
              hashtags: Array.isArray((postData.originalPost as any)?.hashtags)
                ? (postData.originalPost as any).hashtags
                : [],
              mediaFiles:
                (postData.originalPost as any)?.media?.map((m: any) => ({
                  id: Number(m.id),
                  preview: String(m.file),
                  name: String(m.name || ""),
                })) || [],
            };

      console.debug("Initializing PostForm from postData for edit mode", {
        postId,
        formData: sourceForm,
      });

      _initializedFromPost.current = true;
      setFormData(sourceForm as any);

      // If hook provided parsed selectedDate/Time use them, otherwise parse from scheduledTime
      if (postData.selectedDate && postData.selectedTime) {
        setSelectedDate(postData.selectedDate);
        setSelectedTime(postData.selectedTime);
      } else if ((sourceForm as any).scheduledTime) {
        try {
          const dt = new Date((sourceForm as any).scheduledTime);
          setSelectedDate(dt.toISOString().split("T")[0]);
          setSelectedTime(
            `${String(dt.getHours()).padStart(2, "0")}:${String(dt.getMinutes()).padStart(2, "0")}`,
          );
        } catch (err) {
          // ignore
        }
      }
    }

    const fetchPages = async () => {
      if (postData.selectedClientId) {
        setLoadingPages(true);
        try {
          const pages = await fetchClientPages(postData.selectedClientId);
          setClientPages(pages);
        } catch (err) {
          console.error("Failed to fetch client pages:", err);
          setClientPages([]);
        } finally {
          setLoadingPages(false);
        }
      } else {
        setClientPages([]);
      }
    };

    fetchPages();
  }, [
    mode,
    postId,
    postData.formData,
    postData.selectedDate,
    postData.selectedTime,
    postData.selectedClientId,
  ]);

  // Handle file upload
  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files || files.length === 0) return;

      const fileArray = Array.from(files);
      const promises = fileArray.map(
        (file) =>
          new Promise<MediaFile>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (event) => {
              if (event.target?.result) {
                resolve({
                  id:
                    mode === "create"
                      ? `new-${Date.now()}-${Math.random()}`
                      : undefined,
                  preview: event.target.result as string,
                  file,
                  name: file.name,
                });
              } else {
                reject(new Error("Failed to read file"));
              }
            };
            reader.onerror = () => reject(reader.error);
            reader.readAsDataURL(file);
          }),
      );

      Promise.all(promises)
        .then((loadedFiles) => {
          console.log("Files loaded:", loadedFiles.length);
          setFormData((prev) => ({
            ...prev,
            mediaFiles: [...prev.mediaFiles, ...loadedFiles],
          }));
          // Reset the input so selecting the same file again will trigger change
          if (e.target) {
            e.target.value = "";
          }
        })
        .catch((error) => {
          console.error("Error loading files:", error);
        });
    },
    [mode],
  );

  // Handle media removal
  const handleRemoveMedia = useCallback((index: number) => {
    setFormData((prev) => ({
      ...prev,
      mediaFiles: prev.mediaFiles.filter((_, i) => i !== index),
    }));
  }, []);

  // Handle drag end for media reordering
  const handleDragEnd = useCallback((event: any) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    // Extract indices from IDs like "media-0", "media-1", etc.
    const oldIndex = parseInt(active.id.split("-")[1], 10);
    const newIndex = parseInt(over.id.split("-")[1], 10);

    if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return;

    setFormData((prev) => {
      const newMediaFiles = [...prev.mediaFiles];
      const [movedFile] = newMediaFiles.splice(oldIndex, 1);
      newMediaFiles.splice(newIndex, 0, movedFile);
      return {
        ...prev,
        mediaFiles: newMediaFiles,
      };
    });
  }, []);

  // Handle adding hashtag
  const handleAddHashtag = useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (event.key === "Enter") {
        event.preventDefault();
        const input = event.currentTarget.value.trim().replace(/\s+/g, "_");
        if (input) {
          const formattedHashtag = input.startsWith("#") ? input : `#${input}`;
          setFormData((prev) => ({
            ...prev,
            hashtags: [...prev.hashtags, formattedHashtag],
          }));
          event.currentTarget.value = "";
        }
      }
    },
    [],
  );

  // Handle caption change
  const handleCaptionChange = useCallback((newCaption: string) => {
    setFormData((prev) => ({
      ...prev,
      caption: newCaption,
    }));
  }, []);

  // Handle hashtags insert
  const handleHashtagsInsert = useCallback((hashtags: string[]) => {
    setFormData((prev) => ({
      ...prev,
      caption: `${prev.caption}${prev.caption.trim() ? "\n\n" : ""}${hashtags.join(" ")}`,
    }));
  }, []);

  // Handle platform toggle
  const handleTogglePlatform = useCallback((platform: string) => {
    setFormData((prev) => ({
      ...prev,
      selectedPlatforms: prev.selectedPlatforms.includes(platform)
        ? prev.selectedPlatforms.filter((p) => p !== platform)
        : [...prev.selectedPlatforms, platform],
    }));
  }, []);

  // Handle date change
  const handleDateChange = (date: string) => {
    setSelectedDate(date);
    const combinedDateTime = combineDateTime(date, selectedTime);
    if (combinedDateTime) {
      setFormData((prev) => ({
        ...prev,
        scheduledTime: combinedDateTime,
      }));
    }
  };

  // Handle time change
  const handleTimeChange = (time: string) => {
    setSelectedTime(time);
    const combinedDateTime = combineDateTime(selectedDate, time);
    if (combinedDateTime) {
      setFormData((prev) => ({
        ...prev,
        scheduledTime: combinedDateTime,
      }));
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const title =
      mode === "create" ? titleRef.current?.value || "" : formData.title;

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

    setError(null);
    await submission.handleSubmit(title);
  };

  // Check engagement prediction before saving
  const handleCheckEngagement = async () => {
    const title =
      mode === "create" ? titleRef.current?.value || "" : formData.title;

    if (!title) {
      setError("Please enter a title");
      return;
    }

    if (!formData.scheduledTime) {
      setError("Please select a scheduled time");
      return;
    }

    if (formData.selectedPlatforms.length === 0) {
      setError("Please select at least one platform");
      return;
    }

    setError(null);

    try {
      const scheduledDate = new Date(formData.scheduledTime);

      // Get the first selected platform for prediction
      const platform = formData.selectedPlatforms[0].toLowerCase();

      await predictEngagement({
        caption: formData.caption,
        caption_length: formData.caption.length,
        hashtag_count: (formData.caption.match(/#/g) || []).length,
        time_of_day: `${String(scheduledDate.getHours()).padStart(2, "0")}:${String(scheduledDate.getMinutes()).padStart(2, "0")}`,
        day_of_week: scheduledDate.getDay(),
        platform: platform as "instagram" | "facebook" | "linkedin",
        media_type:
          formData.mediaFiles.length > 1
            ? "carousel"
            : formData.mediaFiles.length === 1
              ? formData.mediaFiles[0].file?.type?.includes("video")
                ? "video"
                : "image"
              : "text",
        brand_sentiment: 0.7, // Default, can be made configurable
      });
    } catch (err) {
      console.error("Failed to get engagement prediction:", err);
      setError("Failed to get engagement prediction. Please try again.");
    }
  };

  if (postData.loading) {
    return (
      <div className="flex justify-center p-8">
        <p>Loading...</p>
      </div>
    );
  }

  if (postData.error && mode === "edit") {
    return <div className="p-4 text-red-500">{postData.error}</div>;
  }

  return (
    <ShowcaseSection
      title={
        mode === "create"
          ? postData.selectedClientId
            ? `Create Post for Client`
            : role === "administrator" || role === "super_administrator"
              ? "Create Post (Admin)"
              : "Create Post"
          : postData.postClientInfo
            ? "Edit Client Post"
            : "Edit Post"
      }
      className="!p-7"
    >
      <div className="flex flex-col lg:flex-row lg:items-start lg:gap-8">
        {/* Form Section */}
        <div className="flex-1 space-y-8">
          {submission.uploadProgress !== null && (
            <div className="mb-4">
              <div className="h-2 rounded-full bg-gray-200">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${submission.uploadProgress}%` }}
                ></div>
              </div>
              <p className="mt-1 text-sm text-gray-600">
                Uploading: {submission.uploadProgress}%
              </p>
            </div>
          )}

          <div className="flex justify-between">
            {/* Client Selection for Create Mode */}
            {mode === "create" && !clientId && (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
                  {role === "administrator" || role === "super_administrator"
                    ? "Client Selection"
                    : "Client Selection (Optional)"}
                </h2>
                <Select
                  value={postData.selectedClientId || "no-client"}
                  disabled={clientData.isLoadingClients}
                  onValueChange={(value) => {
                    const newClientId = value === "no-client" ? null : value;
                    postData.setSelectedClientId(newClientId);
                  }}
                >
                  <SelectTrigger className="w-full max-w-md">
                    <SelectValue
                      placeholder={
                        clientData.isLoadingClients
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
                      {clientData.isLoadingClients
                        ? "Loading..."
                        : role === "administrator" ||
                            role === "super_administrator"
                          ? "Select a Client"
                          : "Create Personal Post"}
                    </SelectItem>
                    {clientData.clients.map((client) => (
                      <SelectItem key={client.id} value={client.id.toString()}>
                        {client.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <PlatformsSection
              selectedPlatforms={formData.selectedPlatforms}
              clientPages={clientPages}
              loadingPages={loadingPages}
              onPlatformToggle={handleTogglePlatform}
            />
          </div>

          {/* Client Information for Edit Mode */}
          {mode === "edit" && postData.postClientInfo && (
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
                    {postData.postClientInfo.full_name ||
                      postData.postClientInfo.email.split("@")[0]}
                  </span>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Post Details Section */}
            <PostDetailsSection
              mode={mode}
              title={formData.title}
              caption={formData.caption}
              selectedPlatforms={formData.selectedPlatforms}
              onTitleChange={(title) =>
                setFormData((prev) => ({ ...prev, title }))
              }
              onCaptionChange={handleCaptionChange}
              onHashtagsInsert={handleHashtagsInsert}
              titleRef={titleRef as React.RefObject<HTMLInputElement>}
            />

            {/* Hashtags Section */}
            <HashtagsSection
              caption={formData.caption}
              hashtags={formData.hashtags}
              onHashtagsInsert={handleHashtagsInsert}
              onRemoveHashtag={(index) =>
                setFormData((prev) => ({
                  ...prev,
                  hashtags: prev.hashtags.filter((_, i) => i !== index),
                }))
              }
              onAddHashtag={handleAddHashtag}
            />

            <div className="flex flex-col flex-wrap gap-8 lg:flex-row">
              {/* Scheduling Section */}

              <SchedulingSection
                selectedDate={selectedDate}
                selectedTime={selectedTime}
                onDateChange={handleDateChange}
                onTimeChange={handleTimeChange}
              />
            </div>

            {/* Media Section */}
            <MediaSection
              mediaFiles={formData.mediaFiles}
              uploadProgress={submission.uploadProgress}
              onFileChange={handleFileChange}
              onRemoveMedia={handleRemoveMedia}
              onDragEnd={handleDragEnd}
              fileInputRef={fileInputRef as React.RefObject<HTMLInputElement>}
              videoInputRef={videoInputRef as React.RefObject<HTMLInputElement>}
            />

            {/* Error Message */}
            {(error || submission.error) && (
              <div className="rounded-md bg-red-50 p-4 dark:bg-red-900 dark:bg-opacity-20">
                <p className="text-sm text-red-700 dark:text-red-300">
                  {error || submission.error}
                </p>
              </div>
            )}

            {/* Buttons */}
            <div className="flex justify-end space-x-3">
              <Button
                variant="outlineDark"
                label={predicting ? "Checking..." : "Check Engagement"}
                icon={<Send size={16} />}
                onClick={handleCheckEngagement}
                disabled={predicting || submission.uploadProgress !== null}
              />

              {mode === "create" && (
                <Button
                  variant="outlineDark"
                  label={submission.isDrafting ? "Saving..." : "Save as Draft"}
                  icon={<Save size={16} />}
                  onClick={(e) => {
                    e.preventDefault();
                    submission.handleSaveAsDraft();
                  }}
                  disabled={submission.uploadProgress !== null}
                />
              )}

              <Button
                type="submit"
                variant="primary"
                label={
                  submission.uploadProgress !== null && !submission.isDrafting
                    ? mode === "create"
                      ? "Creating..."
                      : "Updating..."
                    : mode === "create"
                      ? "Create Post"
                      : "Update Post"
                }
                icon={<Send size={16} />}
                disabled={submission.uploadProgress !== null}
              />
            </div>
          </form>
        </div>

        {/* Preview Section */}
        <div className="w-full space-y-4 lg:w-1/3">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
            Post Preview
          </h2>
          <div className="space-y-4">
            <PostPreview
              selectedPlatforms={formData.selectedPlatforms}
              caption={formData.caption}
              mediaFiles={formData.mediaFiles}
              clientPages={clientPages}
            />
          </div>

          {/* Engagement Prediction Section */}
          {prediction && (
            <div className="mt-6 space-y-4">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
                📊 Engagement Prediction
              </h2>

              {/* Reschedule Alert */}
              {prediction.best_time &&
                shouldReschedulePost(
                  parseInt(selectedTime.split(":")[0]),
                  prediction.best_time,
                ) && (
                  <div className="rounded-lg border-2 border-orange-300 bg-orange-50 p-4 dark:border-orange-700 dark:bg-orange-900 dark:bg-opacity-20">
                    <p className="text-sm font-bold text-orange-800 dark:text-orange-300">
                      ⚠️ Better Time Available
                    </p>
                    <p className="mt-2 text-sm text-orange-700 dark:text-orange-200">
                      Consider posting at{" "}
                      <span className="font-semibold">
                        {formatTimeForDisplay(prediction.best_time)}
                      </span>{" "}
                      instead of {selectedTime} for potentially higher
                      engagement.
                    </p>
                    <button
                      onClick={() => {
                        const [hours, mins] = prediction
                          .best_time!.split(":")
                          .map(Number);
                        const newTime = `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
                        handleTimeChange(newTime);
                        setShowPredictionAlert(false);
                      }}
                      className="mt-3 rounded bg-orange-600 px-3 py-1 text-sm font-semibold text-white hover:bg-orange-700 dark:bg-orange-700 dark:hover:bg-orange-600"
                    >
                      Update Time
                    </button>
                  </div>
                )}

              {/* Prediction Card */}
              <EngagementPredictionCard
                prediction={prediction}
                currentTime={parseInt(selectedTime.split(":")[0])}
              />
            </div>
          )}

          {/* Prediction Error */}
          {predictionError && (
            <div className="rounded-md bg-red-50 p-4 dark:bg-red-900 dark:bg-opacity-20">
              <p className="text-sm text-red-700 dark:text-red-300">
                ❌ {predictionError}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Success Dialog */}
      <SuccessDialog
        isOpen={submission.uploadSuccess}
        isDrafting={submission.isDrafting}
        mode={mode}
        onClose={() => {
          submission.resetSuccess();
          if (!submission.isDrafting) {
            router.push("/drafts");
          }
        }}
      />
    </ShowcaseSection>
  );
};

export default PostForm;
