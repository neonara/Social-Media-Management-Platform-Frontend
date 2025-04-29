"use client";

import React, { useRef, useState, useCallback, useEffect } from "react";
import { createPost, saveDraft } from "@/services/postService";
import { ShowcaseSection } from "@/components/Layouts/showcase-section";
import { SimpleWysiwyg } from "@/components/SimpleWysiwyg";
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { FaFacebook, FaInstagram, FaLinkedin } from "react-icons/fa";
import { toast } from "react-hot-toast";
import { useSearchParams } from 'next/navigation';

interface MediaFile {
  id: string;
  preview: string;
  file?: File;
  name?: string;
}

export function PostForm() {
  const searchParams = useSearchParams();
  const clientId = searchParams.get('clientId');
  
  // Refs
  const titleRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const hashtagInputRef = useRef<HTMLInputElement>(null);

  // Consolidated state
  const [state, setState] = useState({
    mediaFiles: [] as MediaFile[],
    caption: "<p>Start writing your post...</p>",
    selectedPlatforms: [] as string[],
    hashtags: [] as string[],
    scheduledAt: "",
    isLoading: false,
    isDrafting: false,
    error: null as string | null,
    isForClient: !!clientId,
    clientId: clientId || null
  });

  // Set client ID from URL params on mount
  useEffect(() => {
    if (clientId) {
      setState(prev => ({
        ...prev,
        isForClient: true,
        clientId
      }));
    }
  }, [clientId]);

  // Platform icons
  const platformIcons = {
    facebook: <FaFacebook className="text-blue-600" />,
    instagram: <FaInstagram className="text-pink-500" />,
    linkedin: <FaLinkedin className="text-blue-700" />,
  };

  // File handling
  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newMediaFiles: MediaFile[] = [];
    
    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          newMediaFiles.push({
            id: URL.createObjectURL(file),
            preview: event.target.result as string,
            file,
            name: file.name
          });
          
          if (newMediaFiles.length === files.length) {
            setState(prev => ({
              ...prev,
              mediaFiles: [...prev.mediaFiles, ...newMediaFiles]
            }));
          }
        }
      };
      reader.readAsDataURL(file);
    });
  }, []);

  const handleRemoveMedia = useCallback((indexToRemove: number) => {
    setState(prev => ({
      ...prev,
      mediaFiles: prev.mediaFiles.filter((_, index) => index !== indexToRemove)
    }));
  }, []);

  // Drag and drop
  const onDragEnd = useCallback((result: DropResult) => {
    if (!result.destination) return;

    const items = [...state.mediaFiles];
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setState(prev => ({ ...prev, mediaFiles: items }));
  }, [state.mediaFiles]);

  // Hashtag management
  const handleAddHashtag = useCallback((event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" && hashtagInputRef.current) {
      event.preventDefault();
      const newHashtag = hashtagInputRef.current.value.trim();
      if (newHashtag) {
        const formattedHashtag = newHashtag.startsWith("#") ? newHashtag : `#${newHashtag}`;
        setState((prev) => ({
          ...prev,
          caption: `${prev.caption}\n${formattedHashtag}`, // Append hashtag to caption
        }));
        hashtagInputRef.current.value = ""; // Clear the input field
      }
    }
  }, []);

  const handleRemoveHashtag = useCallback((index: number) => {
    setState(prev => ({
      ...prev,
      hashtags: prev.hashtags.filter((_, i) => i !== index)
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
      setState((prev) => ({ ...prev, error: "Please select at least one platform" }));
      return;
    }

    if (!state.isDrafting && !state.scheduledAt) {
      setState((prev) => ({ ...prev, error: "Please select a scheduled time" }));
      return;
    }

    try {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      // Append hashtags to the caption
      const hashtagsString = state.hashtags.join(" ");
      const updatedCaption = `${state.caption}\n\n${hashtagsString}`;

      const formData = new FormData();
      formData.append("title", title);
      formData.append("description", updatedCaption); // Use updated caption
      formData.append("platforms", JSON.stringify(state.selectedPlatforms));
      formData.append("status", state.isDrafting ? "draft" : "scheduled");

      if (!state.isDrafting) {
        formData.append("scheduled_for", state.scheduledAt);
      }

      // Add client ID if present
      if (state.clientId) {
        formData.append("client", state.clientId);
      }

      state.mediaFiles.forEach((media) => {
        if (media.file) {
          formData.append("media_files", media.file);
        }
      });

      if (state.isDrafting) {
        await saveDraft(formData);
        toast.success("Draft saved successfully!");
      } else {
        await createPost(formData);
        toast.success(
          state.isForClient
            ? "Post created for client successfully!"
            : "Post created successfully!"
        );
      }

      resetForm();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Submission failed";
      setState((prev) => ({ ...prev, error: message }));
      toast.error(message);
    } finally {
      setState((prev) => ({ ...prev, isLoading: false, isDrafting: false }));
    }
  };

  const handleSaveAsDraft = useCallback(async () => {
    setState(prev => ({ ...prev, isDrafting: true }));
    await handleSubmit(new Event('submit') as unknown as React.FormEvent);
  }, [handleSubmit]);

  const resetForm = useCallback(() => {
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (titleRef.current) titleRef.current.value = "";
    
    setState(prev => ({
      ...prev,
      mediaFiles: [],
      caption: "<p>Start writing your post...</p>",
      selectedPlatforms: [],
      hashtags: [],
      scheduledAt: "",
      isLoading: false,
      isDrafting: false,
      error: null,
      // Keep client ID if it exists
      isForClient: !!prev.clientId,
      clientId: prev.clientId
    }));
  }, []);

  const togglePlatform = useCallback((platform: string) => {
    setState(prev => ({
      ...prev,
      selectedPlatforms: prev.selectedPlatforms.includes(platform)
        ? prev.selectedPlatforms.filter(p => p !== platform)
        : [...prev.selectedPlatforms, platform]
    }));
  }, []);

  const handleChooseFileClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  return (
    <ShowcaseSection title={state.isForClient ? "Create Post for Client" : "Create Post"} className="!p-7">
      {state.isForClient && state.clientId && (
        <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-100">
          <h3 className="text-lg font-medium text-blue-800">
            Creating post for Client ID: {state.clientId}
          </h3>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Post Details */}
        <div>
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Post Details</h2>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mt-4">
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

        {/* Caption */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-200">
            Caption
          </label>
          <SimpleWysiwyg
            value={state.caption}
            onChange={(value) => setState(prev => ({ ...prev, caption: value }))}
            placeholder="Write your post content here..."
          />
        </div>

        {/* Hashtags */}
        <div>
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Hashtags</h2>
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Type a hashtag and press Enter"
              onKeyDown={handleAddHashtag}
              className="mt-2 block w-full rounded-md border-gray-300 shadow-sm"
            />
            <button
              type="button"
              onClick={handleAddHashSymbol}
              className="px-3 py-2 rounded-md bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
              title="Add #"
            >
              #
            </button>
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {state.hashtags.map((hashtag, index) => (
              <span
                key={index}
                className="flex items-center gap-2 px-3 py-1 rounded-full bg-gray-200 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
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
        <div>
          <label htmlFor="scheduled_at" className="block text-sm font-medium text-gray-700 dark:text-gray-200">
            Scheduled At
          </label>
          <input
            type="datetime-local"
            id="scheduled_at"
            name="scheduled_at"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            value={state.scheduledAt}
            onChange={(e) => setState(prev => ({ ...prev, scheduledAt: e.target.value }))}
          />
        </div>

        {/* Platforms */}
        <div>
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Platforms</h2>
          <div className="mt-4 flex space-x-4">
            {["facebook", "instagram", "linkedin"].map((platform) => (
              <button
                key={platform}
                type="button"
                onClick={() => togglePlatform(platform)}
                className={`flex items-center justify-center px-4 py-2 rounded-md border ${
                  state.selectedPlatforms.includes(platform)
                    ? "bg-primary text-white border-primary"
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
        <div>
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Media</h2>
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
                          className="relative h-40 w-40 border border-gray-300 rounded-lg shadow-md overflow-hidden bg-white dark:bg-gray-800"
                        >
                          {media.preview.startsWith("data:image") || 
                          /\.(jpg|jpeg|png|gif)$/i.test(media.preview) ? (
                            <img
                              src={media.preview}
                              alt={`Preview ${index}`}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center bg-gray-200 dark:bg-gray-700">
                              {media.name || "Unsupported Media"}
                            </div>
                          )}
                          <button
                            type="button"
                            onClick={() => handleRemoveMedia(index)}
                            className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 shadow hover:bg-red-600 focus:outline-none"
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
          <button
            type="button"
            onClick={handleChooseFileClick}
            className="mt-4 flex items-center justify-center w-10 h-10 rounded-full bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
            title="Add More Media"
          >
            +
          </button>
          <input
            ref={fileInputRef}
            id="media"
            name="media"
            type="file"
            className="sr-only"
            multiple
            accept="image/*,video/*"
            onChange={handleFileChange}
          />
        </div>

        {/* Error Message */}
        {state.error && (
          <div className="rounded-md bg-red-50 p-4 dark:bg-red-900 dark:bg-opacity-20">
            <p className="text-sm text-red-700 dark:text-red-300">{state.error}</p>
          </div>
        )}

        {/* Buttons */}
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            className="rounded-md border border-gray-300 bg-gray-500 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50"
            onClick={handleSaveAsDraft}
            disabled={state.isLoading}
          >
            {state.isLoading && state.isDrafting ? "Saving..." : "Save as Draft"}
          </button>

          <button
            type="submit"
            className="rounded-md border border-transparent bg-primary py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50"
            disabled={state.isLoading}
          >
            {state.isLoading && !state.isDrafting ? "Creating..." : "Create Post"}
          </button>
        </div>
      </form>
    </ShowcaseSection>
  );
}