"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { getDraftPosts, deletePost, updatePost } from "@/services/postService";
import type { DraftPost } from "@/services/postService";
import { format } from "date-fns";
import {
  FacebookPostPreview,
  InstagramPostPreview,
  LinkedinPostPreview,
} from "../preview-post";
import { toast } from "react-toastify";
import { getClientPages } from "@/services/socialMedia";
import { SocialPage } from "@/types/social-page";
import { FaFacebook, FaInstagram, FaLinkedin, FaTrash } from "react-icons/fa";
import DOMPurify from "dompurify";

export default function DraftPosts() {
  const [drafts, setDrafts] = useState<DraftPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [selectedPosts, setSelectedPosts] = useState<number[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [submittingPosts, setSubmittingPosts] = useState<
    Record<number, boolean>
  >({});
  const [expandedPreviews, setExpandedPreviews] = useState<number[]>([]);
  const [clientPages, setClientPages] = useState<Record<number, SocialPage[]>>(
    {},
  );
  const [loadingPages, setLoadingPages] = useState<Record<number, boolean>>({});
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);

  // Platform icons
  const platformIcons = {
    facebook: <FaFacebook className="size-5 text-blue-600" />,
    instagram: <FaInstagram className="size-5 text-pink-500" />,
    linkedin: <FaLinkedin className="size-5 text-blue-700" />,
  };

  useEffect(() => {
    const fetchDrafts = async () => {
      setLoading(true);
      setError(null);
      try {
        const fetchedDrafts = await getDraftPosts();
        setDrafts(fetchedDrafts);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to fetch drafts.",
        );
        console.error("Error fetching drafts:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDrafts();
  }, []);

  const handleSelectPost = (postId: number) => {
    setSelectedPosts((prev) =>
      prev.includes(postId)
        ? prev.filter((id) => id !== postId)
        : [...prev, postId],
    );
  };

  const handleDeleteSelected = async () => {
    if (selectedPosts.length === 0) return;

    setDeleting(true);
    try {
      await Promise.all(selectedPosts.map((postId) => deletePost(postId)));
      setDrafts((prevDrafts) =>
        prevDrafts.filter((draft) => !selectedPosts.includes(draft.id)),
      );
      setSelectedPosts([]);
      setShowModal(false);
    } catch (err) {
      console.error("Error deleting drafts:", err);
      alert("Failed to delete the selected drafts. Please try again.");
    } finally {
      setDeleting(false);
    }
  };

  const openModal = () => {
    if (selectedPosts.length === 0) {
      alert("Please select at least one post to delete.");
      return;
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
  };

  const handleSubmitPost = async (draftId: number) => {
    try {
      setSubmittingPosts((prev) => ({ ...prev, [draftId]: true }));

      const formData = new FormData();
      formData.append("status", "pending");

      const response = await updatePost(draftId, formData);

      if (response.ok) {
        toast.success("Post submitted successfully!");

        // Update the local state to remove the submitted post
        setDrafts((prev) => prev.filter((post) => post.id !== draftId));
      } else {
        toast.error("Failed to submit post. Please try again.");
      }
    } catch (error) {
      console.error("Error submitting post:", error);
      toast.error("An error occurred while submitting the post.");
    } finally {
      setSubmittingPosts((prev) => ({ ...prev, [draftId]: false }));
    }
  };

  const togglePlatform = (platform: string) => {
    setSelectedPlatforms((prev) =>
      prev.includes(platform)
        ? prev.filter((p) => p !== platform)
        : [...prev, platform],
    );
  };

  const togglePreview = (draftId: number) => {
    setExpandedPreviews((prev) =>
      prev.includes(draftId)
        ? prev.filter((id) => id !== draftId)
        : [...prev, draftId],
    );
  };

  const fetchClientPages = useCallback(
    async (clientId: number) => {
      if (clientPages[clientId] || loadingPages[clientId]) {
        return; // Already fetched or currently loading
      }

      setLoadingPages((prev) => ({ ...prev, [clientId]: true }));
      try {
        const pages = await getClientPages(clientId.toString());
        if (Array.isArray(pages)) {
          setClientPages((prev) => ({ ...prev, [clientId]: pages }));
        } else {
          console.error("Error fetching pages:", pages);
          setClientPages((prev) => ({ ...prev, [clientId]: [] }));
        }
      } catch (error) {
        console.error("Failed to fetch client pages:", error);
        setClientPages((prev) => ({ ...prev, [clientId]: [] }));
      } finally {
        setLoadingPages((prev) => ({ ...prev, [clientId]: false }));
      }
    },
    [clientPages, loadingPages],
  );

  // Effect to fetch client pages when drafts are loaded
  useEffect(() => {
    drafts.forEach((draft) => {
      if (draft.client_id) {
        fetchClientPages(draft.client_id);
      }
    });
  }, [drafts, fetchClientPages]);

  // Filter drafts based on selected platforms
  const filteredDrafts =
    selectedPlatforms.length > 0
      ? drafts.filter((draft) =>
          draft.platforms?.some((platform) =>
            selectedPlatforms.includes(platform),
          ),
        )
      : drafts;

  // Get all unique platforms from drafts for the filter
  const allPlatforms = Array.from(
    new Set(drafts.flatMap((draft) => draft.platforms || [])),
  );

  const renderPreview = (draft: DraftPost) => {
    if (!draft.platforms || draft.platforms.length === 0) {
      return (
        <div className="py-4 text-center text-gray-400">
          No platforms selected for this post.
        </div>
      );
    }

    const mediaArray = draft.media?.map((media) => media.file) || [];
    const draftClientPages = draft.client_id
      ? clientPages[draft.client_id] || []
      : [];

    return draft.platforms.map((platform) => {
      // Find the matching social page for this platform from client pages
      const socialPage = draftClientPages.find(
        (page) => page.platform === platform,
      );

      // Default page names - use client page name if available
      const getPageName = (platform: string) => {
        if (socialPage?.page_name) {
          return socialPage.page_name;
        }

        // Fallback to default names
        const defaultNames = {
          facebook: "Facebook Page",
          instagram: "Instagram Account",
          linkedin: "LinkedIn Page",
        };
        return (
          defaultNames[platform as keyof typeof defaultNames] ||
          `${platform} Page`
        );
      };

      switch (platform) {
        case "facebook":
          return (
            <FacebookPostPreview
              key="facebook"
              pageName={getPageName("facebook")}
              content={draft.description || ""}
              media={mediaArray}
            />
          );
        case "instagram":
          return (
            <InstagramPostPreview
              key="instagram"
              pageName={getPageName("instagram")}
              content={draft.description || ""}
              media={mediaArray}
            />
          );
        case "linkedin":
          return (
            <LinkedinPostPreview
              key="linkedin"
              pageName={getPageName("linkedin")}
              content={draft.description || ""}
              media={mediaArray}
            />
          );
        default:
          return null;
      }
    });
  };

  if (loading) {
    return <div className="text-center text-gray-500">Loading drafts...</div>;
  }

  if (error) {
    return <div className="text-center text-red-500">{error}</div>;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-center text-2xl font-bold text-gray-800 dark:text-gray-100">
        Draft Posts
      </h2>

      <Link href="/content" className="m-auto block w-fit">
        <button
          type="button"
          className="mx-auto mb-2.5 mt-4 flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-primary px-18 py-3 text-lg font-medium text-white transition hover:bg-opacity-90 disabled:opacity-80"
        >
          Create New Post
          {loading && (
            <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-white border-t-transparent" />
          )}
        </button>
      </Link>
      {filteredDrafts.length === 0 ? (
        <p className="text-center text-gray-600 dark:text-gray-300">
          {selectedPlatforms.length > 0
            ? "No drafts found for the selected platforms."
            : "No drafts available. Start creating your first draft!"}
        </p>
      ) : (
        <>
          <div className="flex items-end justify-between">
            {/* Platform Filter Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                Filter by Platform
              </h3>
              <div className="mt-4 flex flex-wrap gap-4">
                {allPlatforms.map((platform) => (
                  <button
                    key={platform}
                    type="button"
                    onClick={() => togglePlatform(platform)}
                    className={`flex items-center justify-center rounded-md px-4 py-2 ${
                      selectedPlatforms.includes(platform)
                        ? "bg-primary text-white"
                        : "bg-gray-200 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                    }`}
                  >
                    {platformIcons[platform as keyof typeof platformIcons]}
                    <span className="ml-2 capitalize">{platform}</span>
                  </button>
                ))}
                {selectedPlatforms.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setSelectedPlatforms([])}
                    className="rounded-md border border-gray-300 bg-white px-4 py-2 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                  >
                    Clear All
                  </button>
                )}
              </div>
            </div>

            {selectedPosts.length !== 0 && (
              <span
                className={`inline-flex h-fit cursor-pointer items-center justify-between gap-2 rounded-md px-3 py-3 ${
                  deleting
                    ? "bg-yellow-500 text-white hover:bg-yellow-600"
                    : "bg-red-500 text-white hover:bg-red-600 dark:bg-red-700 dark:hover:bg-red-800"
                }`}
                onClick={openModal}
                style={{ userSelect: "none" }}
              >
                <FaTrash size={14} />
                Delete Selected
              </span>
            )}
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredDrafts.map((draft) => (
              <div
                key={draft.id}
                className="h-fit rounded-lg border border-gray-300 bg-white p-5 shadow-md dark:border-gray-600 dark:bg-gray-dark"
              >
                <div className="flex items-center justify-between">
                  <h3 className="truncate text-lg font-semibold text-gray-800 dark:text-white">
                    {draft.title || "Untitled Draft"}
                  </h3>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={selectedPosts.includes(draft.id)}
                      onChange={() => handleSelectPost(draft.id)}
                      className="form-checkbox h-5 w-5 text-primary dark:border-gray-600 dark:bg-gray-700"
                    />
                  </div>
                </div>
                <p
                  className="mt-4 line-clamp-2 text-sm text-gray-600 dark:text-gray-300"
                  dangerouslySetInnerHTML={{
                    __html: DOMPurify.sanitize(draft.description),
                  }}
                />

                {/* Platform buttons with page names - click to toggle preview */}
                {draft.platforms && draft.platforms.length > 0 && (
                  <div className="mt-4 space-y-2">
                    <div className="flex flex-wrap gap-2">
                      {draft.platforms.map((platform) => {
                        const draftClientPages = draft.client_id
                          ? clientPages[draft.client_id] || []
                          : [];
                        const socialPage = draftClientPages.find(
                          (page) => page.platform === platform,
                        );

                        return (
                          <button
                            key={platform}
                            type="button"
                            onClick={() => togglePreview(draft.id)}
                            className={`flex flex-col items-center justify-center gap-1 rounded-md border px-3 py-2 transition-colors ${
                              expandedPreviews.includes(draft.id)
                                ? "bg-primary text-white"
                                : "bg-gray-200 text-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                            } dark:border-dark-2`}
                          >
                            <span className="flex items-center justify-items-start gap-2 font-semibold capitalize">
                              {
                                platformIcons[
                                  platform as keyof typeof platformIcons
                                ]
                              }
                              {platform}
                            </span>
                            {socialPage?.page_name && (
                              <span className="text-white dark:text-white">
                                {socialPage.page_name}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
                {/* Preview Section */}
                {expandedPreviews.includes(draft.id) && (
                  <div className="mt-4 border-t border-gray-200 pt-4 dark:border-gray-600">
                    <div className="max-h-96 space-y-4 overflow-y-auto">
                      {renderPreview(draft)}
                    </div>
                  </div>
                )}

                {draft.hashtags && draft.hashtags.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {draft.hashtags.map((hashtag, index) => (
                      <span
                        key={index}
                        className="rounded-full bg-gray-200 px-2 py-1 text-sm text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                      >
                        {hashtag}
                      </span>
                    ))}
                  </div>
                )}
                <div className="mt-2 flex items-center justify-between">
                  <span
                    className={`text-sm font-medium ${
                      draft.scheduled_for
                        ? "text-green-600 dark:text-green-400"
                        : "text-gray-500 dark:text-gray-400"
                    }`}
                  >
                    {draft.scheduled_for
                      ? `Publish time: ${format(new Date(draft.scheduled_for), "PPpp")}`
                      : "Not scheduled"}
                  </span>
                  <span
                    className={`rounded-md px-2 py-1 text-sm font-semibold ${
                      draft.status === "draft"
                        ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                        : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
                    }`}
                  >
                    {draft.status.charAt(0).toUpperCase() +
                      draft.status.slice(1)}
                  </span>
                </div>
                <div className="mt-4 flex justify-between gap-2">
                  <Link href={`/editPost/${draft.id}`}>
                    <button className="hover:bg-primary-dark rounded-md bg-primary px-4 py-2 text-sm text-white focus:outline-none dark:bg-primary dark:hover:bg-primary/90">
                      Edit
                    </button>
                  </Link>

                  {/* Submit for Review Button */}
                  <button
                    onClick={() => handleSubmitPost(draft.id)}
                    disabled={submittingPosts[draft.id]}
                    className={`rounded-md px-4 py-2 text-sm font-medium text-white focus:outline-none ${
                      submittingPosts[draft.id]
                        ? "cursor-not-allowed bg-gray-400 dark:bg-gray-600"
                        : "bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800"
                    }`}
                  >
                    {submittingPosts[draft.id]
                      ? "Submitting..."
                      : "Submit for Review"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-96 rounded-lg bg-white p-6 shadow-lg dark:border dark:border-gray-600 dark:bg-gray-dark">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
              Confirm Deletion
            </h3>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
              Are you sure you want to delete the selected drafts? This action
              cannot be undone.
            </p>
            <div className="mt-4 flex justify-end space-x-3">
              <button
                onClick={closeModal}
                className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteSelected}
                disabled={deleting}
                className={`rounded-md px-4 py-2 text-sm font-medium text-white shadow-sm focus:outline-none ${
                  deleting
                    ? "cursor-not-allowed bg-gray-400 dark:bg-gray-600"
                    : "bg-red-500 hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700"
                }`}
              >
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
