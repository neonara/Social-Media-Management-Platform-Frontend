"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  format,
  isSameDay,
  isSameMonth,
  startOfWeek,
  endOfWeek,
  addWeeks,
  addDays,
  eachDayOfInterval,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  startOfQuarter,
  endOfQuarter,
  addMonths,
  subMonths,
  subQuarters,
  addQuarters,
  subYears,
  addYears,
} from "date-fns";
import {
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  RefreshCw,
} from "lucide-react";
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
  useDroppable,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import * as postService from "@/services/postService";
import * as moderatorsService from "@/services/moderatorsService";
import { getCurrentUser } from "@/services/userService";
import { useRouter } from "next/navigation";
import {
  usePostWebSocket,
  PostWebSocketMessage,
} from "@/hooks/usePostWebSocket";
import { FaFacebook, FaInstagram, FaLinkedin } from "react-icons/fa";
import { toast } from "react-toastify";
import { SocialPage } from "@/types/social-page";
import { GetUser } from "@/types/user";
import {
  FacebookPostPreview,
  InstagramPostPreview,
  LinkedinPostPreview,
} from "../preview-post";
import UserPresence from "../UserPresence/UserPresence";
import Link from "next/link";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { Button } from "../ui/button";

interface ScheduledPost {
  id: string;
  title: string;
  platform: "Facebook" | "Instagram" | "LinkedIn";
  platformPage: SocialPage;
  mediaFiles?: Array<{ id: string; preview: string }>;
  media?: Array<{
    id: number;
    file: string;
    name: string;
    uploaded_at: string;
    file_type: string;
  }>;
  description: string;
  scheduled_for: string;
  status?: "published" | "scheduled" | "failed" | "pending" | "rejected";
  creator?: Partial<GetUser> & {
    id: string;
    full_name: string;
    type?: "client" | "team_member";
  };
  client?: Partial<GetUser> & {
    id: string;
    full_name: string;
  };
}

// Global platform icons - used throughout the component
const platformIcons = {
  Facebook: <FaFacebook className="text-blue-600 dark:text-blue-300" />,
  Instagram: <FaInstagram className="text-pink-500 dark:text-pink-300" />,
  LinkedIn: <FaLinkedin className="text-blue-700 dark:text-blue-300" />,
};

