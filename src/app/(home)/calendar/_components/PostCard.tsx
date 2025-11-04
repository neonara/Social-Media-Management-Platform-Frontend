"use client";

import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { isSameDay, format } from "date-fns";
import { ScheduledPost } from "@/types/post";
import { platformIcons } from "../../../../components/platformIcons";
import { UserCheck, History, Clock, CheckCircle, XCircle } from "lucide-react";
import { getApprovalStatus, getValidationStatus } from "@/utils/postWorkflow";

type Props = {
  post: ScheduledPost;
  color: string;
  onPostClick: (post: ScheduledPost) => void;
  onApprove: (postId: number) => void;
  onReject: (postId: number, feedback?: string) => void;
  canApproveReject?: boolean;
  userRole?: string;
};

const PostCard = React.memo(
  ({
    post,
    color,
    onPostClick,
    onApprove,
    onReject,
    canApproveReject = false,
    userRole,
  }: Props) => {
    const isPublished = post.status === "published";
    const isPendingAndCantApprove =
      post.status === "pending" && !canApproveReject;

    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({
      id: post.id.toString(),
      disabled: isPublished || isPendingAndCantApprove,
    });

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
    } as React.CSSProperties;

    const postDate = new Date(post.scheduled_for);
    const isToday = isSameDay(postDate, new Date());

    return (
      <div
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...(isPublished || isPendingAndCantApprove ? {} : listeners)}
        className={`mb-2 rounded-lg ${color} border border-gray-300 bg-white p-3 text-sm text-black transition-all hover:shadow-sm dark:border-gray-800 dark:bg-gray-dark dark:text-gray-1 ${
          isPublished || isPendingAndCantApprove
            ? "cursor-default opacity-75"
            : isDragging
              ? "cursor-grabbing opacity-80"
              : "cursor-grab hover:shadow-md active:cursor-grabbing"
        }`}
        title={
          isPublished
            ? "Published posts cannot be moved"
            : isPendingAndCantApprove
              ? "You don't have permission to approve/reject posts"
              : "Drag to change status"
        }
      >
        <div
          className="cursor-pointer"
          onClick={(e) => {
            e.stopPropagation();
            onPostClick(post);
          }}
        >
          <div className="flex flex-wrap justify-between gap-2">
            <span className="font-medium">{post.title}</span>
            <div className="flex items-center gap-1">
              <span className="text-xs opacity-75">
                {isToday
                  ? format(postDate, "HH:mm")
                  : format(postDate, "d MMM, HH:mm")}
              </span>
              {/* Show indicator if post was recently updated (within last 24 hours) */}
              {post.updated_at &&
                new Date(post.updated_at) >
                  new Date(Date.now() - 24 * 60 * 60 * 1000) && (
                  <div
                    title={`Last updated: ${format(new Date(post.updated_at), "PPp")}`}
                  >
                    <History className="h-4 w-4 text-blue-500" />
                  </div>
                )}
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-1">
              {platformIcons[post.platform] ||
                platformIcons[post.platform?.toLowerCase()] ||
                null}{" "}
              <span>{post.platform}</span>
            </div>
          </div>
          <div className="mt-2 flex items-center justify-between">
            {/* Show approval/validation status badges */}
            <div className="flex flex-wrap gap-1">
              {(() => {
                const clientApprovalStatus = getApprovalStatus(
                  post.is_client_approved,
                );
                const moderatorValidationStatus = getValidationStatus(
                  post.is_moderator_validated,
                );

                // Don't show status badges for published posts
                if (post.status === "published") return null;

                const badges = [];

                // Client approval status
                if (clientApprovalStatus === "approved") {
                  badges.push(
                    <span
                      key="client-approved"
                      className="flex items-center gap-1 rounded-lg bg-green-100 px-2 py-1 text-xs dark:bg-green-900/50"
                    >
                      <CheckCircle className="h-3 w-3 text-green-500" />
                      Client Approved
                    </span>,
                  );
                } else if (clientApprovalStatus === "rejected") {
                  badges.push(
                    <span
                      key="client-rejected"
                      className="flex items-center gap-1 rounded-lg bg-red-100 px-2 py-1 text-xs dark:bg-red-900/50"
                    >
                      <XCircle className="h-3 w-3 text-red-500" />
                      Client Rejected
                    </span>,
                  );
                } else if (post.status === "pending" && userRole !== "client") {
                  badges.push(
                    <span
                      key="client-pending"
                      className="flex items-center gap-1 rounded-lg bg-gray-100 px-2 py-1 text-xs dark:bg-gray-800/70"
                    >
                      <Clock className="h-3 w-3 text-gray-500" />
                      Awaiting Client
                    </span>,
                  );
                }

                // Moderator validation status
                if (moderatorValidationStatus === "validated") {
                  badges.push(
                    <span
                      key="mod-validated"
                      className="flex items-center gap-1 rounded-lg bg-blue-100 px-2 py-1 text-xs dark:bg-blue-900/50"
                    >
                      <UserCheck className="h-3 w-3 text-blue-500" />
                      Validated
                    </span>,
                  );
                } else if (moderatorValidationStatus === "rejected") {
                  badges.push(
                    <span
                      key="mod-rejected"
                      className="flex items-center gap-1 rounded-lg bg-red-100 px-2 py-1 text-xs dark:bg-red-900/50"
                    >
                      <XCircle className="h-3 w-3 text-red-500" />
                      Mod Rejected
                    </span>,
                  );
                } else if (
                  post.status === "pending" &&
                  userRole === "client" &&
                  clientApprovalStatus === "approved"
                ) {
                  badges.push(
                    <span
                      key="mod-pending"
                      className="flex items-center gap-1 rounded-lg bg-amber-100 px-2 py-1 text-xs dark:bg-amber-900/50"
                    >
                      <Clock className="h-3 w-3 text-amber-500" />
                      Awaiting Validation
                    </span>,
                  );
                }

                return badges.length > 0 ? badges : null;
              })()}
            </div>

            {/* Action buttons for pending posts */}
            {post.status === "pending" &&
              canApproveReject &&
              (() => {
                const clientApprovalStatus = getApprovalStatus(
                  post.is_client_approved,
                );
                const moderatorValidationStatus = getValidationStatus(
                  post.is_moderator_validated,
                );

                // Client can approve/reject if they haven't made a decision yet
                if (
                  userRole === "client" &&
                  clientApprovalStatus === "pending"
                ) {
                  return (
                    <div className="flex gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onApprove(post.id);
                        }}
                        className="rounded-md bg-green-500 px-3 py-1 text-xs font-medium text-white shadow-sm transition-colors hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-700"
                      >
                        Approve
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onReject(post.id);
                        }}
                        className="rounded-md bg-red-500 px-3 py-1 text-xs font-medium text-white shadow-sm transition-colors hover:bg-red-600 dark:bg-red-700 dark:hover:bg-red-800"
                      >
                        Reject
                      </button>
                    </div>
                  );
                }

                // Moderators can validate/reject if they haven't made a decision yet
                if (
                  (userRole === "admin" || userRole === "moderator") &&
                  moderatorValidationStatus === "pending"
                ) {
                  return (
                    <div className="flex gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onApprove(post.id);
                        }}
                        className="rounded-md bg-green-500 px-3 py-1 text-xs font-medium text-white shadow-sm transition-colors hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-700"
                      >
                        Validate
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onReject(post.id);
                        }}
                        className="rounded-md bg-red-500 px-3 py-1 text-xs font-medium text-white shadow-sm transition-colors hover:bg-red-600 dark:bg-red-700 dark:hover:bg-red-800"
                      >
                        Reject
                      </button>
                    </div>
                  );
                }

                return null;
              })()}
          </div>
        </div>
      </div>
    );
  },
);

PostCard.displayName = "PostCard";

export default PostCard;
