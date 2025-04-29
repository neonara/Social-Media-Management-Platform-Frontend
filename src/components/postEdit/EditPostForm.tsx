"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import { 
    getPostById,
    updatePost,
    saveDraft 
} from "@/services/postService";
import { ShowcaseSection } from "@/components/Layouts/showcase-section";
import { SimpleWysiwyg } from "@/components/SimpleWysiwyg";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import { useRouter } from "next/navigation";
import { FaFacebook, FaInstagram, FaLinkedin } from "react-icons/fa";
import { toast } from "react-hot-toast";
import type { DraftPost } from "@/services/postService";

interface MediaFile {
  id?: number;
  preview: string;
  file?: File;
  name?: string;
}

interface EditPostFormProps {
  postId: string;
}

const EditPostForm = ({ postId }: EditPostFormProps) => {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    title: "",
    caption: "<p>Start writing your post...</p>",
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
        if (post.hashtags && typeof post.hashtags === 'string') {
          formattedHashtags = (post.hashtags as string).split(',');
        } else if (Array.isArray(post.hashtags)) {
          formattedHashtags = post.hashtags;
        }

        setFormData({
          title: post.title,
          caption: post.description || "<p>Start writing your post...</p>",
          scheduledTime: post.scheduled_for || "",
          selectedPlatforms: post.platforms || [],
          hashtags: formattedHashtags, 
          mediaFiles: post.media?.map(media => ({
            id: media.id,
            preview: media.file,
            name: media.name
          })) || []
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load post");
      } finally {
        setLoading(false);
      }
    };

    fetchPostData();
  }, [postId]);

  const handleAddHashtag = useCallback((event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      const input = event.currentTarget.value.trim();
      if (input) {
        const formattedHashtag = input.startsWith("#") ? input : `#${input}`;
        setFormData((prev) => ({
          ...prev,
          caption: `${prev.caption}\n${formattedHashtag}`, // Append hashtag to caption
        }));
        event.currentTarget.value = ""; // Clear the input field
      }
    }
  }, []);

  const handleRemoveHashtag = useCallback((index: number) => {
    setFormData(prev => ({
      ...prev,
      hashtags: prev.hashtags.filter((_, i) => i !== index)
    }));
  }, []);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
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
            name: file.name
          });
          
          if (newMediaFiles.length === files.length) {
            setFormData(prev => ({
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
    setFormData(prev => ({
      ...prev,
      mediaFiles: prev.mediaFiles.filter((_, index) => index !== indexToRemove)
    }));
  }, []);

  const handleDragEnd = useCallback((result: any) => {
    if (!result.destination) return;

    const reorderedMedia = [...formData.mediaFiles];
    const [removed] = reorderedMedia.splice(result.source.index, 1);
    reorderedMedia.splice(result.destination.index, 0, removed);

    setFormData(prev => ({
      ...prev,
      mediaFiles: reorderedMedia
    }));
  }, [formData.mediaFiles]);

  const handleUpdate = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    try {
      const hashtagsString = formData.hashtags.join(" ");
      const updatedCaption = `${formData.caption}\n\n${hashtagsString}`;

      const formDataToSend = new FormData();
      formDataToSend.append("title", formData.title);
      formDataToSend.append("description", updatedCaption); // Use updated caption
      formDataToSend.append("scheduled_for", formData.scheduledTime);
      formDataToSend.append("platforms", JSON.stringify(formData.selectedPlatforms));
      formDataToSend.append("status", "scheduled");

      formData.mediaFiles.forEach((media) => {
        if (media.id) {
          formDataToSend.append("existing_media", media.id.toString());
        }
        if (media.file) {
          formDataToSend.append("media", media.file);
        }
      });

      await updatePost(parseInt(postId), formDataToSend);

      toast.success("Post updated successfully!");
      router.push("/posts");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update post");
      toast.error("Failed to update post");
    }
  };

  const handleSaveAsDraft = async () => {
    setError(null);
    setUploadProgress(0);
    setIsDrafting(true);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append("title", formData.title);
      formDataToSend.append("description", formData.caption);
      formDataToSend.append("platforms", JSON.stringify(formData.selectedPlatforms));
      formDataToSend.append("status", "draft");

      const filteredHashtags = formData.hashtags.filter((hashtag) => hashtag.trim() !== "");
      formDataToSend.append("hashtags", JSON.stringify(filteredHashtags));

      formData.mediaFiles.forEach((media) => {
        if (media.id) {
          formDataToSend.append("existing_media", media.id.toString());
        }
      });

      formData.mediaFiles.forEach((media) => {
        if (media.file) {
          formDataToSend.append("media", media.file);
        }
      });

      await saveDraft(formDataToSend);

      setUploadSuccess(true);
      toast.success("Draft saved successfully!");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save draft");
      toast.error("Failed to save draft");
    } finally {
      setUploadProgress(null);
      setIsDrafting(false);
    }
  };

  const handleAddHashSymbol = () => {
    const input = document.querySelector('input[placeholder="Type a hashtag and press Enter"]') as HTMLInputElement;
    if (input) {
      const value = input.value.trim();
      if (value && !value.startsWith("#")) {
        input.value = `#${value}`;
      }
      input.focus();
    }
  };

  const platformIcons = {
    facebook: <FaFacebook className="text-blue-600" />,
    instagram: <FaInstagram className="text-pink-500" />,
    linkedin: <FaLinkedin className="text-blue-700" />,
  };

  if (loading) return <div className="flex justify-center p-8"><p>Loading...</p></div>;
  if (error) return <div className="p-4 text-red-500">{error}</div>;

  return (
    <ShowcaseSection title="Edit Post" className="!p-7">
      {uploadProgress !== null && (
        <div className="mb-4">
          <div className="h-2 bg-gray-200 rounded-full">
            <div 
              className="h-full bg-primary rounded-full" 
              style={{ width: `${uploadProgress}%` }}
            ></div>
          </div>
          <p className="text-sm text-gray-600 mt-1">
            Uploading: {uploadProgress}%
          </p>
        </div>
      )}

      <form onSubmit={handleUpdate} className="space-y-6">
        {/* Title */}
        <div>
          <label className="block text-sm font-medium">Title</label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
            required
          />
        </div>

        {/* Caption */}
        <div>
          <label className="block text-sm font-medium">Caption</label>
          <SimpleWysiwyg 
            value={formData.caption} 
            onChange={(value) => setFormData(prev => ({ ...prev, caption: value }))} 
          />
        </div>

        {/* Scheduled Time */}
        <div>
          <label className="block text-sm font-medium">Scheduled Time</label>
          <input
            type="datetime-local"
            value={formData.scheduledTime}
            onChange={(e) => setFormData(prev => ({ ...prev, scheduledTime: e.target.value }))}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
          />
        </div>

        {/* Platforms */}
        <div>
          <label className="block text-sm font-medium">Platforms</label>
          <div className="mt-2 flex space-x-4">
            {["facebook", "instagram", "linkedin"].map((platform) => (
              <button
                key={platform}
                type="button"
                onClick={() => 
                  setFormData(prev => ({
                    ...prev,
                    selectedPlatforms: prev.selectedPlatforms.includes(platform)
                      ? prev.selectedPlatforms.filter(p => p !== platform)
                      : [...prev.selectedPlatforms, platform]
                  }))
                }
                className={`flex items-center justify-center px-4 py-2 rounded-md border ${
                  formData.selectedPlatforms.includes(platform)
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

        {/* Hashtags */}
        <div>
          <h2 className="text-lg font-semibold">Hashtags</h2>
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
              className="px-3 py-2 rounded-md bg-gray-200 text-gray-700 hover:bg-gray-300"
              title="Add #"
            >
              #
            </button>
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {formData.hashtags.map((hashtag, index) => (
              <span
                key={index}
                className="flex items-center gap-2 px-3 py-1 rounded-full bg-gray-200 text-gray-700"
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

        {/* Media */}
        <div>
          <label className="block text-sm font-medium">Media</label>
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable
              droppableId="media-previews"
              direction="horizontal"
            >
              {(provided) => (
                <div
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  className="mt-1 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4"
                >
                  {formData.mediaFiles.map((media, index) => (
                    <Draggable
                      key={media.id || index}
                      draggableId={`media-${media.id || index}`}
                      index={index}
                    >
                      {(provided) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className="relative h-40 w-40 border border-gray-300 rounded-lg shadow-md overflow-hidden bg-white"
                        >
                          {media.preview.startsWith("data:image") || 
                          /\.(jpg|jpeg|png|gif)$/i.test(media.preview) ? (
                            <img
                              src={media.preview}
                              alt={media.name || `Preview ${index}`}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center bg-gray-200">
                              {media.name || "Unsupported Media"}
                            </div>
                          )}
                          <button
                            type="button"
                            onClick={() => handleRemoveMedia(index)}
                            className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 shadow hover:bg-red-600"
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
            onClick={() => fileInputRef.current?.click()}
            className="mt-4 flex items-center justify-center w-10 h-10 rounded-full bg-gray-200 text-gray-700 hover:bg-gray-300"
            title="Add More Media"
          >
            +
          </button>
          <input
            ref={fileInputRef}
            type="file"
            className="sr-only"
            multiple
            accept="image/*,video/*"
            onChange={handleFileChange}
          />
        </div>

        {/* Submit Buttons */}
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={handleSaveAsDraft}
            className="rounded-md border border-gray-300 bg-gray-500 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-gray-600"
            disabled={uploadProgress !== null}
          >
            {isDrafting ? "Saving..." : "Save as Draft"}
          </button>

          <button
            type="submit"
            className="rounded-md border border-transparent bg-primary py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-primary-dark"
            disabled={uploadProgress !== null}
          >
            {uploadProgress !== null ? "Updating..." : "Update Post"}
          </button>
        </div>
      </form>

      {uploadSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-96">
            <h2 className="text-lg font-semibold text-gray-800">Success</h2>
            <p className="text-sm text-gray-600 mt-2">
              {isDrafting ? "Draft saved successfully!" : "Post updated successfully!"}
            </p>
            <div className="flex justify-end mt-4">
              <button
                onClick={() => {
                  setUploadSuccess(false);
                  if (!isDrafting) {
                    router.push("/posts");
                  }
                }}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark"
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

export default EditPostForm;