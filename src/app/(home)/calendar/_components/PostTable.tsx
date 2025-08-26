"use client";

import React, { useState } from "react";
import { toast } from "react-toastify";
import { Clock, XCircle, Calendar, CheckCircle } from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import {
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfQuarter,
  endOfQuarter,
  startOfYear,
  endOfYear,
  isSameDay,
  format,
} from "date-fns";
import DroppableColumn from "./DroppableColumn";
import { platformIcons } from "../../../../components/platformIcons";
import * as postService from "@/services/postService";
import { ScheduledPost } from "@/types/post";
import { useUser } from "@/context/UserContext";

type Props = {
  posts: ScheduledPost[];
  onRefresh: () => void;
  currentDate: Date;
  calendarView: "week" | "month" | "quarter" | "year";
  onPostClick: (post: ScheduledPost) => void;
  onDragEnd: (event: DragEndEvent) => void;
  canApproveReject?: boolean;
  onApprove?: (postId: number) => Promise<void>;
  onReject?: (postId: number) => Promise<void>;
};

const PostTable: React.FC<Props> = ({
  posts,
  onRefresh,
  currentDate,
  calendarView,
  onPostClick,
  onDragEnd,
  canApproveReject = false,
  onApprove,
  onReject,
}) => {
  const [activeId, setActiveId] = useState<string | null>(null);
  const { role } = useUser();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 15 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const filterPostsByDateRange = (post: ScheduledPost) => {
    const postDate = new Date(post.scheduled_for);

    switch (calendarView) {
      case "week": {
        const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
        const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
        return postDate >= weekStart && postDate <= weekEnd;
      }
      case "month": {
        const monthStart = startOfMonth(currentDate);
        const monthEnd = endOfMonth(currentDate);
        return postDate >= monthStart && postDate <= monthEnd;
      }
      case "quarter": {
        const quarterStart = startOfQuarter(currentDate);
        const quarterEnd = endOfQuarter(currentDate);
        return postDate >= quarterStart && postDate <= quarterEnd;
      }
      case "year": {
        const yearStart = startOfYear(currentDate);
        const yearEnd = endOfYear(currentDate);
        return postDate >= yearStart && postDate <= yearEnd;
      }
      default:
        return true;
    }
  };

  const filteredPosts = posts.filter(filterPostsByDateRange);

  const scheduledPosts = filteredPosts.filter(
    (post) => post.status === "scheduled",
  );
  const postedPosts = filteredPosts.filter(
    (post) => post.status === "published",
  );
  const pendingPosts = filteredPosts.filter(
    (post) => post.status === "pending",
  );
  const rejectedPosts = filteredPosts.filter(
    (post) => post.status === "rejected",
  );

  // Use passed functions or fallback to internal logic
  const handleApprove =
    onApprove ||
    (async (postId: number) => {
      try {
        console.log(
          `Attempting to ${role === "client" ? "approve" : "validate"} post ${postId}`,
        );

        let response;
        if (role === "client") {
          response = await postService.approvePost(postId);
        } else {
          response = await postService.moderatorValidatePost(postId);
        }

        if (response.success) {
          console.log(
            `Post ${postId} ${role === "client" ? "approved" : "validated"} successfully:`,
            response,
          );
          toast.success(
            `Post ${role === "client" ? "approved" : "validated"} successfully!`,
          );
          onRefresh(); // Trigger immediate refresh
        } else {
          console.error(
            `Failed to ${role === "client" ? "approve" : "validate"} post ${postId}:`,
            response,
          );
          toast.error(
            response.message ||
              `Failed to ${role === "client" ? "approve" : "validate"} post.`,
          );
        }
      } catch (error) {
        console.error(
          `Error ${role === "client" ? "approving" : "validating"} post:`,
          error,
        );
        toast.error(
          `Failed to ${role === "client" ? "approve" : "validate"} post.`,
        );
      }
    });

  const handleReject =
    onReject ||
    (async (postId: number) => {
      try {
        console.log(`Attempting to reject post ${postId}`);
        const response = await postService.rejectPost(postId);

        if (response.success) {
          console.log(`Post ${postId} rejected successfully:`, response);
          toast.success("Post rejected successfully!");
          onRefresh(); // Trigger immediate refresh
        } else {
          console.error(`Failed to reject post ${postId}:`, response);
          toast.error(response.message || "Failed to reject post.");
        }
      } catch (error) {
        console.error("Error rejecting post:", error);
        toast.error("Failed to reject post.");
      }
    });

  if (posts.length === 0) {
    const statusConfig = [
      {
        key: "pending",
        title: "Pending",
        bgColor: "bg-yellow-50",
        titleColor: "text-yellow-600 dark:text-yellow-300",
        icon: <Clock className="h-4 w-4 text-amber-600" />,
        count: pendingPosts.length,
      },
      {
        key: "rejected",
        title: "Rejected",
        bgColor: "bg-red-50",
        titleColor: "text-red-600 dark:text-red-300",
        icon: <XCircle className="h-4 w-4 text-red-500" />,
        count: rejectedPosts.length,
      },
      {
        key: "scheduled",
        title: "Scheduled",
        bgColor: "bg-purple-50",
        titleColor: "dark:text-primary-dark text-primary",
        icon: <Calendar className="h-4 w-4 text-violet-700" />,
        count: scheduledPosts.length,
      },
      {
        key: "posted",
        title: "Posted",
        bgColor: "bg-green-50",
        titleColor: "text-green-600 dark:text-green-500",
        icon: <CheckCircle className="h-4 w-4 text-green-500" />,
        count: postedPosts.length,
      },
    ];

    return (
      <div className="grid grid-cols-4 gap-4">
        {statusConfig.map((status) => (
          <div
            key={status.key}
            className={`min-h-[240px] rounded-lg border border-stroke ${status.bgColor} p-4 dark:border-dark-3 dark:bg-gray-dark`}
          >
            <div className="mb-6 flex justify-between">
              <h3 className={`text-lg font-semibold ${status.titleColor}`}>
                {status.title}
              </h3>
              <h2 className="text-xl text-gray-900 dark:text-gray-100">
                {status.count}
              </h2>
            </div>
            <div className="flex items-center justify-center py-10">
              <div className="flex items-center space-x-2">
                {status.icon}
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  No {status.title.toLowerCase()} posts.
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    onDragEnd(event);
  };

  const activePost = activeId
    ? posts.find((post) => post.id.toString() === activeId)
    : null;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="grid grid-cols-4 gap-4">
        <DroppableColumn
          key="pending-column"
          droppableId="pending"
          title="Pending"
          posts={pendingPosts}
          bgColor="bg-yellow-50 dark:bg-yellow-900 dark:bg-opacity-30"
          titleColor="text-yellow-600 dark:text-yellow-500"
          cardColor="hover:bg-yellow-100 dark:bg-yellow-900 dark:hover:bg-yellow-800"
          onPostClick={onPostClick}
          onApprove={handleApprove}
          onReject={handleReject}
          canApproveReject={canApproveReject}
          userRole={role}
        />

        <DroppableColumn
          key="rejected-column"
          droppableId="rejected"
          title="Rejected"
          posts={rejectedPosts}
          bgColor="bg-red-50 dark:bg-red-900 dark:bg-opacity-20"
          titleColor="text-red-600 dark:text-red-700"
          cardColor="hover:bg-red-100 dark:bg-red-900 dark:hover:bg-red-800"
          onPostClick={onPostClick}
          onApprove={handleApprove}
          onReject={handleReject}
          canApproveReject={canApproveReject}
          userRole={role}
        />

        <DroppableColumn
          key="scheduled-column"
          droppableId="scheduled"
          title="Scheduled"
          posts={scheduledPosts}
          bgColor="bg-purple-50 dark:bg-purple-950 dark:bg-opacity-30"
          titleColor="dark:text-primary-dark text-primary"
          cardColor="hover:bg-blue-100 dark:bg-blue-900 dark:hover:bg-blue-800"
          onPostClick={onPostClick}
          onApprove={handleApprove}
          onReject={handleReject}
          canApproveReject={canApproveReject}
          userRole={role}
        />

        <DroppableColumn
          key="published-column"
          droppableId="published"
          title="Posted"
          posts={postedPosts}
          bgColor="bg-green-50 dark:bg-green-900 dark:bg-opacity-30"
          titleColor="text-green-600 dark:text-green-500"
          cardColor="hover:bg-green-100 dark:bg-green-800 dark:hover:bg-green-900"
          onPostClick={onPostClick}
          onApprove={handleApprove}
          onReject={handleReject}
          canApproveReject={canApproveReject}
          userRole={role}
        />
      </div>

      <DragOverlay>
        {activePost ? (
          <div className="mb-2 scale-105 transform cursor-grabbing rounded-lg bg-blue-50 p-3 text-sm opacity-85 shadow-lg ring-2 ring-primary ring-opacity-30 dark:bg-purple-900 dark:text-blue-50">
            <div className="flex flex-wrap justify-between gap-2">
              <span className="font-medium">{activePost.title}</span>
              <span className="text-xs opacity-75">
                {isSameDay(new Date(activePost.scheduled_for), new Date())
                  ? format(new Date(activePost.scheduled_for), "HH:mm")
                  : format(new Date(activePost.scheduled_for), "d MMM, HH:mm")}
              </span>
            </div>
            <div className="mt-3 flex items-center gap-2 text-xs">
              {platformIcons[activePost.platform] ||
                platformIcons[activePost.platform?.toLowerCase()] ||
                null}{" "}
              <span>{activePost.platform}</span>
            </div>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};

export default PostTable;
