"use client";

import * as postService from "@/services/postService";
import { ScheduledPost } from "@/types/post";
import { User as UserType } from "@/types/user";
import { getApprovalStatus, getValidationStatus } from "@/utils/postWorkflow";
import { format } from "date-fns";
import {
  AlertTriangle,
  Building2,
  CalendarClock,
  Check,
  CheckCircle,
  Clock,
  Edit3,
  Loader,
  MessageSquare,
  PenTool,
  RotateCcw,
  Trash2,
  UserCheck,
  X,
  XCircle,
} from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import { Button } from "../../../../components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../../../../components/ui/dialog";

interface PostCardModalProps {
  selectedPost: ScheduledPost;
  setSelectedPost: (post: ScheduledPost | null) => void;
  fetchScheduledPosts: () => void;
  renderPreview: () => React.ReactNode;
  currentUser: UserType | null;
  onApprove?: (postId: number) => Promise<void>;
  onReject?: (postId: number, feedback?: string) => Promise<void>;
}

export default function PostCardModal({
  selectedPost,
  setSelectedPost,
  fetchScheduledPosts,
  renderPreview,
  currentUser,
  onApprove,
  onReject,
}: PostCardModalProps) {
  const router = useRouter();
  const [isRejecting, setIsRejecting] = useState(false);
  const [feedback, setFeedback] = useState("");

  // Check if current user is a CM (community manager)
  const isCM = currentUser?.is_community_manager === true;
  const isClient = currentUser?.is_client === true;
  const isModerator =
    currentUser?.is_moderator === true ||
    currentUser?.is_administrator === true;

  async function handleDelete() {
    const confirmDelete = window.confirm(
      `Are you sure you want to delete the post titled "${selectedPost.title}"?`,
    );
    if (confirmDelete) {
      try {
        await postService.deletePost(selectedPost.id);
        setSelectedPost(null);
        fetchScheduledPosts();
      } catch (error) {
        console.error("Error deleting post:", error);
      }
    }
  }

  async function handleApprove() {
    if (onApprove) {
      await onApprove(selectedPost.id);
      setSelectedPost(null); // Close modal
    }
  }

  async function handleSendReject() {
    if (onReject) {
      await onReject(selectedPost.id, feedback);
      setSelectedPost(null); // Close modal
      setIsRejecting(false);
    }
  }

  return (
    <Dialog open={true} onOpenChange={() => setSelectedPost(null)}>
      <DialogContent className="mx-2 my-1 max-h-[95vh] w-[calc(100vw-1rem)] max-w-sm overflow-hidden overflow-y-scroll bg-white dark:border-gray-700 dark:bg-gray-800 sm:mx-4 sm:my-4 sm:w-full sm:max-w-md md:max-w-2xl lg:max-w-4xl xl:max-w-6xl">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-xl">
                {selectedPost.title || "Post"}
              </DialogTitle>
            </div>
          </div>
        </DialogHeader>

        {/* Modal Body - Scrollable */}
        <div className="flex-1 overflow-y-auto px-1">
          <div className="grid h-full grid-cols-1 gap-4 md:gap-6 xl:grid-cols-2">
            {/* Left side - Post Details */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 md:text-base">
                Post Details
              </h3>

              <div className="grid grid-cols-2 gap-3 md:gap-4">
                {/* Client */}
                <div className="flex items-center gap-2 rounded-lg border border-teal-200 bg-teal-50 p-3 dark:border-teal-800 dark:bg-teal-950/30 md:gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-teal-500 text-white md:h-10 md:w-10">
                    <Building2 className="h-4 w-4 md:h-5 md:w-5" />
                  </div>
                  <div className="flex-1">
                    <div className="text-xs font-medium text-teal-600 dark:text-teal-400">
                      Client
                    </div>
                    <div className="font-semibold text-teal-900 dark:text-teal-100">
                      {selectedPost.client?.full_name ||
                        selectedPost.client?.email?.split("@")[0] ||
                        "Unknown"}
                    </div>
                  </div>
                </div>
                {/* Creator */}
                <div className="flex items-center gap-2 rounded-lg border border-indigo-200 bg-indigo-50 p-3 dark:border-indigo-800 dark:bg-indigo-950/30 md:gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-500 text-white md:h-10 md:w-10">
                    <UserCheck className="h-4 w-4 md:h-5 md:w-5" />
                  </div>
                  <div className="flex-1">
                    <div className="text-xs font-medium text-indigo-600 dark:text-indigo-400">
                      Creator
                    </div>
                    <div className="font-semibold text-indigo-900 dark:text-indigo-100">
                      {selectedPost.creator?.full_name ||
                        selectedPost.creator?.email?.split("@")[0] ||
                        "Unknown"}
                    </div>
                  </div>
                </div>
                {/* Status */}
                <div
                  className={`flex items-center gap-2 rounded-lg border p-3 md:gap-3 ${
                    selectedPost.status === "published"
                      ? "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/30"
                      : selectedPost.status === "rejected"
                        ? "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/30"
                        : selectedPost.status === "pending"
                          ? "border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950/30"
                          : "border-purple-200 bg-purple-50 dark:border-purple-800 dark:bg-purple-950/30"
                  }`}
                >
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-full text-white md:h-10 md:w-10 ${
                      selectedPost.status === "published"
                        ? "bg-green-500"
                        : selectedPost.status === "rejected"
                          ? "bg-red-500"
                          : selectedPost.status === "pending"
                            ? "bg-yellow-500"
                            : "bg-purple-500"
                    }`}
                  >
                    <Loader className="h-4 w-4 md:h-5 md:w-5" />
                  </div>
                  <div className="flex-1">
                    <div
                      className={`text-xs font-medium ${
                        selectedPost.status === "published"
                          ? "text-green-600 dark:text-green-400"
                          : selectedPost.status === "rejected"
                            ? "text-red-600 dark:text-red-400"
                            : selectedPost.status === "pending"
                              ? "text-yellow-600 dark:text-yellow-400"
                              : "text-purple-600 dark:text-purple-400"
                      }`}
                    >
                      Status
                    </div>
                    <div
                      className={`font-semibold ${
                        selectedPost.status === "published"
                          ? "text-green-900 dark:text-green-100"
                          : selectedPost.status === "rejected"
                            ? "text-red-900 dark:text-red-100"
                            : selectedPost.status === "pending"
                              ? "text-yellow-900 dark:text-yellow-100"
                              : "text-purple-900 dark:text-purple-100"
                      }`}
                    >
                      {selectedPost.status
                        ? selectedPost.status.charAt(0).toUpperCase() +
                          selectedPost.status.slice(1)
                        : "Unknown"}
                    </div>
                  </div>
                </div>
                {/* Scheduled for */}
                <div className="flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-800 dark:bg-blue-950/30 md:gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500 text-white md:h-10 md:w-10">
                    <CalendarClock className="h-4 w-4 md:h-5 md:w-5" />
                  </div>
                  <div className="flex-1">
                    <div className="text-xs font-medium text-blue-600 dark:text-blue-400">
                      Scheduled for
                    </div>
                    <div className="font-semibold text-blue-900 dark:text-blue-100">
                      {format(new Date(selectedPost.scheduled_for), "PPp")}
                    </div>
                  </div>
                </div>

                {/* Last edited by - Only show if data exists */}
                {selectedPost.last_edited_by &&
                  selectedPost.status !== "rejected" && (
                    <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-950/30 md:gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-500 text-white md:h-10 md:w-10">
                        <PenTool className="h-4 w-4 md:h-5 md:w-5" />
                      </div>
                      <div className="flex-1">
                        <div className="text-xs font-medium text-amber-600 dark:text-amber-400">
                          Last edited by
                        </div>
                        <div className="font-semibold text-amber-900 dark:text-amber-100">
                          {(() => {
                            const lastEditedBy = selectedPost.last_edited_by;
                            if (typeof lastEditedBy === "string") {
                              return lastEditedBy.split("@")[0];
                            } else if (
                              lastEditedBy &&
                              typeof lastEditedBy === "object"
                            ) {
                              return (
                                lastEditedBy.full_name ||
                                lastEditedBy.email?.split("@")[0]
                              );
                            }
                            return "Unknown User";
                          })()}
                        </div>
                      </div>
                    </div>
                  )}

                {/* Last updated - Only show if data exists */}
                {selectedPost.updated_at &&
                  selectedPost.status !== "rejected" && (
                    <div className="flex items-center gap-2 rounded-lg border border-cyan-200 bg-cyan-50 p-3 dark:border-cyan-800 dark:bg-cyan-950/30 md:gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-cyan-500 text-white md:h-10 md:w-10">
                        <RotateCcw className="h-4 w-4 md:h-5 md:w-5" />
                      </div>
                      <div className="flex-1">
                        <div className="text-xs font-medium text-cyan-600 dark:text-cyan-400">
                          Last updated
                        </div>
                        <div className="font-semibold text-cyan-900 dark:text-cyan-100">
                          {format(new Date(selectedPost.updated_at), "PPp")}
                        </div>
                      </div>
                    </div>
                  )}
                {/* Client Approval Status */}
                {(() => {
                  const clientApprovalStatus = getApprovalStatus(
                    selectedPost.is_client_approved,
                  );

                  if (clientApprovalStatus === "approved") {
                    return (
                      <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 p-3 dark:border-green-800 dark:bg-green-950/30 md:gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-500 text-white md:h-10 md:w-10">
                          <CheckCircle className="h-4 w-4 md:h-5 md:w-5" />
                        </div>
                        <div className="flex-1">
                          <div className="text-xs font-medium text-green-600 dark:text-green-400">
                            Client Approved
                          </div>
                          <div className="font-semibold text-green-900 dark:text-green-100">
                            {selectedPost.client_approved_at
                              ? format(
                                  new Date(selectedPost.client_approved_at),
                                  "PPp",
                                )
                              : "Recently approved"}
                          </div>
                        </div>
                      </div>
                    );
                  }

                  if (
                    clientApprovalStatus === "rejected" &&
                    selectedPost.status !== "published"
                  ) {
                    return (
                      <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-950/30 md:gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-500 text-white md:h-10 md:w-10">
                          <XCircle className="h-4 w-4 md:h-5 md:w-5" />
                        </div>
                        <div className="flex-1">
                          <div className="text-xs font-medium text-red-600 dark:text-red-400">
                            Client Rejected
                          </div>
                          <div className="font-semibold text-red-900 dark:text-red-100">
                            {selectedPost.client_rejected_at
                              ? format(
                                  new Date(selectedPost.client_rejected_at),
                                  "PPp",
                                )
                              : "Recently rejected"}
                          </div>
                        </div>
                      </div>
                    );
                  }

                  if (
                    clientApprovalStatus === "pending" &&
                    selectedPost.status === "pending"
                  ) {
                    return (
                      <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-950/30 md:gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-500 text-white md:h-10 md:w-10">
                          <Clock className="h-4 w-4 md:h-5 md:w-5" />
                        </div>
                        <div className="flex-1">
                          <div className="text-xs font-medium text-amber-600 dark:text-amber-400">
                            {isClient
                              ? "Approval Needed"
                              : "Awaiting Client Approval"}
                          </div>
                          <div className="font-semibold text-amber-900 dark:text-amber-100">
                            {isClient
                              ? "Waiting your approval"
                              : isModerator
                                ? "Client approval can be overridden"
                                : "No client decision yet"}
                          </div>
                        </div>
                      </div>
                    );
                  }

                  return null;
                })()}

                {/* Moderator Validation Status */}
                {(() => {
                  const moderatorValidationStatus = getValidationStatus(
                    selectedPost.is_moderator_validated,
                  );

                  if (moderatorValidationStatus === "validated") {
                    return (
                      <div className="flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-800 dark:bg-blue-950/30 md:gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500 text-white md:h-10 md:w-10">
                          <UserCheck className="h-4 w-4 md:h-5 md:w-5" />
                        </div>
                        <div className="flex-1">
                          <div className="text-xs font-medium text-blue-600 dark:text-blue-400">
                            Moderator Validated
                          </div>
                          <div className="font-semibold text-blue-900 dark:text-blue-100">
                            {selectedPost.moderator_validated_at
                              ? format(
                                  new Date(selectedPost.moderator_validated_at),
                                  "PPp",
                                )
                              : "Recently validated"}
                          </div>
                        </div>
                      </div>
                    );
                  }

                  if (moderatorValidationStatus === "rejected") {
                    return (
                      <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-950/30 md:gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-500 text-white md:h-10 md:w-10">
                          <XCircle className="h-4 w-4 md:h-5 md:w-5" />
                        </div>
                        <div className="flex-1">
                          <div className="text-xs font-medium text-red-600 dark:text-red-400">
                            Moderator Rejected
                          </div>
                          <div className="font-semibold text-red-900 dark:text-red-100">
                            {selectedPost.moderator_rejected_at
                              ? format(
                                  new Date(selectedPost.moderator_rejected_at),
                                  "PPp",
                                )
                              : "Recently rejected"}
                          </div>
                        </div>
                      </div>
                    );
                  }

                  if (
                    moderatorValidationStatus === "pending" &&
                    selectedPost.status === "pending"
                  ) {
                    return (
                      <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-800 dark:bg-gray-950/30 md:gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-500 text-white md:h-10 md:w-10">
                          <Clock className="h-4 w-4 md:h-5 md:w-5" />
                        </div>
                        <div className="flex-1">
                          <div className="text-xs font-medium text-gray-600 dark:text-gray-400">
                            {isModerator
                              ? "Validation Needed"
                              : "Awaiting Moderator Validation"}
                          </div>
                          <div className="font-semibold text-gray-900 dark:text-gray-100">
                            {isModerator
                              ? "Waiting your validation"
                              : "No moderator decision yet"}
                          </div>
                        </div>
                      </div>
                    );
                  }

                  return null;
                })()}
                {/* Feedback - Only show if post is rejected and feedback exists */}
                {selectedPost.status === "rejected" &&
                  selectedPost.feedback && (
                    <div className="col-span-full rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-950/30">
                      <div className="flex items-start gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-500 text-white md:h-10 md:w-10">
                          <AlertTriangle className="h-4 w-4 md:h-5 md:w-5" />
                        </div>
                        <div className="flex-1 space-y-2">
                          <div className="text-xs font-medium text-red-600 dark:text-red-400">
                            Rejection Feedback
                          </div>
                          <div className="rounded-md border border-red-200 bg-white/60 p-3 text-sm text-red-900 dark:bg-red-900/20 dark:text-red-100">
                            &ldquo;{selectedPost.feedback}&rdquo;
                          </div>
                          <div className="mt-4 flex items-center gap-2 text-xs text-red-700 dark:text-red-300">
                            {selectedPost.feedback_by && (
                              <div className="flex items-center gap-2">
                                <UserCheck className="h-4 w-4" />
                                <span>
                                  {selectedPost.feedback_by.full_name ||
                                    selectedPost.feedback_by.email?.split(
                                      "@",
                                    )[0] ||
                                    "Unknown User"}
                                </span>
                              </div>
                            )}
                            {selectedPost.feedback_at && (
                              <div className="flex items-center gap-2">
                                <Clock className="ml-2 h-4 w-4" />
                                <span>
                                  {format(
                                    new Date(selectedPost.feedback_at),
                                    "PPp",
                                  )}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
              </div>
            </div>

            {/* Right side - Post Preview */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 md:text-base">
                Post Preview
              </h3>

              <div className="max-h-[500px] overflow-y-scroll rounded-lg border bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-900/50 md:p-4">
                {renderPreview ? (
                  renderPreview()
                ) : (
                  <div className="text-muted-foreground py-6 text-center text-sm md:py-8">
                    No preview available
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-muted/30">
          {/* Primary Actions */}
          <div className="flex items-center justify-between gap-3">
            {/* Left side - Secondary actions */}
            <div className="flex items-center gap-2">
              {!isClient && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push(`/editPost/${selectedPost?.id}`)}
                  className="gap-2"
                >
                  <Edit3 className="h-4 w-4" />
                  Edit
                </Button>
              )}

              {!isClient && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDelete}
                  className="gap-2 border-red-500 text-red-500 hover:bg-red-500 hover:text-white dark:border-red-700 dark:hover:bg-red-800"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </Button>
              )}
            </div>

            {/* Right side - Primary actions - Only show if user is not a CM and post is not published/rejected */}
            {!isCM &&
              selectedPost.status !== "published" &&
              selectedPost.status !== "rejected" && (
                <div className="flex items-center gap-2">
                  {!isRejecting ? (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsRejecting(true)}
                        className="gap-2 border-red-500 text-red-500 hover:bg-red-500 hover:text-white dark:border-red-700 dark:hover:bg-red-800"
                      >
                        <XCircle className="h-4 w-4" />
                        Reject
                      </Button>
                      <Button
                        size="sm"
                        onClick={handleApprove}
                        className="gap-2 bg-green-600 text-white hover:bg-green-700"
                      >
                        <Check className="h-4 w-4" />
                        {currentUser?.is_client ? "Approve" : "Validate"}
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setIsRejecting(false);
                          setFeedback("");
                        }}
                        className="gap-2"
                      >
                        <X className="h-4 w-4" />
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        onClick={handleSendReject}
                        className="gap-2 bg-red-500 text-white hover:bg-red-600"
                      >
                        <XCircle className="h-4 w-4" />
                        Send Rejection
                      </Button>
                    </>
                  )}
                </div>
              )}
          </div>

          {/* Feedback area - Only show if user is not a CM and is rejecting */}
          {!isCM && isRejecting && (
            <div className="mt-4 space-y-2">
              <label
                htmlFor="reject-feedback"
                className="flex items-center gap-2 text-sm font-medium"
              >
                <MessageSquare className="h-4 w-4" />
                Feedback for the creator (optional)
              </label>
              <textarea
                id="reject-feedback"
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Explain why this post is rejected and what to change..."
                className="border-input placeholder:text-muted-foreground focus-visible:ring-ring bg-background ring-offset-background w-full resize-none rounded-md border px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                rows={2}
              />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