// Draggable Post Card Component
const PostCard = React.memo(
  ({
    post,
    color,
    onPostClick,
    onApprove,
    onReject,
    canApproveReject = false,
  }: {
    post: ScheduledPost;
    color: string;
    onPostClick: (post: ScheduledPost) => void;
    onApprove: (postId: string) => void;
    onReject: (postId: string) => void;
    canApproveReject?: boolean;
  }) => {
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
      id: post.id,
      disabled: isPublished || isPendingAndCantApprove, // Disable dragging for published posts and pending posts for CMs
    });

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
    };

    const postDate = new Date(post.scheduled_for);
    const isToday = isSameDay(postDate, new Date());

    return (
      <div
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...(isPublished || isPendingAndCantApprove ? {} : listeners)} // Only add listeners if dragging is allowed
        className={`mb-2 rounded-lg ${color} border border-gray-300 bg-white p-3 text-sm text-black transition-all hover:shadow-sm dark:border-gray-800 dark:bg-gray-dark dark:text-gray-1 ${
          isPublished || isPendingAndCantApprove
            ? "cursor-default opacity-75" // Published posts and restricted pending posts are not draggable
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
        {/* Clickable content area */}
        <div
          className="cursor-pointer"
          onClick={(e) => {
            e.stopPropagation();
            onPostClick(post);
          }}
        >
          <div className="flex flex-wrap justify-between gap-2">
            <span className="font-medium">{post.title}</span>
            <span className="text-xs opacity-75">
              {isToday
                ? format(postDate, "HH:mm")
                : format(postDate, "d MMM, HH:mm")}
            </span>
          </div>
          <div className="mt-3 flex items-center gap-2 text-xs">
            {platformIcons[post.platform]} <span>{post.platform}</span>
          </div>

          {post.status === "pending" && canApproveReject && (
            <div className="mt-2 flex gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onApprove(post.id);
                }}
                className="rounded-md bg-green-500 px-3 py-1 text-xs font-medium text-white shadow-sm transition-colors dark:bg-green-600 dark:hover:bg-green-700"
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
          )}

          {post.status === "pending" && !canApproveReject && (
            <div className="mt-2">
              <span className="inline-block rounded-full bg-orange-100 px-2 py-1 text-xs font-medium text-orange-800 dark:bg-orange-900 dark:text-orange-200">
                ⏳ Awaiting approval
              </span>
            </div>
          )}

          {isPublished && (
            <div className="mt-2">
              <span className="inline-block rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800 dark:bg-green-900 dark:text-green-200">
                📱 Published
              </span>
            </div>
          )}
        </div>
      </div>
    );
  },
);

PostCard.displayName = "PostCard";

// Droppable Column Component
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
  }: {
    droppableId: string;
    title: string;
    posts: ScheduledPost[];
    bgColor: string;
    titleColor: string;
    cardColor: string;
    onPostClick: (post: ScheduledPost) => void;
    onApprove: (postId: string) => void;
    onReject: (postId: string) => void;
    canApproveReject?: boolean;
  }) => {
    const { setNodeRef, isOver } = useDroppable({
      id: droppableId,
    });

    return (
      <div
        ref={setNodeRef}
        className={`rounded-lg border border-stroke ${bgColor} p-4 transition-all dark:border-dark dark:bg-gray-dark ${
          isOver ? "transform bg-primary/10 shadow-lg" : ""
        }`}
      >
        <h3 className={`mb-4 text-lg font-semibold ${titleColor}`}>
          {title} ({posts.length})
        </h3>
        <SortableContext
          items={posts.map((post) => post.id)}
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
                />
              ))
            ) : (
              <div className="flex items-center justify-center py-8 transition-all">
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {isOver ? "Drop here" : `No ${title.toLowerCase()} posts.`}
                </p>
              </div>
            )}
          </div>
        </SortableContext>
      </div>
    );
  },
);

DroppableColumn.displayName = "DroppableColumn";

const PostTable = ({
  posts,
  onRefresh,
  currentDate,
  calendarView,
  onPostClick,
  onDragEnd,
  canApproveReject = false,
}: {
  posts: ScheduledPost[];
  onRefresh: () => void;
  currentDate: Date;
  calendarView: "week" | "month" | "quarter" | "year";
  onPostClick: (post: ScheduledPost) => void;
  onDragEnd: (event: DragEndEvent) => void;
  canApproveReject?: boolean;
}) => {
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 15, // Increased distance to prevent accidental drags during clicks
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  // Filter posts based on the current calendar view and date
  const filterPostsByDateRange = (post: ScheduledPost) => {
    const postDate = new Date(post.scheduled_for);

    switch (calendarView) {
      case "week": {
        const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 }); // Week starts on Monday
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

  // Apply the filter and then group by status
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

  // Rest of your component remains the same...
  const handleApprove = async (postId: string) => {
    try {
      await postService.approvePost(parseInt(postId));
      toast.success("Post approved successfully!");
      onRefresh();
    } catch (error) {
      console.error("Error approving post:", error);
      toast.error("Failed to approve post.");
    }
  };

  const handleReject = async (postId: string) => {
    try {
      await postService.rejectPost(parseInt(postId));
      toast.success("Post rejected successfully!");
      onRefresh();
    } catch (error) {
      console.error("Error rejecting post:", error);
      toast.error("Failed to reject post.");
    }
  };

  // Don't render drag and drop if we don't have posts
  if (posts.length === 0) {
    return (
      <div className="grid grid-cols-4 gap-4">
        <div className="rounded-lg border border-stroke bg-yellow-50 p-4 dark:border-dark-3 dark:bg-gray-dark">
          <h3 className="mb-4 text-lg font-semibold text-yellow-600 dark:text-yellow-300">
            Pending (0)
          </h3>
          <div className="flex min-h-[200px] items-center justify-center">
            <p className="text-sm text-gray-600 dark:text-gray-300">
              No pending posts.
            </p>
          </div>
        </div>
        <div className="rounded-lg border border-stroke bg-red-50 p-4 dark:border-dark-3 dark:bg-gray-dark">
          <h3 className="mb-4 text-lg font-semibold text-red-600 dark:text-red-300">
            Rejected (0)
          </h3>
          <div className="flex min-h-[200px] items-center justify-center">
            <p className="text-sm text-gray-600 dark:text-gray-300">
              No rejected posts.
            </p>
          </div>
        </div>
        <div className="rounded-lg border border-stroke bg-purple-50 p-4 dark:border-dark-3 dark:bg-gray-dark">
          <h3 className="dark:text-primary-dark mb-4 text-lg font-semibold text-primary">
            Scheduled (0)
          </h3>
          <div className="flex min-h-[200px] items-center justify-center">
            <p className="text-sm text-gray-600 dark:text-gray-300">
              No scheduled posts.
            </p>
          </div>
        </div>
        <div className="rounded-lg border border-stroke bg-green-50 p-4 dark:border-dark-3 dark:bg-gray-dark">
          <h3 className="mb-4 text-lg font-semibold text-green-600 dark:text-green-500">
            Posted (0)
          </h3>
          <div className="flex min-h-[200px] items-center justify-center">
            <p className="text-sm text-gray-600 dark:text-gray-300">
              No posted posts.
            </p>
          </div>
        </div>
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

  // Find the active post for the drag overlay
  const activePost = activeId
    ? posts.find((post) => post.id === activeId)
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
        />
      </div>

      <Link href="/content" className="m-auto block w-fit">
        <button
          type="button"
          className="mx-auto mb-2.5 mt-4 flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-primary px-18 py-4 text-lg font-medium text-white transition hover:bg-opacity-90 disabled:opacity-80"
        >
          Create New Post
        </button>
      </Link>

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
              {platformIcons[activePost.platform]}{" "}
              <span>{activePost.platform}</span>
            </div>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};

// ContentDashboard component (currently unused but kept for future use)
// const ContentDashboard = () => (
<div className="p-4">
  <div className="mb-6 flex gap-4">
    {["Facebook", "Instagram", "LinkedIn"].map((platform) => (
      <button
        key={platform}
        className="dark:bg-primary-dark flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-white"
      >
        {platformIcons[platform as keyof typeof platformIcons]}
      </button>
    ))}
  </div>

  <div className="mb-6 rounded-lg border border-stroke p-4 dark:border-dark-3">
    <h3 className="mb-4 text-lg font-semibold dark:text-white">
      Content Approval Status
    </h3>
    <div className="grid grid-cols-3 gap-4">
      {["Scheduled", "Pending Approval", "Approved"].map((status) => (
        <div
          key={status}
          className="dark:bg-gray-dark-1 rounded-lg bg-gray-1 p-4"
        >
          <div className="text-sm font-medium text-dark dark:text-white">
            {status}
          </div>
          <div className="dark:text-primary-dark text-2xl font-bold text-primary">
            {Math.floor(Math.random() * 20)}
          </div>
        </div>
      ))}
    </div>
  </div>

  <div className="grid grid-cols-3 gap-4">
    {["Repurpose Content", "New Ideas", "Get Inspired"].map((action, idx) => (
      <div
        key={idx}
        className="cursor-pointer rounded-lg border border-stroke p-4 transition-all hover:shadow-md dark:border-dark-3"
      >
        <h4 className="mb-2 font-medium text-dark dark:text-white">{action}</h4>
        <p className="text-sm text-gray-600 dark:text-gray-300">
          {action === "Repurpose Content"
            ? "Reuse top-performing posts"
            : "Generate new content ideas"}
        </p>
      </div>
    ))}
  </div>
</div>;

const CalendarBox = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarView, setCalendarView] = useState<
    "week" | "month" | "quarter" | "year"
  >("week");
  const [activeTab, setActiveTab] = useState<"calendar" | "post_table">(
    "calendar",
  );
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [searchYear, setSearchYear] = useState<string>("");
  const [scheduledPosts, setScheduledPosts] = useState<ScheduledPost[]>([]);
  const [allPosts, setAllPosts] = useState<ScheduledPost[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [selectedPost, setSelectedPost] = useState<ScheduledPost | null>(null);
  const [filterCreator, setFilterCreator] = useState<string | null>(null);
  const [filterClient, setFilterClient] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [assignedCMs, setAssignedCMs] = useState<GetUser[]>([]);
  const [loadingCMs, setLoadingCMs] = useState(false);
  const [currentUser, setCurrentUser] = useState<GetUser | null>(null);
  // Feedback modal state
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackText, setFeedbackText] = useState("");
  const [pendingRejection, setPendingRejection] = useState<{
    postId: string;
    postTitle: string;
  } | null>(null);
  // Multi-post selection modal state
  const [showMultiPostModal, setShowMultiPostModal] = useState(false);
  const [selectedDayPosts, setSelectedDayPosts] = useState<ScheduledPost[]>([]);
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  // const frenchDays = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"]; // Unused variable
  const router = useRouter();

  // Check if current user can approve/reject posts (only moderators and admins)
  const canApproveReject =
    currentUser?.role === "moderator" ||
    currentUser?.role === "administrator" ||
    currentUser?.role === "super_administrator";

  // WebSocket integration for real-time updates
  const handleWebSocketMessage = useCallback(
    (message: PostWebSocketMessage) => {
      console.log("WebSocket message received:", message);
      console.log("Message type:", message.type, "Action:", message.action);

      // Handle the message based on the type (which comes from our signal's type field)
      switch (message.type) {
        case "post_updated":
          // Check the action to determine what kind of update this is
          if (message.action === "created" && message.data) {
            console.log("New post created:", message.data);
            setScheduledPosts((prev) => [
              ...prev,
              message.data as unknown as ScheduledPost,
            ]);
            toast.success("New post created!");
          } else if (
            message.action === "updated" &&
            message.data &&
            message.post_id
          ) {
            console.log("Post updated:", message.data);
            setScheduledPosts((prev) =>
              prev.map((p) =>
                p.id === message.post_id
                  ? (message.data as unknown as ScheduledPost)
                  : p,
              ),
            );
            toast.info("Post updated!");
          } else if (message.action === "deleted" && message.post_id) {
            console.log("Post deleted:", message.post_id);
            setScheduledPosts((prev) =>
              prev.filter((p) => p.id !== message.post_id),
            );
            toast.info("Post deleted!");
          } else if (
            message.action === "status_changed" &&
            message.data &&
            message.post_id
          ) {
            console.log(
              `Post ${message.post_id} status changed from ${message.old_status} to ${message.new_status}`,
            );
            setScheduledPosts((prev) =>
              prev.map((p) =>
                p.id === message.post_id
                  ? (message.data as unknown as ScheduledPost)
                  : p,
              ),
            );
            // Only show toast if this update is from another user
            if (message.user_id !== "self") {
              toast.success(`Post status changed to ${message.new_status}!`);
            }
          }
          break;

        case "connection_established":
          console.log("WebSocket connection established for post updates");
          break;

        case "error":
          console.error("WebSocket error:", message.message);
          toast.error("WebSocket error occurred");
          break;
      }
    },
    [], // Remove the dependency that was causing infinite re-renders
  );

  usePostWebSocket(handleWebSocketMessage);

  const fetchAssignedCMs = useCallback(async () => {
    setLoadingCMs(true);
    try {
      const result = await moderatorsService.getAssignedCommunityManagers();
      if (Array.isArray(result)) {
        setAssignedCMs(result);
      } else {
        console.error("Error fetching assigned CMs:", result.error);
        setAssignedCMs([]);
      }
    } catch (error) {
      console.error("Error fetching assigned CMs:", error);
      setAssignedCMs([]);
    } finally {
      setLoadingCMs(false);
    }
  }, []);

  const fetchCurrentUser = useCallback(async () => {
    try {
      const user = await getCurrentUser();
      setCurrentUser(user);
    } catch (error) {
      console.error("Error fetching current user:", error);
      setCurrentUser(null);
    }
  }, []);

  const fetchScheduledPosts = useCallback(
    async (
      creatorFilter?: string | null,
      statusFilter?: string | null,
      clientFilter?: string | null,
    ) => {
      setLoadingPosts(true);
      try {
        const posts =
          (await postService.getScheduledPosts()) as ScheduledPost[];

        console.log("Current user:", currentUser);
        console.log("Total posts fetched:", posts.length);
        console.log("Assigned CMs:", assignedCMs);

        // Format all posts first
        const allPostsFormatted = posts.map((post) => ({
          ...post,
          creator: post.creator
            ? {
                ...post.creator,
                type: post.creator.type as "client" | "team_member",
              }
            : undefined,
        }));

        // Filter posts to only include those from assigned CMs, the moderator, or posts for the current client
        const authorizedPosts = allPostsFormatted.filter((post) => {
          // Check if creator is an assigned CM
          const isAssignedCM = assignedCMs.some(
            (cm) => cm.full_name === post.creator?.full_name,
          );

          // Check if creator is the current moderator
          const isModerator =
            currentUser && post.creator?.full_name === currentUser.full_name;

          // Check if the current user is the client for this post (using email for better matching)
          const isClient =
            currentUser &&
            post.client &&
            (post.client.email === currentUser.email ||
              post.client.full_name === currentUser.full_name ||
              post.client.id === currentUser.id);

          // Debug logging for client posts
          if (currentUser && post.client) {
            console.log("Checking client post:", {
              postId: post.id,
              postTitle: post.title,
              clientEmail: post.client.email,
              clientFullName: post.client.full_name,
              clientId: post.client.id,
              currentUserEmail: currentUser.email,
              currentUserFullName: currentUser.full_name,
              currentUserId: currentUser.id,
              isClient: isClient,
            });
          }

          return isAssignedCM || isModerator || isClient;
        });

        console.log("Authorized posts:", authorizedPosts.length);
        console.log("Filtered posts breakdown:", {
          assignedCMPosts: authorizedPosts.filter((post) =>
            assignedCMs.some((cm) => cm.full_name === post.creator?.full_name),
          ).length,
          moderatorPosts: authorizedPosts.filter(
            (post) =>
              currentUser && post.creator?.full_name === currentUser.full_name,
          ).length,
          clientPosts: authorizedPosts.filter(
            (post) =>
              currentUser &&
              post.client &&
              (post.client.email === currentUser.email ||
                post.client.full_name === currentUser.full_name ||
                post.client.id === currentUser.id),
          ).length,
        });

        setAllPosts(authorizedPosts);

        // Apply additional filters for display
        const filteredPosts = authorizedPosts.filter((post) => {
          const matchesCreator = creatorFilter
            ? post.creator?.full_name === creatorFilter
            : true;
          const matchesStatus = statusFilter
            ? post.status === statusFilter
            : true;
          const matchesClient = clientFilter
            ? post.client?.full_name === clientFilter
            : true;
          return matchesCreator && matchesStatus && matchesClient;
        });

        setScheduledPosts(filteredPosts);
      } catch (error) {
        console.error("Error fetching scheduled posts:", error);
      } finally {
        setLoadingPosts(false);
      }
    },
    [assignedCMs, currentUser],
  );

  useEffect(() => {
    fetchAssignedCMs();
    fetchCurrentUser();
  }, [fetchAssignedCMs, fetchCurrentUser]);

  useEffect(() => {
    fetchScheduledPosts(filterCreator, filterStatus, filterClient);
  }, [
    fetchScheduledPosts,
    filterCreator,
    filterStatus,
    filterClient,
    currentDate,
    calendarView,
  ]);

  const navigateToView = (date: Date, view: typeof calendarView) => {
    setCurrentDate(date);
    setCalendarView(view);
    setSelectedDate(date);
  };

  const goToPrevious = () => {
    setCurrentDate((prev) => {
      switch (calendarView) {
        case "week":
          return addWeeks(prev, -1);
        case "month":
          return subMonths(prev, 1); // Use subMonths instead of setMonth
        case "quarter":
          return subQuarters(prev, 1); // Use subQuarters instead of setMonth
        case "year":
          return subYears(prev, 1); // Use subYears instead of setFullYear
        default:
          return prev;
      }
    });
  };

  const goToNext = () => {
    setCurrentDate((prev) => {
      switch (calendarView) {
        case "week":
          return addWeeks(prev, 1);
        case "month":
          return addMonths(prev, 1); // Use addMonths instead of setMonth
        case "quarter":
          return addQuarters(prev, 1); // Use addQuarters instead of setMonth
        case "year":
          return addYears(prev, 1); // Use addYears instead of setFullYear
        default:
          return prev;
      }
    });
  };

  const goToToday = () => {
    const now = new Date();
    setCurrentDate(now);
    setSelectedDate(now);
    setCalendarView("week");
  };

  const handleSearchYear = () => {
    const year = parseInt(searchYear, 10);
    if (!isNaN(year)) {
      const newDate = startOfYear(new Date(year, 0, 1));
      navigateToView(newDate, "year");
    }
  };

  const renderCalendarHeader = () => {
    switch (calendarView) {
      case "week": {
        const start = startOfWeek(currentDate, { weekStartsOn: 1 });
        const end = endOfWeek(currentDate, { weekStartsOn: 1 });
        return `${format(start, "d MMM")} - ${format(end, "d MMM yyyy")}`;
      }
      case "month":
        return format(currentDate, "MMMM yyyy");
      case "quarter":
        return `${format(startOfQuarter(currentDate), "MMMM yyyy")} - ${format(endOfQuarter(currentDate), "MMMM yyyy")}`;
      case "year":
        return format(currentDate, "yyyy");
      default:
        return "";
    }
  };

  const CalendarGridView = () => {
    switch (calendarView) {
      case "week": {
        const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
        const days = eachDayOfInterval({
          start: weekStart,
          end: addDays(weekStart, 6),
        });

        return (
          <div className="flex h-[600px] border-t border-stroke dark:border-dark-3">
            <div className="w-32 border-r border-stroke dark:border-dark-3">
              {days.map((day, index) => (
                <div
                  key={index}
                  onClick={() => {
                    setSelectedDate(day);
                  }}
                  className={`h-24 cursor-pointer p-3 text-center transition-colors ${
                    isSameDay(day, new Date())
                      ? "dark:text-primary-dark bg-primary/10 text-primary"
                      : "text-dark dark:text-white"
                  } ${
                    isSameDay(day, selectedDate)
                      ? "dark:border-primary-dark border-2 border-primary bg-primary/5"
                      : "hover:bg-gray-100 dark:hover:bg-dark-2"
                  }`}
                >
                  <div className="text-sm font-medium">
                    {format(day, "EEE")}
                  </div>
                  <div className="mt-1 text-2xl font-bold">
                    {format(day, "d")}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex-1 overflow-auto">
              <div className="relative">
                {Array.from({ length: 24 }).map((_, hour) => (
                  <div
                    key={hour}
                    className="h-24 border-b border-stroke dark:border-dark-3"
                  >
                    <div className="flex h-full items-center px-4">
                      <div className="w-16 text-sm text-gray-500 dark:text-gray-400">
                        {format(new Date().setHours(hour), "HH:mm")}
                      </div>
                      <div className="ml-4 h-16 w-full">
                        {scheduledPosts
                          .filter((post) => {
                            const postDate = new Date(post.scheduled_for);
                            return (
                              isSameDay(postDate, selectedDate) &&
                              postDate.getHours() === hour && // Compare with the current grid hour
                              (post.status === "scheduled" ||
                                post.status === "published")
                            );
                          })
                          .map((post) => (
                            <div
                              key={post.id}
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedPost(post);
                              }}
                              className={`mb-2 flex cursor-pointer items-center gap-2 rounded-lg p-2 text-sm transition-all ${
                                post.status === "published"
                                  ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                                  : "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                              } hover:shadow-md`}
                            >
                              {/* Icon */}
                              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-primary dark:bg-gray-700">
                                {post.status === "published" ? (
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-4 w-4"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M5 13l4 4L19 7"
                                    />
                                  </svg>
                                ) : (
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-4 w-4"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M8 16l-4-4m0 0l4-4m-4 4h16"
                                    />
                                  </svg>
                                )}
                              </div>

                              {/* Post Title and Platform */}
                              <div className="flex w-full items-center justify-between">
                                <div className="flex-1 truncate">
                                  <span className="font-medium">
                                    {post.title}
                                  </span>
                                </div>
                                <div
                                  className={`flex items-center gap-2 rounded-full px-2 py-1 text-xs font-semibold ${
                                    post.platform === "Facebook"
                                      ? "bg-blue-200 text-blue-800 dark:bg-blue-800 dark:text-blue-200"
                                      : post.platform === "Instagram"
                                        ? "bg-pink-200 text-pink-800 dark:bg-pink-800 dark:text-pink-200"
                                        : "bg-gray-200 text-gray-800 dark:bg-gray-800 dark:text-gray-200"
                                  }`}
                                >
                                  {platformIcons[post.platform]}
                                </div>
                              </div>

                              {/* Edit Button */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  router.push(`/editPost/${post.id}`);
                                }}
                                className="hover:bg-primary-dark ml-2 rounded-md bg-primary px-2 py-1 text-xs font-medium text-white shadow-sm focus:outline-none"
                              >
                                Edit
                              </button>
                            </div>
                          ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      }
      case "month": {
        const firstDayOfMonth = startOfMonth(currentDate);
        const lastDayOfMonth = endOfMonth(currentDate);
        const allDaysInMonth = eachDayOfInterval({
          start: firstDayOfMonth,
          end: lastDayOfMonth,
        });
        const daysBefore = Array(firstDayOfMonth.getDay()).fill(null);
        const totalDays = [...daysBefore, ...allDaysInMonth];

        return (
          <tbody>
            {Array.from({ length: Math.ceil(totalDays.length / 7) }).map(
              (_, weekIndex) => (
                <tr key={weekIndex} className="grid grid-cols-7">
                  {totalDays
                    .slice(weekIndex * 7, (weekIndex + 1) * 7)
                    .map((day, dayIndex) => (
                      <td
                        key={dayIndex}
                        onClick={() => day && navigateToView(day, "week")}
                        className={`relative h-32 cursor-pointer border border-stroke p-2 transition-colors dark:border-dark-3 md:p-3 ${
                          !day
                            ? "bg-gray-1 dark:bg-dark-2"
                            : "hover:bg-gray-2 dark:hover:bg-dark-2"
                        } ${
                          day && isSameDay(day, new Date())
                            ? "dark:bg-primary-dark/20 bg-primary/10"
                            : ""
                        } ${
                          day && isSameDay(day, selectedDate)
                            ? "dark:border-primary-dark border-2 border-primary"
                            : ""
                        }`}
                      >
                        {day && (
                          <>
                            <span className="block font-medium text-dark dark:text-white">
                              {format(day, "d")}
                            </span>
                            <div className="mt-1 space-y-1">
                              {scheduledPosts
                                .filter((post) =>
                                  isSameDay(new Date(post.scheduled_for), day),
                                )
                                .slice(0, 2) // Limit to 2 posts per day
                                .map((post) => (
                                  <div
                                    key={post.id}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedPost(post);
                                    }}
                                    className={`h-6 cursor-pointer truncate rounded px-2 py-1 text-xs ${
                                      new Date(post.scheduled_for) < new Date()
                                        ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                                        : "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                                    }`}
                                  >
                                    {post.title}
                                  </div>
                                ))}
                            </div>
                          </>
                        )}
                      </td>
                    ))}
                </tr>
              ),
            )}
          </tbody>
        );
      }

      case "quarter": {
        return (
          <div className="grid grid-cols-3 gap-4 p-4">
            {Array.from({ length: 3 }).map((_, monthOffset) => {
              const monthDate = addMonths(
                startOfQuarter(currentDate),
                monthOffset,
              );

              return (
                <div
                  key={monthOffset}
                  className="dark:bg-gray-dark-1 rounded-lg border border-stroke bg-gray-1 p-4 shadow-sm transition-all hover:shadow-md dark:border-dark-3 dark:bg-dark-3"
                  onClick={() => navigateToView(monthDate, "month")}
                >
                  <h3 className="mb-3 text-center font-semibold dark:text-white">
                    {format(monthDate, "MMMM")}
                  </h3>
                  <div className="grid grid-cols-7 gap-1">
                    {/* Day headers */}
                    {["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"].map(
                      (dayName) => (
                        <div
                          key={dayName}
                          className="h-6 text-center text-xs font-medium text-gray-500 dark:text-gray-400"
                        >
                          {dayName}
                        </div>
                      ),
                    )}

                    {/* Calendar days */}
                    {(() => {
                      const monthStart = startOfMonth(monthDate);
                      const firstDay = monthStart.getDay();
                      const startOffset = firstDay === 0 ? 6 : firstDay - 1; // Adjust for Monday start

                      // Get all days to display (previous month + current month + next month to fill grid)
                      const startDate = addDays(monthStart, -startOffset);
                      const endDate = addDays(startDate, 41); // 6 weeks * 7 days = 42 days

                      return eachDayOfInterval({
                        start: startDate,
                        end: endDate,
                      }).map((day, i) => {
                        const isCurrentMonth = isSameMonth(day, monthDate);
                        const dayPosts = scheduledPosts.filter((post) =>
                          isSameDay(new Date(post.scheduled_for), day),
                        );

                        return (
                          <div
                            key={i}
                            className={`relative flex h-8 cursor-pointer items-center justify-center rounded text-sm ${
                              isSameDay(day, new Date())
                                ? "dark:bg-primary-dark bg-primary text-white"
                                : isCurrentMonth && dayPosts.length > 0
                                  ? "bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-800 dark:text-green-200 dark:hover:bg-green-700"
                                  : isCurrentMonth
                                    ? "text-dark hover:bg-gray-2 dark:text-white dark:hover:bg-dark-2"
                                    : "text-gray-400 dark:text-gray-600"
                            }`}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (isCurrentMonth && dayPosts.length > 0) {
                                if (dayPosts.length === 1) {
                                  setSelectedPost(dayPosts[0]);
                                } else {
                                  // Show multi-post modal
                                  setSelectedDayPosts(dayPosts);
                                  setSelectedDay(day);
                                  setShowMultiPostModal(true);
                                }
                              }
                            }}
                          >
                            <span className="text-xs">{format(day, "d")}</span>
                            {isCurrentMonth && dayPosts.length > 1 && (
                              <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
                                {dayPosts.length}
                              </span>
                            )}
                          </div>
                        );
                      });
                    })()}
                  </div>
                </div>
              );
            })}
          </div>
        );
      }

      case "year": {
        return (
          <table className="w-full">
            <tbody>
              {[0, 1, 2, 3].map((row) => (
                <tr
                  key={row}
                  className="border-b border-stroke last:border-b-0 dark:border-dark-3"
                >
                  {[0, 1, 2].map((col) => {
                    const monthIndex = row * 3 + col;
                    if (monthIndex >= 12) return null;

                    const monthDate: Date = addMonths(
                      startOfYear(currentDate),
                      monthIndex,
                    );

                    function isSameMonth(date1: Date, date2: Date): boolean {
                      return (
                        date1.getFullYear() === date2.getFullYear() &&
                        date1.getMonth() === date2.getMonth()
                      );
                    }

                    return (
                      <td
                        key={monthIndex}
                        className="w-1/4 p-4 align-top hover:bg-gray-2 dark:hover:bg-dark-2"
                        onClick={() => navigateToView(monthDate, "month")}
                      >
                        <div
                          className={`mb-2 text-center font-medium ${
                            isSameMonth(new Date(), monthDate)
                              ? "dark:text-primary-dark text-primary"
                              : "text-dark dark:text-white"
                          }`}
                        >
                          {format(monthDate, "MMMM")}
                        </div>
                        <div className="grid grid-cols-7 gap-1">
                          {/* Day headers */}
                          {["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"].map(
                            (dayName) => (
                              <div
                                key={dayName}
                                className="h-6 text-center text-xs font-medium text-gray-500 dark:text-gray-400"
                              >
                                {dayName}
                              </div>
                            ),
                          )}

                          {/* Calendar days */}
                          {(() => {
                            const monthStart = startOfMonth(monthDate);
                            const firstDay = monthStart.getDay();
                            const startOffset =
                              firstDay === 0 ? 6 : firstDay - 1; // Adjust for Monday start

                            // Get all days to display (previous month + current month + next month to fill grid)
                            const startDate = addDays(monthStart, -startOffset);
                            const endDate = addDays(startDate, 41); // 6 weeks * 7 days = 42 days

                            return eachDayOfInterval({
                              start: startDate,
                              end: endDate,
                            }).map((day, i) => {
                              const isCurrentMonth = isSameMonth(
                                day,
                                monthDate,
                              );
                              const isToday = isSameDay(day, new Date());
                              const dayPosts = scheduledPosts.filter((post) =>
                                isSameDay(new Date(post.scheduled_for), day),
                              );

                              return (
                                <div
                                  key={i}
                                  className={`relative flex h-6 cursor-pointer items-center justify-center rounded text-xs ${
                                    isToday
                                      ? "dark:bg-primary-dark bg-primary text-white"
                                      : isCurrentMonth && dayPosts.length > 0
                                        ? "bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-800 dark:text-green-200 dark:hover:bg-green-700"
                                        : isCurrentMonth
                                          ? "text-dark hover:bg-gray-2 dark:text-white dark:hover:bg-dark-2"
                                          : "text-gray-400 dark:text-gray-600"
                                  }`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (isCurrentMonth && dayPosts.length > 0) {
                                      if (dayPosts.length === 1) {
                                        setSelectedPost(dayPosts[0]);
                                      } else {
                                        // Show multi-post modal
                                        setSelectedDayPosts(dayPosts);
                                        setSelectedDay(day);
                                        setShowMultiPostModal(true);
                                      }
                                    }
                                  }}
                                >
                                  <span>{format(day, "d")}</span>
                                  {isCurrentMonth && dayPosts.length > 1 && (
                                    <span className="absolute -right-1 -top-1 flex h-3 w-3 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
                                      {dayPosts.length}
                                    </span>
                                  )}
                                </div>
                              );
                            });
                          })()}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        );
      }
    }
  };

  const renderPreview = () => {
    if (!selectedPost) {
      return (
        <div className="py-4 text-center text-gray-400">
          Select a platform to preview your post.
        </div>
      );
    }

    const platform = selectedPost.platform;
    const mediaArray =
      selectedPost.mediaFiles?.map((file) => file.preview) ||
      selectedPost.media?.map((media) => media.file) ||
      undefined;

    const socialPage = selectedPost.platformPage;

    switch (platform) {
      case "Facebook":
        return (
          <FacebookPostPreview
            key="facebook"
            pageName={socialPage?.page_name || "Facebook User"}
            content={selectedPost.description}
            media={mediaArray}
          />
        );
      case "Instagram":
        return (
          <InstagramPostPreview
            key="instagram"
            pageName={socialPage?.page_name || "Instagram User"}
            content={selectedPost.description}
            media={mediaArray}
          />
        );
      case "LinkedIn":
        return (
          <LinkedinPostPreview
            key="linkedin"
            pageName={socialPage?.page_name || "LinkedIn User"}
            content={selectedPost.description}
            media={mediaArray}
          />
        );
      default:
        return null;
    }
  };

  // Inside the CalendarBox component, before the return statement
  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    console.log("Drag ended:", { active, over });

    // 1. Do nothing if the item is dropped outside a valid droppable area
    if (!over) {
      console.log("No destination, drag cancelled");
      return;
    }

    // 2. Find the dragged post to get its current status
    const draggedPost = scheduledPosts.find((p) => p.id === active.id);
    if (!draggedPost) {
      console.error("Could not find dragged post with id:", active.id);
      return;
    }

    // 3. Get the destination column status
    const validDroppableIds = ["pending", "rejected", "scheduled", "published"];
    const destinationColumn = over.id;

    if (!validDroppableIds.includes(destinationColumn as string)) {
      console.error("Invalid droppable ID:", destinationColumn);
      return;
    }

    const newStatus = destinationColumn as ScheduledPost["status"];

    // 4. Do nothing if the item is dropped in the same status column
    if (draggedPost.status === newStatus) {
      console.log("Dropped in same status column, no change needed");
      return;
    }

    // 5. VALIDATE MOVEMENT RULES
    const isValidMove = validatePostMovement(draggedPost.status, newStatus);
    if (!isValidMove.valid) {
      toast.error(isValidMove.message);
      return;
    }

    // 5.5. CHECK USER PERMISSIONS for approval actions
    if (
      !canApproveReject &&
      ((draggedPost.status === "pending" && newStatus === "scheduled") ||
        (draggedPost.status === "pending" && newStatus === "rejected"))
    ) {
      toast.error(
        "You don't have permission to approve or reject posts. Only moderators can approve/reject posts.",
      );
      return;
    }

    // 6. Check if this is a rejection - show feedback modal
    if (newStatus === "rejected") {
      setPendingRejection({
        postId: draggedPost.id,
        postTitle:
          draggedPost.title || draggedPost.description.substring(0, 50) + "...",
      });
      setShowFeedbackModal(true);
      return;
    }

    console.log(
      "Updating post status from",
      draggedPost.status,
      "to:",
      newStatus,
    );

    // 7. OPTIMISTIC UPDATE: Update the UI immediately for a smooth experience
    setScheduledPosts((prevPosts) =>
      prevPosts.map((post) =>
        post.id === active.id ? { ...post, status: newStatus } : post,
      ),
    );

    // 8. PERSIST THE CHANGE: Call your backend API to save the new status
    handlePostStatusUpdate(draggedPost.id, newStatus);
  };

  // Validate post movement rules
  const validatePostMovement = (
    currentStatus: ScheduledPost["status"],
    newStatus: ScheduledPost["status"],
  ): { valid: boolean; message: string } => {
    const rules: Record<
      string,
      Record<string, { valid: boolean; message: string }>
    > = {
      pending: {
        scheduled: { valid: true, message: "" },
        rejected: { valid: true, message: "" },
        published: {
          valid: false,
          message: "Posts must be scheduled before publishing",
        },
      },
      rejected: {
        pending: { valid: true, message: "" },
        scheduled: {
          valid: false,
          message: "Rejected posts must be resubmitted as pending first",
        },
        published: {
          valid: false,
          message: "Rejected posts cannot be published directly",
        },
      },
      scheduled: {
        published: { valid: true, message: "" },
        rejected: { valid: true, message: "" },
        pending: {
          valid: false,
          message: "Scheduled posts cannot be moved back to pending",
        },
      },
      published: {
        pending: { valid: false, message: "Published posts cannot be moved" },
        rejected: { valid: false, message: "Published posts cannot be moved" },
        scheduled: { valid: false, message: "Published posts cannot be moved" },
      },
    };

    const rule = rules[currentStatus || ""]?.[newStatus || ""];
    return rule || { valid: false, message: "Invalid status transition" };
  };

  // Feedback modal handlers
  const handleRejectWithFeedback = async () => {
    if (!pendingRejection) return;

    try {
      // Optimistically update UI
      setScheduledPosts((prevPosts) =>
        prevPosts.map((post) =>
          post.id === pendingRejection.postId
            ? { ...post, status: "rejected" }
            : post,
        ),
      );

      // Call API with feedback
      await postService.rejectPost(
        parseInt(pendingRejection.postId),
        feedbackText,
      );

      toast.success("Post rejected with feedback!");

      // Clean up
      setShowFeedbackModal(false);
      setPendingRejection(null);
      setFeedbackText("");
    } catch (error) {
      console.error("Failed to reject post:", error);
      toast.error("Failed to reject post. Reverting change.");
      // Revert optimistic update on error
      fetchScheduledPosts();
    }
  };

  const handleCancelRejection = () => {
    setShowFeedbackModal(false);
    setPendingRejection(null);
    setFeedbackText("");
  };

  const handlePostStatusUpdate = async (
    postId: string,
    newStatus: ScheduledPost["status"],
  ) => {
    try {
      // Use appropriate API endpoints based on status change
      if (newStatus === "scheduled") {
        await postService.approvePost(parseInt(postId));
      } else if (newStatus === "rejected") {
        await postService.rejectPost(parseInt(postId));
      } else if (newStatus === "published") {
        await postService.publishPost(parseInt(postId));
      } else if (newStatus === "pending") {
        await postService.resubmitPost(parseInt(postId));
      } else {
        console.log(`Status change to ${newStatus} not yet implemented`);
        toast.info(
          `Status change to ${newStatus} noted (implementation needed)`,
        );
        return;
      }
      toast.success(`Post moved to ${newStatus}!`);
    } catch (error) {
      console.error("Failed to update post status:", error);
      toast.error("Failed to update post status. Reverting change.");
      // If the API call fails, revert the optimistic update
      fetchScheduledPosts();
    }
  };

  return (
    <div className="mx-auto max-w-7xl p-4 transition-all">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchScheduledPosts()}
            disabled={loadingPosts}
            className="hover:bg-primary-dark dark:bg-primary-dark ml-2 flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm transition-all dark:hover:bg-primary"
          >
            <RefreshCw
              className={`h-4 w-4 ${loadingPosts ? "animate-spin" : ""}`}
            />
            <span className="hidden sm:block">Refresh</span>
          </button>
        </div>
        <div className="flex items-center gap-14">
          <button
            onClick={goToPrevious}
            className="dark:bg-gray-dark-2 dark:hover:bg-gray-dark-3 flex h-9 w-9 items-center justify-center rounded-lg bg-gray-200 text-gray-700 transition-all hover:bg-gray-300 dark:bg-gray-dark dark:text-white dark:hover:bg-gray-700"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <h2 className="text-xl font-semibold transition-all dark:text-white sm:text-2xl">
            {renderCalendarHeader()}
          </h2>
          <button
            onClick={goToNext}
            className="dark:bg-gray-dark-2 dark:hover:bg-gray-dark-3 flex h-9 w-9 items-center justify-center rounded-lg bg-gray-200 text-gray-700 transition-all hover:bg-gray-300 dark:bg-gray-dark dark:text-white dark:hover:bg-gray-700"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={goToToday}
            className="ml-2 flex items-center gap-2 rounded-lg bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition-all hover:bg-gray-300 dark:bg-gray-dark dark:text-white dark:hover:bg-gray-700"
          >
            <CalendarDays className="h-4 w-4" />
            <span className="hidden sm:block">Today</span>
          </button>
          {(["week", "month", "quarter", "year"] as const).map((view) => (
            <button
              key={view}
              onClick={() => setCalendarView(view)}
              className={`rounded-lg px-4 py-2 text-sm font-medium capitalize transition-all ${
                calendarView === view
                  ? "dark:bg-primary-dark bg-primary text-white shadow-sm hover:bg-opacity-85"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-dark dark:text-white dark:hover:bg-gray-700"
              }`}
            >
              {view}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <input
            type="text"
            value={searchYear}
            onChange={(e) => setSearchYear(e.target.value)}
            placeholder="Enter year (e.g., 2025)"
            className="dark:bg-gray-dark-2 w-40 rounded-lg border border-stroke p-2 text-sm dark:border-dark-3 dark:text-white"
          />
          <button
            onClick={handleSearchYear}
            className="hover:bg-primary-dark dark:bg-primary-dark rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm transition-all dark:hover:bg-primary"
          >
            Search
          </button>
        </div>

        <div className="flex gap-4">
          {/* Filter by Status */}
          <select
            value={filterStatus || ""}
            onChange={(e) => setFilterStatus(e.target.value || null)}
            className="rounded-lg border border-stroke p-2 text-sm dark:border-dark-3 dark:bg-dark-2 dark:text-white"
          >
            <option value="">All Statuses</option>
            <option value="scheduled">Scheduled</option>
            <option value="published">Published</option>
            <option value="pending">Pending</option>
            <option value="rejected">Rejected</option>
          </select>

          {/* Filter by Creators (CMs & Moderator) */}
          <select
            value={filterCreator || ""}
            onChange={(e) => setFilterCreator(e.target.value || null)}
            className="rounded-lg border border-stroke p-2 text-sm dark:border-dark-3 dark:bg-dark-2 dark:text-white"
            disabled={loadingCMs}
          >
            <option value="">
              {loadingCMs ? "Loading..." : "All Creators"}
            </option>
            {/* Assigned CMs */}
            {assignedCMs.map((cm) => (
              <option key={`cm-${cm.id}`} value={cm.full_name}>
                {cm.full_name} (CM)
              </option>
            ))}
            {/* Other creators from posts (including moderator) */}
            {Array.from(
              new Set(
                allPosts
                  .map((post) => post.creator?.full_name)
                  .filter(Boolean)
                  .filter(
                    (creatorName) =>
                      !assignedCMs.some((cm) => cm.full_name === creatorName),
                  ),
              ),
            ).map((creatorName) => (
              <option key={`creator-${creatorName}`} value={creatorName}>
                {creatorName}
              </option>
            ))}
          </select>

          {/* Filter by Client - Only show for moderators and admins */}
          {canApproveReject && (
            <select
              value={filterClient || ""}
              onChange={(e) => setFilterClient(e.target.value || null)}
              className="rounded-lg border border-stroke p-2 text-sm dark:border-dark-3 dark:bg-dark-2 dark:text-white"
            >
              <option value="">All Clients</option>
              {Array.from(
                new Set(
                  scheduledPosts
                    .map((post) => post.client?.full_name)
                    .filter(Boolean),
                ),
              ).map((clientName) => (
                <option key={clientName} value={clientName}>
                  {clientName}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      <div className="mb-6 flex items-end justify-between gap-4">
        <div className="border-b border-stroke dark:border-dark-3">
          {["Calendar", "Posts Table"].map((tab) => (
            <button
              key={tab}
              onClick={() => {
                const tabValue = tab.toLowerCase().replace(" ", "_") as
                  | "calendar"
                  | "post_table";
                setActiveTab(tabValue);
              }}
              className={`px-4 pb-2 ${
                activeTab === tab.toLowerCase().replace(" ", "_")
                  ? "dark:border-primary-dark dark:text-primary-dark border-b-2 border-primary text-primary"
                  : "text-dark hover:text-gray-600 dark:text-white"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
        <UserPresence />
      </div>

      {/*el views mta3 table*/}
      <div
        className={`overflow-hidden dark:shadow-card ${activeTab === "calendar" ? "rounded-xl bg-white shadow-lg dark:bg-gray-dark" : ""}`}
      >
        {activeTab === "calendar" ? (
          calendarView === "month" ? (
            <table className="w-full">
              <thead>
                <tr className="grid grid-cols-7 bg-primary text-white">
                  {["Sun", "Mon", "Tue", "Wed", "Thu", "Fr", "Sat"].map(
                    (day) => (
                      <th key={day} className="p-3 text-sm font-medium">
                        {day}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              {CalendarGridView()}
            </table>
          ) : (
            CalendarGridView()
          )
        ) : (
          <PostTable
            posts={scheduledPosts}
            onRefresh={fetchScheduledPosts}
            currentDate={currentDate}
            calendarView={calendarView}
            onPostClick={setSelectedPost}
            onDragEnd={onDragEnd}
            canApproveReject={canApproveReject}
          />
        )}
      </div>

      {selectedPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-full max-w-md rounded-lg bg-white shadow-xl transition-all dark:bg-gray-dark">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-gray-300 p-4 dark:border-dark-3">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                {selectedPost.title}
              </h3>
              <button
                onClick={() => setSelectedPost(null)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-gray-100"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="space-y-4 p-6">
              {/* post preview */}

              {renderPreview()}

              {/* Scheduled For */}
              <p className="text-sm">
                <span className="font-medium text-gray-600 dark:text-gray-300">
                  Scheduled for:
                </span>{" "}
                <span className="dark:text-primary-dark font-semibold text-primary dark:text-purple-300">
                  {format(new Date(selectedPost.scheduled_for), "PPpp")}
                </span>
              </p>

              {/* Status */}
              <p className="text-sm">
                <span className="font-medium text-gray-600 dark:text-gray-300">
                  Status:
                </span>{" "}
                <span
                  className={`rounded-full px-2 py-1 text-xs font-semibold ${
                    selectedPost.status === "published"
                      ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                      : selectedPost.status === "scheduled"
                        ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                        : selectedPost.status === "pending"
                          ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                          : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                  }`}
                >
                  {selectedPost.status
                    ? selectedPost.status.charAt(0).toUpperCase() +
                      selectedPost.status.slice(1)
                    : "Unknown"}
                </span>
              </p>
              {/* Creator */}

              <p className="text-sm">
                <span className="font-medium text-gray-600 dark:text-gray-300">
                  Creator:
                </span>{" "}
                <span className="font-semibold text-dark dark:text-white">
                  {selectedPost.creator?.full_name || "Unknown"}
                </span>
              </p>
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end gap-3 border-t border-gray-300 p-4 dark:border-dark-3">
              <button
                onClick={() => setSelectedPost(null)}
                className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 dark:border-dark-3 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-dark-2"
              >
                Close
              </button>
              <button
                onClick={() => router.push(`/editPost/${selectedPost?.id}`)}
                className="hover:bg-primary-dark rounded-md bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
              >
                Edit Post
              </button>
              <button
                onClick={async () => {
                  if (selectedPost) {
                    const confirmDelete = window.confirm(
                      `Are you sure you want to delete the post titled "${selectedPost.title}"?`,
                    );
                    if (confirmDelete) {
                      try {
                        await postService.deletePost(parseInt(selectedPost.id));

                        setSelectedPost(null);
                        fetchScheduledPosts(); // Refresh the scheduled posts
                      } catch (error) {
                        console.error("Error deleting post:", error);
                      }
                    }
                  }
                }}
                className="rounded-md bg-red-500 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Feedback Modal for Rejection */}
      <Dialog open={showFeedbackModal} onOpenChange={setShowFeedbackModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reject Post with Feedback</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Post: {pendingRejection?.postTitle}
              </label>
            </div>
            <div className="space-y-2">
              <label htmlFor="feedback" className="text-sm font-medium">
                Feedback (optional)
              </label>
              <textarea
                id="feedback"
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                placeholder="Provide feedback to help improve this post..."
                className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring min-h-[100px] w-full rounded-md border px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              />
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={handleCancelRejection}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleRejectWithFeedback}>
              Reject
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Multi-Post Selection Modal */}
      {showMultiPostModal && selectedDay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-full max-w-2xl rounded-lg bg-white shadow-xl transition-all dark:bg-gray-dark">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-gray-300 p-4 dark:border-dark-3">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                Posts for {format(selectedDay, "MMMM d, yyyy")} (
                {selectedDayPosts.length} posts)
              </h3>
              <button
                onClick={() => {
                  setShowMultiPostModal(false);
                  setSelectedDayPosts([]);
                  setSelectedDay(null);
                }}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-gray-100"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="max-h-96 space-y-3 overflow-y-auto p-6">
              {selectedDayPosts.map((post) => (
                <div
                  key={post.id}
                  onClick={() => {
                    setSelectedPost(post);
                    setShowMultiPostModal(false);
                    setSelectedDayPosts([]);
                    setSelectedDay(null);
                  }}
                  className="cursor-pointer rounded-lg border border-gray-200 p-4 transition-all hover:bg-gray-50 hover:shadow-md dark:border-dark-3 dark:hover:bg-dark-2"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 dark:text-white">
                        {post.title || "Untitled Post"}
                      </h4>
                      <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                        {post.description.length > 100
                          ? post.description.substring(0, 100) + "..."
                          : post.description}
                      </p>
                      <div className="mt-2 flex items-center gap-3">
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {format(new Date(post.scheduled_for), "h:mm a")}
                        </span>
                        <span
                          className={`rounded-full px-2 py-1 text-xs font-medium ${
                            post.status === "published"
                              ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                              : post.status === "scheduled"
                                ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                                : post.status === "pending"
                                  ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                                  : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                          }`}
                        >
                          {post.status}
                        </span>
                        <span
                          className={`flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${
                            post.platform === "Facebook"
                              ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                              : post.platform === "Instagram"
                                ? "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200"
                                : "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
                          }`}
                        >
                          {post.platform === "Facebook" && (
                            <FaFacebook className="h-3 w-3" />
                          )}
                          {post.platform === "Instagram" && (
                            <FaInstagram className="h-3 w-3" />
                          )}
                          {post.platform === "LinkedIn" && (
                            <FaLinkedin className="h-3 w-3" />
                          )}
                          {post.platform}
                        </span>
                      </div>
                    </div>
                    <div className="ml-4 flex flex-col gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/editPost/${post.id}`);
                        }}
                        className="hover:bg-primary-dark rounded-md bg-primary px-3 py-1 text-xs font-medium text-white shadow-sm focus:outline-none"
                      >
                        Edit
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end border-t border-gray-300 p-4 dark:border-dark-3">
              <button
                onClick={() => {
                  setShowMultiPostModal(false);
                  setSelectedDayPosts([]);
                  setSelectedDay(null);
                }}
                className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 dark:border-dark-3 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-dark-2"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CalendarBox;
