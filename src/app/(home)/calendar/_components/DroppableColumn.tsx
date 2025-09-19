"use client";

import React from "react";
import { Clock, XCircle, Calendar, CheckCircle } from "lucide-react";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useDroppable } from "@dnd-kit/core";
import PostCard from "./PostCard";
import { ScheduledPost } from "@/types/post";

type Props = {
  droppableId: string;
  title: string;
  posts: ScheduledPost[];
  bgColor: string;
  titleColor: string;
  cardColor: string;
  onPostClick: (post: ScheduledPost) => void;
  onApprove: (postId: number) => void;
  onReject: (postId: number) => void;
  canApproveReject?: boolean;
  userRole?: string;
};

const DroppableColumn = React.memo(
  ({
    droppableId,
    title,
    posts,
    bgColor,
    titleColor,
    cardColor,
    onPostClick,
    onApprove,
    onReject,
    canApproveReject = false,
    userRole,
  }: Props) => {
    const { setNodeRef, isOver } = useDroppable({ id: droppableId });

    const getStatusIcon = (title: string) => {
      switch (title) {
        case "Pending":
          return <Clock className="h-4 w-4 text-amber-600" />;
        case "Rejected":
          return <XCircle className="h-4 w-4 text-red-600" />;
        case "Scheduled":
          return <Calendar className="h-4 w-4 text-violet-700" />;
        case "Posted":
          return <CheckCircle className="h-4 w-4 text-green-600" />;
        default:
          return null;
      }
    };

    return (
      <div
        ref={setNodeRef}
        className={`rounded-lg border border-stroke ${bgColor} p-4 transition-all dark:border-dark dark:bg-gray-dark ${
          isOver ? "transform bg-primary/10 shadow-lg" : ""
        }`}
      >
        <div className="mb-6 flex justify-between">
          <h3 className={`text-lg font-semibold ${titleColor}`}>{title}</h3>
          <h2 className="text-xl text-gray-900 dark:text-gray-100">
            {posts.length}
          </h2>
        </div>
        <SortableContext
          items={posts.map((post) => post.id.toString())}
          strategy={verticalListSortingStrategy}
        >
          <div
            className={`min-h-[200px] transition-colors ${isOver ? "border-t-2 border-primary border-opacity-70 dark:border-purple-500" : "border-t-2 border-transparent"}`}
          >
            {posts.length > 0 ? (
              posts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  color={cardColor}
                  onPostClick={onPostClick}
                  onApprove={onApprove}
                  onReject={onReject}
                  canApproveReject={canApproveReject}
                  userRole={userRole}
                />
              ))
            ) : (
              <div className="flex items-center justify-center py-10 transition-all">
                {isOver ? (
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Drop here
                  </p>
                ) : (
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(title)}
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      No {title.toLowerCase()} posts.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </SortableContext>
      </div>
    );
  },
);

DroppableColumn.displayName = "DroppableColumn";

export default DroppableColumn;
