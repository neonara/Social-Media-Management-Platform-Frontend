"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  format,
  isSameDay,
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
import { useRouter } from "next/navigation";
import {
  usePostWebSocket,
  PostWebSocketMessage,
} from "@/hooks/usePostWebSocket";
import { FaFacebook, FaInstagram, FaLinkedin } from "react-icons/fa";
import { toast } from "react-toastify";
import { SocialPage } from "@/types/social-page";
import {
  FacebookPostPreview,
  InstagramPostPreview,
  LinkedinPostPreview,
} from "../postCreate/preview-post";
import UserPresence from "../UserPresence/UserPresence";
import Link from "next/link";

interface Creator {
  id: string;
  full_name: string;
  type: "client" | "team_member";
}

interface Client {
  id: string;
  full_name: string;
}

interface ScheduledPost {
  id: string;
  title: string;
  platform: "Facebook" | "Instagram" | "LinkedIn";
  platformPage: SocialPage;
  mediaFiles?: Array<{ id: string; preview: string }>;
  description: string;
  scheduled_for: string;
  status?: "published" | "scheduled" | "failed" | "pending" | "rejected";
  creator?: Creator;
  client?: Client | undefined;
}

const platformIcons = {
  Facebook: <FaFacebook className="text-blue-600" />,
  Instagram: <FaInstagram className="text-pink-500" />,
  LinkedIn: <FaLinkedin className="text-blue-700" />,
};

// Draggable Post Card Component
const PostCard = React.memo(
  ({
    post,
    color,
    onPostClick,
    onApprove,
    onReject,
  }: {
    post: ScheduledPost;
    color: string;
    onPostClick: (post: ScheduledPost) => void;
    onApprove: (postId: string) => void;
    onReject: (postId: string) => void;
  }) => {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({ id: post.id });

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
    };

    return (
      <div
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
        className={`mb-2 cursor-pointer rounded-lg ${color} p-3 text-sm shadow-sm transition-all ${
          isDragging
            ? "z-50 rotate-2 scale-105 opacity-50 shadow-lg"
            : "hover:shadow-md"
        }`}
        onClick={() => onPostClick(post)}
      >
        <div className="flex flex-wrap justify-between gap-2">
          <span className="font-medium">{post.title}</span>
          <span className="text-xs opacity-75">
            {format(new Date(post.scheduled_for), "PPpp")}
          </span>
        </div>
        <div className="mt-3 flex items-center gap-2 text-xs">
          {platformIcons[post.platform]} <span>{post.platform}</span>
        </div>

        {post.status === "pending" && (
          <div className="mt-2 flex gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onApprove(post.id);
              }}
              className="rounded-md bg-green-500 px-3 py-1 text-xs font-medium text-white shadow-sm transition-colors hover:bg-green-600"
            >
              Approve
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onReject(post.id);
              }}
              className="rounded-md bg-red-500 px-3 py-1 text-xs font-medium text-white shadow-sm transition-colors hover:bg-red-600"
            >
              Reject
            </button>
          </div>
        )}
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
  }) => {
    const { setNodeRef, isOver } = useDroppable({
      id: droppableId,
    });

    return (
      <div
        ref={setNodeRef}
        className={`rounded-lg border border-stroke ${bgColor} p-4 dark:border-dark-3 dark:bg-gray-dark ${
          isOver ? "border-2 border-dashed border-primary bg-primary/5" : ""
        }`}
      >
        <h3 className={`mb-4 text-lg font-semibold ${titleColor}`}>
          {title} ({posts.length})
        </h3>
        <SortableContext
          items={posts.map((post) => post.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="min-h-[200px] transition-colors">
            {posts.length > 0 ? (
              posts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  color={cardColor}
                  onPostClick={onPostClick}
                  onApprove={onApprove}
                  onReject={onReject}
                />
              ))
            ) : (
              <div className="flex items-center justify-center py-8">
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
}: {
  posts: ScheduledPost[];
  onRefresh: () => void;
  currentDate: Date;
  calendarView: "week" | "month" | "quarter" | "year";
  onPostClick: (post: ScheduledPost) => void;
  onDragEnd: (event: DragEndEvent) => void;
}) => {
  const sensors = useSensors(
    useSensor(PointerSensor),
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
          <h3 className="mb-4 text-lg font-semibold text-green-600 dark:text-green-300">
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

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={onDragEnd}
    >
      <div className="grid grid-cols-4 gap-4">
        <DroppableColumn
          key="pending-column"
          droppableId="pending"
          title="Pending"
          posts={pendingPosts}
          bgColor="bg-yellow-50"
          titleColor="text-yellow-600 dark:text-yellow-300"
          cardColor="bg-yellow-100 text-yellow-800 hover:bg-yellow-200 dark:bg-yellow-900 dark:text-yellow-200 dark:hover:bg-yellow-800"
          onPostClick={onPostClick}
          onApprove={handleApprove}
          onReject={handleReject}
        />

        <DroppableColumn
          key="rejected-column"
          droppableId="rejected"
          title="Rejected"
          posts={rejectedPosts}
          bgColor="bg-red-50"
          titleColor="text-red-600 dark:text-red-300"
          cardColor="bg-red-100 text-red-800 hover:bg-red-200 dark:bg-red-900 dark:text-red-200 dark:hover:bg-red-800"
          onPostClick={onPostClick}
          onApprove={handleApprove}
          onReject={handleReject}
        />

        <DroppableColumn
          key="scheduled-column"
          droppableId="scheduled"
          title="Scheduled"
          posts={scheduledPosts}
          bgColor="bg-purple-50"
          titleColor="dark:text-primary-dark text-primary"
          cardColor="bg-blue-100 text-blue-800 hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-200 dark:hover:bg-blue-800"
          onPostClick={onPostClick}
          onApprove={handleApprove}
          onReject={handleReject}
        />

        <DroppableColumn
          key="published-column"
          droppableId="published"
          title="Posted"
          posts={postedPosts}
          bgColor="bg-green-50"
          titleColor="text-green-600 dark:text-green-300"
          cardColor="bg-green-200 text-green-800 hover:bg-green-300 dark:bg-green-900 dark:text-green-200 dark:hover:bg-green-800"
          onPostClick={onPostClick}
          onApprove={handleApprove}
          onReject={handleReject}
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
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [selectedPost, setSelectedPost] = useState<ScheduledPost | null>(null);
  const [filterCreator, setFilterCreator] = useState<string | null>(null);
  const [filterClient, setFilterClient] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  // const frenchDays = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"]; // Unused variable
  const router = useRouter();

  // WebSocket integration for real-time updates
  const handleWebSocketMessage = useCallback(
    (message: PostWebSocketMessage) => {
      console.log("WebSocket message received:", message);

      // Handle the message based on the type (which comes from our signal's type field)
      switch (message.type) {
        case "post_updated":
          // Check the action to determine what kind of update this is
          if (message.action === "created" && message.post_data) {
            console.log("New post created:", message.post_data);
            setScheduledPosts((prev) => [
              ...prev,
              message.post_data as unknown as ScheduledPost,
            ]);
            toast.success("New post created!");
          } else if (
            message.action === "updated" &&
            message.post_data &&
            message.post_id
          ) {
            console.log("Post updated:", message.post_data);
            setScheduledPosts((prev) =>
              prev.map((p) =>
                p.id === message.post_id
                  ? (message.post_data as unknown as ScheduledPost)
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
            message.post_data &&
            message.post_id
          ) {
            console.log(
              `Post ${message.post_id} status changed from ${message.old_status} to ${message.new_status}`,
            );
            setScheduledPosts((prev) =>
              prev.map((p) =>
                p.id === message.post_id
                  ? (message.post_data as unknown as ScheduledPost)
                  : p,
              ),
            );
            toast.success(`Post status changed to ${message.new_status}!`);
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
    [],
  );

  usePostWebSocket(handleWebSocketMessage);

  const platformIcons = {
    Facebook: <FaFacebook className="text-blue-600" />,
    Instagram: <FaInstagram className="text-pink-500" />,
    LinkedIn: <FaLinkedin className="text-blue-700" />,
  };

  const fetchScheduledPosts = async (
    creatorFilter?: string | null,
    statusFilter?: string | null,
    clientFilter?: string | null,
  ) => {
    setLoadingPosts(true);
    try {
      const posts = (await postService.getScheduledPosts()) as ScheduledPost[];
      // Apply filters if they exist
      const filteredPosts = posts
        .map((post) => ({
          ...post,
          creator: post.creator
            ? {
                ...post.creator,
                type: post.creator.type as "client" | "team_member",
              }
            : undefined,
        }))
        .filter((post) => {
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
  };
  useEffect(() => {
    fetchScheduledPosts(filterCreator, filterStatus);
  }, [filterCreator, filterStatus, filterClient, currentDate, calendarView]);

  const applyFilters = useCallback(
    (posts: ScheduledPost[]) => {
      return posts.filter((post) => {
        const matchesStatus = filterStatus
          ? post.status === filterStatus
          : true;
        const matchesCreator = filterCreator
          ? post.creator?.full_name === filterCreator
          : true;
        // const matchesClient = filterClient
        //   ? post.client?.name === filterClient
        //   : true;
        return matchesStatus && matchesCreator;
      });
    },
    [filterStatus, filterCreator],
  );

  useEffect(() => {
    const fetchFilteredPosts = async () => {
      setLoadingPosts(true);
      try {
        const posts =
          (await postService.getScheduledPosts()) as ScheduledPost[];
        setScheduledPosts(applyFilters(posts));
      } catch (error) {
        console.error("Error fetching scheduled posts:", error);
      } finally {
        setLoadingPosts(false);
      }
    };

    fetchFilteredPosts();
  }, [filterStatus, currentDate, calendarView, applyFilters]);

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
              function setDate(date: Date, day: number): Date {
                const newDate = new Date(date);
                newDate.setDate(day);
                return newDate;
              }

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
                    {eachDayOfInterval({
                      start: startOfMonth(monthDate),
                      end: setDate(endOfMonth(monthDate), 7),
                    }).map((day, i) => (
                      <div
                        key={i}
                        className={`flex h-8 items-center justify-center rounded text-sm ${
                          isSameDay(day, new Date())
                            ? "dark:bg-primary-dark bg-primary text-white"
                            : "hover:bg-gray-2 dark:hover:bg-dark-2"
                        }`}
                      >
                        {i < 7 ? format(day, "EEEEE") : format(day, "d")}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        );
      }

      case "year": {
        function subDays(date: Date, amount: number): Date {
          const newDate = new Date(date);
          newDate.setDate(newDate.getDate() - amount);
          return newDate;
        }

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
                    const monthStart = startOfMonth(monthDate);

                    // Get first day of month and calculate offset for week start
                    const firstDay = monthStart.getDay(); // 0 (Sun) to 6 (Sat)
                    const startOffset = firstDay === 0 ? 6 : firstDay - 1; // Adjust for Monday start

                    // Create complete weeks array (6 weeks to cover all possibilities)
                    const weeks = [];
                    let weekStartDate = subDays(monthStart, startOffset);

                    for (let i = 0; i < 6; i++) {
                      weeks.push(weekStartDate);
                      weekStartDate = addDays(weekStartDate, 7);
                    }

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
                        <table className="w-full">
                          <thead>
                            <tr className="text-xs">
                              {["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"].map(
                                (day) => (
                                  <th
                                    key={day}
                                    className="h-8 text-center font-medium"
                                  >
                                    {day}
                                  </th>
                                ),
                              )}
                            </tr>
                          </thead>
                          <tbody>
                            {weeks.map((weekStart) => {
                              const weekDays = eachDayOfInterval({
                                start: weekStart,
                                end: addDays(weekStart, 6),
                              });

                              return (
                                <tr key={weekStart.toString()}>
                                  {weekDays.map((day, dayIndex) => {
                                    const isCurrentMonth = isSameMonth(
                                      day,
                                      monthDate,
                                    );
                                    const isToday = isSameDay(day, new Date());

                                    return (
                                      <td
                                        key={dayIndex}
                                        className={`h-8 text-center text-sm ${
                                          !isCurrentMonth ? "opacity-50" : ""
                                        } ${
                                          isToday
                                            ? "dark:bg-primary-dark rounded-full bg-primary text-white"
                                            : "text-dark dark:text-white"
                                        }`}
                                      >
                                        {isCurrentMonth ? format(day, "d") : ""}
                                      </td>
                                    );
                                  })}
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
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
      selectedPost.mediaFiles?.map((file) => file.preview) || undefined;

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

    // 2. Do nothing if the item is dropped in the same place
    if (active.id === over.id) {
      console.log("Dropped in same place, no change");
      return;
    }

    // 3. Find the dragged post
    const draggedPost = scheduledPosts.find((p) => p.id === active.id);
    if (!draggedPost) {
      console.error("Could not find dragged post with id:", active.id);
      return;
    }

    // 4. Update the status of the post based on the destination column
    const validDroppableIds = ["pending", "rejected", "scheduled", "published"];
    // For @dnd-kit, we need to determine the droppable area from the over element
    // We'll need to implement this logic based on your UI structure
    // For now, let's assume the over.id tells us the column
    const destinationColumn = over.id;

    if (!validDroppableIds.includes(destinationColumn as string)) {
      console.error("Invalid droppable ID:", destinationColumn);
      return;
    }

    const newStatus = destinationColumn as ScheduledPost["status"];
    console.log("Updating post status to:", newStatus);

    // OPTIMISTIC UPDATE: Update the UI immediately for a smooth experience
    setScheduledPosts((prevPosts) =>
      prevPosts.map((post) =>
        post.id === active.id ? { ...post, status: newStatus } : post,
      ),
    );

    // 5. PERSIST THE CHANGE: Call your backend API to save the new status
    // This is a crucial step!
    handlePostStatusUpdate(draggedPost.id, newStatus);
  };

  const handlePostStatusUpdate = async (
    postId: string,
    newStatus: ScheduledPost["status"],
  ) => {
    try {
      // Use existing approve/reject functions when available
      if (newStatus === "scheduled") {
        await postService.approvePost(parseInt(postId));
      } else if (newStatus === "rejected") {
        await postService.rejectPost(parseInt(postId));
      } else {
        // For other status changes, you might need to implement a generic updatePostStatus function
        console.log(`Status change to ${newStatus} not yet implemented`);
        toast.info(
          `Status change to ${newStatus} noted (implementation needed)`,
        );
        return;
      }
      toast.success(`Post moved to ${newStatus}!`);
      // Optional: you can refetch all posts here to ensure data consistency,
      // but the optimistic update often feels better to the user.
      // fetchScheduledPosts();
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
            onClick={goToPrevious}
            className="dark:bg-gray-dark-2 dark:hover:bg-gray-dark-3 flex h-9 w-9 items-center justify-center rounded-lg bg-gray-200 transition-all hover:bg-gray-300"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={goToNext}
            className="dark:bg-gray-dark-2 dark:hover:bg-gray-dark-3 flex h-9 w-9 items-center justify-center rounded-lg bg-gray-200 transition-all hover:bg-gray-300"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
          <button
            onClick={goToToday}
            className="hover:bg-primary-dark dark:bg-primary-dark ml-2 flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm transition-all dark:hover:bg-primary"
          >
            <CalendarDays className="h-4 w-4" />
            <span className="hidden sm:block">Today</span>
          </button>
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

        <h2 className="text-xl font-semibold dark:text-white sm:text-2xl">
          {renderCalendarHeader()}
        </h2>

        <div className="flex flex-wrap gap-2">
          {(["week", "month", "quarter", "year"] as const).map((view) => (
            <button
              key={view}
              onClick={() => setCalendarView(view)}
              className={`rounded-lg px-4 py-2 text-sm font-medium capitalize transition-all ${
                calendarView === view
                  ? "dark:bg-primary-dark bg-primary text-white shadow-sm"
                  : "dark:hover:bg-gray-dark-3 bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-dark dark:text-white"
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

          <select
            value={filterCreator || ""}
            onChange={(e) => setFilterCreator(e.target.value || null)}
            className="rounded-lg border border-stroke p-2 text-sm dark:border-dark-3 dark:bg-dark-2 dark:text-white"
          >
            <option value="">All Creators</option>
            {Array.from(
              new Set(
                scheduledPosts
                  .map((post) => post.creator?.full_name)
                  .filter(Boolean),
              ),
            ).map((creatorName) => (
              <option key={creatorName} value={creatorName}>
                {creatorName}
              </option>
            ))}
          </select>
          {/* Filter by Client */}
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
    </div>
  );
};

export default CalendarBox;
