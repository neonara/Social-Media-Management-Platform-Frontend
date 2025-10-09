"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DragEndEvent } from "@dnd-kit/core";
import {
  addDays,
  addMonths,
  addQuarters,
  addWeeks,
  addYears,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfQuarter,
  startOfWeek,
  startOfYear,
  subMonths,
  subQuarters,
  subYears,
} from "date-fns";
import {
  Calendar,
  CalendarDays,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Clock,
  Kanban,
  RefreshCw,
  Search,
  XCircle,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import MultiPostModal from "@/app/(home)/calendar/_components/MultiPostModal";
import PostCardModal from "@/app/(home)/calendar/_components/postCardModal";
import PostTable from "@/app/(home)/calendar/_components/PostTable";
import { platformIcons } from "@/components/platformIcons";
import {
  FacebookPostPreview,
  InstagramPostPreview,
  LinkedinPostPreview,
} from "@/components/postPreview";
import UserPresence from "@/components/UserPresence/UserPresence";
import { useUser } from "@/context/UserContext";
import {
  PostWebSocketMessage,
  usePostWebSocket,
} from "@/hooks/usePostWebSocket";
import * as moderatorsService from "@/services/moderatorsService";
import * as postService from "@/services/postService";
import { ScheduledPost } from "@/types/post";
import { GetUser, User } from "@/types/user";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";

// Simple cache for expensive API calls
const cache = new Map<string, { data: unknown; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

function getCachedData<T>(key: string): T | null {
  // TEMPORARY: Override caching for posts until cache issues are resolved
  // Always return null to force fresh data retrieval
  if (key.includes("post") || key.includes("scheduled")) {
    return null;
  }

  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data as T;
  }
  return null;
}

function setCachedData(key: string, data: unknown) {
  // TEMPORARY: Skip caching for posts until cache issues are resolved
  if (key.includes("post") || key.includes("scheduled")) {
    console.log(`Skipping cache for key: ${key} (posts caching disabled)`);
    return;
  }

  cache.set(key, { data, timestamp: Date.now() });
}

function invalidateCache(pattern?: string) {
  if (pattern) {
    // Clear specific cache entries matching pattern
    for (const [key] of cache.entries()) {
      if (key.includes(pattern)) {
        cache.delete(key);
      }
    }
  } else {
    // Clear all cache
    cache.clear();
  }
  console.log(
    pattern ? `Cache cleared for pattern: ${pattern}` : "All cache cleared",
  );
}

export default function CalendarPage() {
  const { userProfile: currentUser, role: userRole } = useUser();

  // Convert GetUser to User format for compatibility with existing components
  const convertToUserType = (getUser: GetUser | null): User | null => {
    if (!getUser) return null;

    return {
      ...getUser,
      is_administrator: userRole === "administrator",
      is_superadministrator: userRole === "super_administrator",
      is_moderator: userRole === "moderator",
      is_community_manager: userRole === "community_manager",
      is_client: userRole === "client",
      first_name: getUser.first_name || "",
      last_name: getUser.last_name || "",
    } as User;
  };

  const currentUserForModal = convertToUserType(currentUser);

  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarView, setCalendarView] = useState<
    "week" | "month" | "quarter" | "year"
  >("week");
  const [activeTab, setActiveTab] = useState<"calendar" | "post_table">(
    "post_table",
  );
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [searchYear, setSearchYear] = useState<string>("");
  const [scheduledPosts, setScheduledPosts] = useState<ScheduledPost[]>([]);
  const [allPosts, setAllPosts] = useState<ScheduledPost[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [selectedPost, setSelectedPost] = useState<ScheduledPost | null>(null);
  const [filterCreator, setFilterCreator] = useState<string | null>(null);
  const [filterClient, setFilterClient] = useState<string | null>(null);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [assignedCMs, setAssignedCMs] = useState<GetUser[]>([]);
  const [loadingCMs, setLoadingCMs] = useState(false);
  const [assignedClients, setAssignedClients] = useState<
    { id: number; label: string; email?: string }[]
  >([]);
  const [cmAssignedClients, setCmAssignedClients] = useState<
    Array<{ id: number; name: string; email: string }>
  >([]);
  const [showMultiPostModal, setShowMultiPostModal] = useState(false);
  const [selectedDayPosts, setSelectedDayPosts] = useState<ScheduledPost[]>([]);
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [openSelect, setOpenSelect] = useState<string | null>(null);

  // Confirmation modal states
  const [showOverrideModal, setShowOverrideModal] = useState(false);
  const [pendingValidationPostId, setPendingValidationPostId] = useState<
    number | null
  >(null);

  const router = useRouter();

  // Utility function to sanitize post data for client components
  const sanitizePostData = useCallback((post: unknown): ScheduledPost => {
    const postData = post as Record<string, unknown>;
    return {
      ...postData,
      scheduled_for:
        typeof postData.scheduled_for === "string"
          ? postData.scheduled_for
          : new Date(
            postData.scheduled_for as string | number | Date,
          ).toISOString(),
      // Handle tracking fields
      created_at:
        postData.created_at && typeof postData.created_at !== "string"
          ? new Date(
            postData.created_at as string | number | Date,
          ).toISOString()
          : postData.created_at,
      updated_at:
        postData.updated_at && typeof postData.updated_at !== "string"
          ? new Date(
            postData.updated_at as string | number | Date,
          ).toISOString()
          : postData.updated_at,
      // Workflow date fields
      client_approved_at:
        postData.client_approved_at &&
          typeof postData.client_approved_at !== "string"
          ? new Date(
            postData.client_approved_at as string | number | Date,
          ).toISOString()
          : postData.client_approved_at,
      client_rejected_at:
        postData.client_rejected_at &&
          typeof postData.client_rejected_at !== "string"
          ? new Date(
            postData.client_rejected_at as string | number | Date,
          ).toISOString()
          : postData.client_rejected_at,
      moderator_validated_at:
        postData.moderator_validated_at &&
          typeof postData.moderator_validated_at !== "string"
          ? new Date(
            postData.moderator_validated_at as string | number | Date,
          ).toISOString()
          : postData.moderator_validated_at,
      moderator_rejected_at:
        postData.moderator_rejected_at &&
          typeof postData.moderator_rejected_at !== "string"
          ? new Date(
            postData.moderator_rejected_at as string | number | Date,
          ).toISOString()
          : postData.moderator_rejected_at,
      feedback_at:
        postData.feedback_at && typeof postData.feedback_at !== "string"
          ? new Date(
            postData.feedback_at as string | number | Date,
          ).toISOString()
          : postData.feedback_at,
      media:
        (postData.media as Array<Record<string, unknown>>)?.map(
          (mediaItem: Record<string, unknown>) => ({
            ...mediaItem,
            uploaded_at:
              typeof mediaItem.uploaded_at === "string"
                ? mediaItem.uploaded_at
                : new Date(
                  mediaItem.uploaded_at as string | number | Date,
                ).toISOString(),
          }),
        ) || [],
    } as ScheduledPost;
  }, []);

  const statusConfig = [
    {
      key: "pending",
      label: "Pending",
      icon: Clock,
      color: "text-amber-600 dark:text-amber-400",
      bgColor: "bg-amber-50 dark:bg-amber-950 dark:bg-opacity-40",
      borderColor: "border-amber-200 dark:border-amber-800",
    },
    {
      key: "rejected",
      label: "Rejected",
      icon: XCircle,
      color: "text-red-600 dark:text-red-400",
      bgColor: "bg-red-50 dark:bg-red-950 dark:bg-opacity-40",
      borderColor: "border-red-200 dark:border-red-800",
    },
    {
      key: "scheduled",
      label: "Scheduled",
      icon: Calendar,
      color: "text-purple-600 dark:text-purple-400",
      bgColor: "bg-purple-50 dark:bg-purple-950 dark:bg-opacity-40",
      borderColor: "border-purple-300 dark:border-purple-700",
    },
    {
      key: "published",
      label: "Published",
      icon: CheckCircle,
      color: "text-green-600 dark:text-green-400",
      bgColor: "bg-green-50 dark:bg-green-950 dark:bg-opacity-40",
      borderColor: "border-green-200 dark:border-green-800",
    },
  ];

  const toggleStatus = (status: string) => {
    setSelectedStatuses((prev) =>
      prev.includes(status)
        ? prev.filter((s) => s !== status)
        : [...prev, status],
    );
  };

  const handleRefresh = () => {
    console.log("Manual refresh triggered");
    fetchScheduledPosts(filterCreator, selectedStatuses, filterClient);
  };

  const canApproveReject =
    userRole === "client" ||
    userRole === "moderator" ||
    userRole === "administrator" ||
    userRole === "super_administrator";

  // Shared approval functions for both PostTable and PostCardModal
  const handleApprove = async (postId: number) => {
    try {
      console.log(
        `Attempting to ${userRole === "client" ? "approve" : "validate"} post ${postId}`,
      );

      if (userRole === "client") {
        // For clients, approve directly
        const response = await postService.approvePost(postId);

        if (response.success) {
          console.log(`Post ${postId} approved successfully:`, response);
          toast.success("Post approved successfully!");
          handleRefresh(); // Trigger immediate refresh
        } else {
          console.error(`Failed to approve post ${postId}:`, response);
          toast.error(response.message || "Failed to approve post.");
        }
      } else {
        // For moderators/admins/super_admins, show confirmation modal
        setPendingValidationPostId(postId);
        setShowOverrideModal(true);
      }
    } catch (error) {
      console.error(
        `Error ${userRole === "client" ? "approving" : "validating"} post:`,
        error,
      );
      toast.error(
        `Failed to ${userRole === "client" ? "approve" : "validate"} post.`,
      );
    }
  };

  // Function to handle the actual validation with override option
  const handleValidatePost = async (
    postId: number,
    overrideClient: boolean = false,
  ) => {
    try {
      console.log(`Validating post ${postId} with override: ${overrideClient}`);

      const response = await postService.moderatorValidatePost(
        postId,
        overrideClient,
      );

      if (response.success) {
        console.log(`Post ${postId} validated successfully:`, response);
        toast.success("Post validated successfully!");
        handleRefresh(); // Trigger immediate refresh
      } else {
        console.error(`Failed to validate post ${postId}:`, response);
        toast.error(response.message || "Failed to validate post.");
      }
    } catch (error) {
      console.error("Error validating post:", error);
      toast.error("Failed to validate post.");
    }
  };

  const handleReject = async (postId: number, feedback?: string) => {
    try {
      console.log(`Attempting to reject post ${postId}`);
      const response = await postService.rejectPost(postId, feedback);

      if (response.success) {
        console.log(`Post ${postId} rejected successfully:`, response);
        toast.success("Post rejected successfully!");
        handleRefresh(); // Trigger immediate refresh
      } else {
        console.error(`Failed to reject post ${postId}:`, response);
        toast.error(response.message || "Failed to reject post.");
      }
    } catch (error) {
      console.error("Error rejecting post:", error);
      toast.error("Failed to reject post.");
    }
  };

  const handleWebSocketMessage = useCallback(
    (message: PostWebSocketMessage) => {
      console.log("WebSocket message received:", message);
      switch (message.type) {
        case "post_created":
          // Invalidate posts cache since new data was created
          invalidateCache("scheduled_posts_");

          if (message.data) {
            // Sanitize the data to ensure proper serialization
            const newPost = sanitizePostData(message.data);
            setScheduledPosts((prev) => [...prev, newPost]);
            setAllPosts((prev) => [...prev, newPost]);
            toast.success("New post created!");
          }
          break;
        case "post_updated":
          // Invalidate posts cache since data changed
          invalidateCache("scheduled_posts_");

          if (message.action === "created" && message.data) {
            // Handle legacy messages that still use post_updated with action=created
            const newPost = sanitizePostData(message.data);
            setScheduledPosts((prev) => [...prev, newPost]);
            setAllPosts((prev) => [...prev, newPost]);
            toast.success("New post created!");
          } else if (
            message.action === "updated" &&
            message.data &&
            message.post_id
          ) {
            // Sanitize the data to ensure proper serialization
            const updatedPost = sanitizePostData(message.data);
            console.log(
              `Updating post ${message.post_id} with data:`,
              updatedPost,
            );
            setScheduledPosts((prev) =>
              prev.map((p) =>
                p.id.toString() === message.post_id ? updatedPost : p,
              ),
            );
            setAllPosts((prev) =>
              prev.map((p) =>
                p.id.toString() === message.post_id ? updatedPost : p,
              ),
            );
            toast.info("Post updated!");
          } else if (message.action === "deleted" && message.post_id) {
            setScheduledPosts((prev) =>
              prev.filter((p) => p.id.toString() !== message.post_id),
            );
            setAllPosts((prev) =>
              prev.filter((p) => p.id.toString() !== message.post_id),
            );
            toast.info("Post deleted!");
          } else if (
            message.action === "status_changed" &&
            message.data &&
            message.post_id
          ) {
            // Sanitize the data to ensure proper serialization
            const updatedPost = sanitizePostData(message.data);
            console.log(
              `Post ${message.post_id} status changed to:`,
              updatedPost.status,
              updatedPost,
            );
            setScheduledPosts((prev) =>
              prev.map((p) =>
                p.id.toString() === message.post_id ? updatedPost : p,
              ),
            );
            setAllPosts((prev) =>
              prev.map((p) =>
                p.id.toString() === message.post_id ? updatedPost : p,
              ),
            );
            if (message.user_id !== "self") {
              toast.success(`Post status changed to ${message.new_status}!`);
            }
          }
          break;
        case "post_deleted":
          // Handle post deletion
          invalidateCache("scheduled_posts_");

          if (message.post_id) {
            setScheduledPosts((prev) =>
              prev.filter((p) => p.id.toString() !== message.post_id),
            );
            setAllPosts((prev) =>
              prev.filter((p) => p.id.toString() !== message.post_id),
            );
            toast.info("Post deleted!");
          }
          break;
        case "post_status_changed":
          // Handle post status changes
          invalidateCache("scheduled_posts_");

          if (message.data && message.post_id) {
            const updatedPost = sanitizePostData(message.data);
            setScheduledPosts((prev) =>
              prev.map((p) =>
                p.id.toString() === message.post_id ? updatedPost : p,
              ),
            );
            setAllPosts((prev) =>
              prev.map((p) =>
                p.id.toString() === message.post_id ? updatedPost : p,
              ),
            );
            if (message.user_id !== "self") {
              toast.success(`Post status changed to ${message.new_status}!`);
            }
          }
          break;
        case "connection_established":
          console.log("WebSocket connection established");
          break;
        case "error":
          console.error("WebSocket error:", message);
          toast.error("WebSocket error occurred");
          break;
      }
    },
    [sanitizePostData],
  );

  usePostWebSocket(handleWebSocketMessage);

  const fetchAssignedCMs = useCallback(async () => {
    const cacheKey = "assigned_cms";

    // Check cache first
    const cachedCMs = getCachedData<GetUser[]>(cacheKey);
    if (cachedCMs) {
      console.log("Using cached assigned CMs");
      setAssignedCMs(cachedCMs);
      setLoadingCMs(false);
      return;
    }

    setLoadingCMs(true);
    try {
      console.log("Fetching assigned CMs from API");
      const result = await moderatorsService.getAssignedCommunityManagers();
      if (Array.isArray(result)) {
        setAssignedCMs(result);
        setCachedData(cacheKey, result);
      } else {
        setAssignedCMs([]);
        setCachedData(cacheKey, []);
      }
    } catch {
      setAssignedCMs([]);
    } finally {
      setLoadingCMs(false);
    }
  }, []);

  const fetchCMAssignedClients = useCallback(async () => {
    if (userRole !== "community_manager") return;

    const cacheKey = "cm_assigned_clients";
    const cached =
      getCachedData<Array<{ id: number; name: string; email: string }>>(
        cacheKey,
      );
    if (cached) {
      console.log("Using cached CM assigned clients");
      setCmAssignedClients(cached);
      return;
    }

    try {
      console.log("Fetching CM assigned clients from API");
      const result = await postService.getAssignedClients();
      setCmAssignedClients(result);
      setCachedData(cacheKey, result);
    } catch (error) {
      console.error("Error fetching CM assigned clients:", error);
      setCmAssignedClients([]);
    }
  }, [userRole]);

  const fetchScheduledPosts = useCallback(
    async (
      creatorFilter?: string | null,
      statusFilters?: string[],
      clientFilter?: string | null,
    ) => {
      console.log("Fetching scheduled posts with filters:", {
        creatorFilter,
        statusFilters,
        clientFilter,
      });
      setLoadingPosts(true);

      // Create cache key for raw posts data (without filters)
      const rawPostsCacheKey = `scheduled_posts_${userRole}_${currentUser?.id}`;

      try {
        // Check cache for raw posts first
        let posts: ScheduledPost[];
        const cachedPosts = getCachedData<ScheduledPost[]>(rawPostsCacheKey);

        if (cachedPosts) {
          console.log(
            `Using cached scheduled posts (${cachedPosts.length} posts)`,
          );
          posts = cachedPosts;
        } else {
          console.log("Fetching scheduled posts from API");
          posts = (await postService.getScheduledPosts()) as ScheduledPost[];
          console.log(`Fetched ${posts.length} posts from API:`, posts);

          // Cache the raw posts data
          setCachedData(rawPostsCacheKey, posts);
        }

        // Ensure all posts have properly serialized data
        const serializedPosts = posts.map((post) => sanitizePostData(post));

        const assignedCMEmailSet = new Set(assignedCMs.map((cm) => cm.email));
        const authorizedPosts = serializedPosts.filter((post) => {
          if (
            userRole === "administrator" ||
            userRole === "super_administrator"
          ) {
            return true;
          }

          const isCm =
            userRole === "community_manager" &&
            (post.creator?.email === currentUser?.email ||
              post.creator?.email === undefined);

          // Community managers should see posts created by moderators for their assigned clients
          const isCmViewingModeratorPostForAssignedClient =
            userRole === "community_manager" &&
            post.creator?.role === "moderator" &&
            post.client &&
            currentUser &&
            // Check if the current CM has this client assigned to them using the CM's assigned clients
            cmAssignedClients.some(
              (assignedClient) => assignedClient.id === post.client?.id,
            );

          const isModerator = userRole === "moderator";
          const isModeratorAllowed =
            isModerator &&
            (post.creator?.email === currentUser?.email ||
              (post.creator?.email &&
                assignedCMEmailSet.has(post.creator.email)));

          const isClient =
            currentUser &&
            post.client &&
            (post.client.email === currentUser.email ||
              post.client.full_name === currentUser.full_name ||
              post.client.id === currentUser.id);

          return (
            isCm ||
            isCmViewingModeratorPostForAssignedClient ||
            isModeratorAllowed ||
            isClient
          );
        });

        setAllPosts(authorizedPosts);

        const filteredPosts = authorizedPosts.filter((post) => {
          const matchesCreator = creatorFilter
            ? post.creator?.full_name === creatorFilter ||
            post.creator?.email?.split("@")[0] === creatorFilter
            : true;
          const matchesStatus =
            statusFilters && statusFilters.length > 0
              ? statusFilters.includes(post.status || "")
              : true;
          const matchesClient = clientFilter
            ? post.client?.full_name === clientFilter ||
            post.client?.email?.split("@")[0] === clientFilter
            : true;
          return matchesCreator && matchesStatus && matchesClient;
        });

        console.log(
          `After filtering: ${filteredPosts.length} posts will be displayed`,
          filteredPosts,
        );
        setScheduledPosts(filteredPosts);
      } catch (error) {
        console.error("Error fetching scheduled posts:", error);
      } finally {
        setLoadingPosts(false);
      }
    },
    [assignedCMs, cmAssignedClients, currentUser, sanitizePostData, userRole],
  );

  useEffect(() => {
    fetchAssignedCMs();
    fetchCMAssignedClients();
  }, [fetchAssignedCMs, fetchCMAssignedClients]);

  useEffect(() => {
    const loadAssignedClients = async () => {
      if (!currentUser) return;

      const cacheKey = `assigned_clients_${userRole}_${currentUser.id}`;

      // Check cache first
      const cachedClients =
        getCachedData<{ id: number; label: string; email?: string }[]>(
          cacheKey,
        );
      if (cachedClients) {
        console.log("Using cached assigned clients");
        setAssignedClients(cachedClients);
        return;
      }

      try {
        console.log("Fetching assigned clients from API");
        if (userRole === "moderator") {
          const res = await moderatorsService.getClients();
          if (Array.isArray(res)) {
            const clients = res.map((c) => ({
              id: c.id,
              label: c.full_name || c.email.split("@")[0],
              email: c.email,
            }));
            setAssignedClients(clients);
            setCachedData(cacheKey, clients);
          }
        } else if (userRole === "community_manager") {
          const res = await postService.getAssignedClients();
          if (Array.isArray(res)) {
            const clients = res.map((c) => ({
              id: c.id,
              label: c.name || c.email.split("@")[0],
              email: c.email,
            }));
            setAssignedClients(clients);
            setCachedData(cacheKey, clients);
          }
        } else {
          const emptyClients: { id: number; label: string; email?: string }[] =
            [];
          setAssignedClients(emptyClients);
          setCachedData(cacheKey, emptyClients);
        }
      } catch {
        setAssignedClients([]);
      }
    };
    loadAssignedClients();
  }, [currentUser, userRole]);

  useEffect(() => {
    if (currentUser) {
      fetchScheduledPosts(filterCreator, selectedStatuses, filterClient);
    }
  }, [
    fetchScheduledPosts,
    filterCreator,
    selectedStatuses,
    filterClient,
    currentDate,
    calendarView,
    currentUser,
  ]);

  const navigateToView = (date: Date, view: typeof calendarView) => {
    setCurrentDate(date);
    setCalendarView(view);
    setSelectedDate(date);
  };

  const creatorsWithPosts = useMemo(() => {
    const seen = new Set<string>();
    const list: { name: string }[] = [];
    for (const post of allPosts) {
      const name =
        post.creator?.full_name || post.creator?.email?.split("@")[0];
      if (name && !seen.has(name)) {
        seen.add(name);
        list.push({ name });
      }
    }
    return list;
  }, [allPosts]);

  const assignedCMsWithPosts = useMemo(() => {
    return assignedCMs.filter((cm) =>
      allPosts.some(
        (p) =>
          p.creator?.email === cm.email ||
          p.creator?.full_name === cm.full_name,
      ),
    );
  }, [assignedCMs, allPosts]);

  const clientsWithPosts = useMemo(() => {
    const seen = new Map<number, { id: number; label: string }>();
    for (const post of allPosts) {
      if (post.client?.id) {
        const label =
          post.client.full_name ||
          post.client.email?.split("@")[0] ||
          String(post.client.id);
        if (!seen.has(post.client.id)) {
          seen.set(post.client.id, { id: post.client.id, label });
        }
      }
    }
    return Array.from(seen.values());
  }, [allPosts]);

  const creatorOptions = useMemo(() => {
    const names = new Set<string>();
    const push = (name?: string | null) => {
      if (!name) return;
      names.add(name);
    };

    for (const { name } of creatorsWithPosts) push(name);

    if (userRole === "moderator") {
      for (const cm of assignedCMsWithPosts) {
        push(cm.full_name || cm.email?.split("@")[0] || null);
      }
    }

    if (userRole === "community_manager") {
      const self = currentUser?.full_name || currentUser?.email?.split("@")[0];
      if (self && [...names].some((n) => n === self)) {
        return [self];
      }
    }

    return [...names];
  }, [creatorsWithPosts, assignedCMsWithPosts, currentUser, userRole]);

  const clientOptions = useMemo(() => {
    let clients = clientsWithPosts;
    if (userRole === "moderator" || userRole === "community_manager") {
      const assignedIds = new Set(assignedClients.map((a) => a.id));
      const assignedEmails = new Set(
        assignedClients.map((a) => a.email).filter(Boolean) as string[],
      );
      clients = clients.filter(
        (c) =>
          assignedIds.has(c.id) ||
          assignedEmails.has(
            allPosts.find((p) => p.client?.id === c.id)?.client?.email || "",
          ),
      );
    }
    return clients.map((c) => c.label);
  }, [clientsWithPosts, assignedClients, allPosts, userRole]);

  const goToPrevious = () => {
    setCurrentDate((prev) => {
      switch (calendarView) {
        case "week":
          return addWeeks(prev, -1);
        case "month":
          return subMonths(prev, 1);
        case "quarter":
          return subQuarters(prev, 1);
        case "year":
          return subYears(prev, 1);
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
          return addMonths(prev, 1);
        case "quarter":
          return addQuarters(prev, 1);
        case "year":
          return addYears(prev, 1);
        default:
          return prev;
      }
    });
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const handleSearchYear = () => {
    if (searchYear) {
      const year = parseInt(searchYear);
      if (!isNaN(year) && year >= 1000 && year <= 9999) {
        const newDate = new Date(year, 0, 1);
        setCurrentDate(newDate);
        setCalendarView("year");
      } else {
        toast.error("Please enter a valid year (e.g., 2025)");
      }
    }
  };

  const renderCalendarHeader = () => {
    switch (calendarView) {
      case "week":
        const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
        const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
        return `${format(weekStart, "MMM d")} - ${format(weekEnd, "MMM d, yyyy")}`;
      case "month":
        return format(currentDate, "MMMM yyyy").toUpperCase();
      case "quarter":
        return `Q${Math.floor(currentDate.getMonth() / 3) + 1} ${format(currentDate, "yyyy")}`;
      case "year":
        return format(currentDate, "yyyy");
      default:
        return format(currentDate, "MMMM yyyy");
    }
  };

  // Original calendar grid implementation
  const CalendarGridView = () => {
    switch (calendarView) {
      case "week": {
        const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
        const days = eachDayOfInterval({
          start: weekStart,
          end: addDays(weekStart, 6),
        });

        return (
          <div className="flex h-[660px] border-t border-stroke dark:border-dark-3">
            <div className="w-32 border-r border-stroke dark:border-dark-3">
              {days.map((day, index) => (
                <div
                  key={index}
                  onClick={() => {
                    setSelectedDate(day);
                  }}
                  className={`h-24 cursor-pointer p-3 text-center transition-colors ${isSameDay(day, new Date())
                    ? "dark:text-primary-dark bg-primary/10 text-primary"
                    : "text-dark dark:text-white"
                    } ${isSameDay(day, selectedDate)
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
                                post.status === "published" ||
                                post.status === "pending" ||
                                post.status === "rejected")
                            );
                          })
                          .map((post) => {
                            // Get status styling to match PostTable
                            const getStatusStyle = (status: string) => {
                              switch (status) {
                                case "pending":
                                  return {
                                    bg: "bg-yellow-50 dark:bg-yellow-900 dark:bg-opacity-30",
                                    text: "text-yellow-600 dark:text-yellow-500",
                                    icon: (
                                      <Clock className="h-4 w-4 text-amber-600" />
                                    ),
                                    hover:
                                      "hover:bg-yellow-100 dark:hover:bg-yellow-800",
                                  };
                                case "rejected":
                                  return {
                                    bg: "bg-red-50 dark:bg-red-900 dark:bg-opacity-20",
                                    text: "text-red-600 dark:text-red-700",
                                    icon: (
                                      <XCircle className="h-4 w-4 text-red-600" />
                                    ),
                                    hover:
                                      "hover:bg-red-100 dark:hover:bg-red-800",
                                  };
                                case "scheduled":
                                  return {
                                    bg: "bg-purple-50 dark:bg-purple-950 dark:bg-opacity-30",
                                    text: "text-purple-600 dark:text-purple-400",
                                    icon: (
                                      <Calendar className="h-4 w-4 text-violet-700" />
                                    ),
                                    hover:
                                      "hover:bg-purple-100 dark:hover:bg-purple-800",
                                  };
                                case "published":
                                  return {
                                    bg: "bg-green-50 dark:bg-green-900 dark:bg-opacity-30",
                                    text: "text-green-600 dark:text-green-500",
                                    icon: (
                                      <CheckCircle className="h-4 w-4 text-green-600" />
                                    ),
                                    hover:
                                      "hover:bg-green-100 dark:hover:bg-green-800",
                                  };
                                default:
                                  return {
                                    bg: "bg-gray-50 dark:bg-gray-900 dark:bg-opacity-30",
                                    text: "text-gray-600 dark:text-gray-500",
                                    icon: (
                                      <Clock className="h-4 w-4 text-gray-600" />
                                    ),
                                    hover:
                                      "hover:bg-gray-100 dark:hover:bg-gray-800",
                                  };
                              }
                            };

                            const statusStyle = getStatusStyle(
                              post.status || "pending",
                            );

                            return (
                              <div
                                key={post.id}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedPost(post);
                                }}
                                className={`mb-2 flex cursor-pointer items-center gap-2 rounded-lg p-2 text-sm transition-all ${statusStyle.bg} ${statusStyle.text} ${statusStyle.hover} hover:shadow-md`}
                              >
                                {/* Status Icon */}
                                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-white dark:bg-gray-700">
                                  {statusStyle.icon}
                                </div>

                                {/* Post Title and Platform */}
                                <div className="flex w-full items-center justify-between">
                                  <div className="flex flex-1 justify-between truncate">
                                    <span className="font-medium">
                                      {post.title}
                                    </span>
                                    <span className="flex items-center gap-2 text-gray-700 dark:text-gray-200">
                                      {post.client?.full_name ||
                                        post.client?.email.split("@")[0]}
                                    </span>
                                  </div>
                                  <div
                                    className={`ml-2 flex items-center gap-2 rounded-full px-2 py-1 text-sm font-semibold ${post.platform === "Facebook"
                                      ? "bg-blue-200 text-blue-800 dark:bg-blue-800 dark:text-blue-200"
                                      : post.platform === "Instagram"
                                        ? "bg-pink-200 text-pink-800 dark:bg-pink-800 dark:text-pink-200"
                                        : "bg-gray-200 text-gray-800 dark:bg-gray-800 dark:text-gray-200"
                                      }`}
                                  >
                                    {platformIcons[post.platform] ||
                                      platformIcons[
                                      post.platform?.toLowerCase()
                                      ] ||
                                      null}
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
                            );
                          })}
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
                        className={`relative h-32 cursor-pointer border border-stroke p-2 transition-colors dark:border-dark-3 md:p-3 ${!day
                          ? "bg-gray-1 dark:bg-dark-2"
                          : "hover:bg-gray-2 dark:hover:bg-dark-2"
                          } ${day && isSameDay(day, new Date())
                            ? "dark:bg-primary-dark/20 bg-primary/10"
                            : ""
                          } ${day && isSameDay(day, selectedDate)
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
                                .map((post) => {
                                  // Get status styling for month view
                                  const getMonthStatusStyle = (
                                    status: string,
                                  ) => {
                                    switch (status) {
                                      case "pending":
                                        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
                                      case "rejected":
                                        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
                                      case "scheduled":
                                        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
                                      case "published":
                                        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
                                      default:
                                        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
                                    }
                                  };

                                  return (
                                    <div
                                      key={post.id}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedPost(post);
                                      }}
                                      className={`h-6 cursor-pointer truncate rounded px-2 py-1 text-xs ${getMonthStatusStyle(post.status || "pending")}`}
                                    >
                                      {post.title}
                                    </div>
                                  );
                                })}
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

                        // Get quarter view styling based on post statuses
                        const getQuarterDayStyle = (posts: ScheduledPost[]) => {
                          if (posts.length === 0) return "";

                          // Count posts by status
                          const statusCounts = posts.reduce(
                            (acc, post) => {
                              const status = post.status || "pending";
                              acc[status] = (acc[status] || 0) + 1;
                              return acc;
                            },
                            {} as Record<string, number>,
                          );

                          // Priority: published > scheduled > pending > rejected
                          if (statusCounts.published > 0) {
                            return "bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-800 dark:text-green-200 dark:hover:bg-green-700";
                          } else if (statusCounts.scheduled > 0) {
                            return "bg-purple-100 text-purple-800 hover:bg-purple-200 dark:bg-purple-800 dark:text-purple-200 dark:hover:bg-purple-700";
                          } else if (statusCounts.pending > 0) {
                            return "bg-yellow-100 text-yellow-800 hover:bg-yellow-200 dark:bg-yellow-800 dark:text-yellow-200 dark:hover:bg-yellow-700";
                          } else if (statusCounts.rejected > 0) {
                            return "bg-red-100 text-red-800 hover:bg-red-200 dark:bg-red-800 dark:text-red-200 dark:hover:bg-red-700";
                          }
                          return "bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700";
                        };

                        return (
                          <div
                            key={i}
                            className={`relative flex h-8 cursor-pointer items-center justify-center rounded text-sm ${isSameDay(day, new Date())
                              ? "dark:bg-primary-dark bg-primary text-white"
                              : isCurrentMonth && dayPosts.length > 0
                                ? getQuarterDayStyle(dayPosts)
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

                    const monthDate = addMonths(
                      startOfYear(currentDate),
                      monthIndex,
                    );

                    return (
                      <td
                        key={monthIndex}
                        className="w-1/4 p-4 align-top hover:bg-gray-2 dark:hover:bg-dark-2"
                        onClick={() => navigateToView(monthDate, "month")}
                      >
                        <div
                          className={`mb-2 text-center font-medium ${isSameMonth(new Date(), monthDate)
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

                              // Get year view styling based on post statuses
                              const getYearDayStyle = (
                                posts: ScheduledPost[],
                              ) => {
                                if (posts.length === 0) return "";

                                // Count posts by status
                                const statusCounts = posts.reduce(
                                  (acc, post) => {
                                    const status = post.status || "pending";
                                    acc[status] = (acc[status] || 0) + 1;
                                    return acc;
                                  },
                                  {} as Record<string, number>,
                                );

                                // Priority: published > scheduled > pending > rejected
                                if (statusCounts.published > 0) {
                                  return "bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-800 dark:text-green-200 dark:hover:bg-green-700";
                                } else if (statusCounts.scheduled > 0) {
                                  return "bg-purple-100 text-purple-800 hover:bg-purple-200 dark:bg-purple-800 dark:text-purple-200 dark:hover:bg-purple-700";
                                } else if (statusCounts.pending > 0) {
                                  return "bg-yellow-100 text-yellow-800 hover:bg-yellow-200 dark:bg-yellow-800 dark:text-yellow-200 dark:hover:bg-yellow-700";
                                } else if (statusCounts.rejected > 0) {
                                  return "bg-red-100 text-red-800 hover:bg-red-200 dark:bg-red-800 dark:text-red-200 dark:hover:bg-red-700";
                                }
                                return "bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700";
                              };

                              return (
                                <div
                                  key={i}
                                  className={`relative flex h-6 cursor-pointer items-center justify-center rounded text-xs ${isToday
                                    ? "dark:bg-primary-dark bg-primary text-white"
                                    : isCurrentMonth && dayPosts.length > 0
                                      ? getYearDayStyle(dayPosts)
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

  const onDragEnd = (event: DragEndEvent) => {
    // Drag and drop logic placeholder
    console.log("Drag ended", event);
  };

  const renderPreview = () => {
    if (!selectedPost) return null;

    // Enhanced debug logging
    console.log("=== RENDER PREVIEW DEBUG ===");
    console.log("Selected Post:", selectedPost);
    console.log("Direct Platform:", selectedPost.platform);
    console.log("Platform Page:", selectedPost.platformPage);
    console.log(
      "Platforms array:",
      (selectedPost as unknown as Record<string, unknown>).platforms,
    );
    console.log("All keys in selectedPost:", Object.keys(selectedPost));

    // Get media files from the post
    const mediaUrls = selectedPost.media?.map((media) => media.file) || [];

    // Try to get platform from multiple sources
    let platform: string | undefined = selectedPost.platform;
    let pageName = "Page";

    // If platforms array exists, try to get the platform from there
    const platformsArray = (selectedPost as unknown as Record<string, unknown>)
      .platforms;
    if (
      platformsArray &&
      Array.isArray(platformsArray) &&
      platformsArray.length > 0
    ) {
      const platformData = platformsArray[0] as Record<string, unknown>; // Take first platform
      if (typeof platformData.platform === "string") {
        platform = platformData.platform;
      }
      if (typeof platformData.page_name === "string") {
        pageName = platformData.page_name;
      }
    }

    // Fallback to platformPage if available
    if (!platform && selectedPost.platformPage?.platform) {
      platform = selectedPost.platformPage.platform;
    }
    if (selectedPost.platformPage?.page_name) {
      pageName = selectedPost.platformPage.page_name;
    }

    const normalizedPlatform = platform?.toLowerCase();

    // Render appropriate preview based on platform
    switch (normalizedPlatform) {
      case "facebook":
        return (
          <FacebookPostPreview
            content={selectedPost.description}
            media={mediaUrls}
            pageName={pageName}
          />
        );
      case "instagram":
        return (
          <InstagramPostPreview
            content={selectedPost.description}
            media={mediaUrls}
            pageName={pageName}
          />
        );
      case "linkedin":
        return (
          <LinkedinPostPreview
            content={selectedPost.description}
            media={mediaUrls}
            pageName={pageName}
          />
        );
      default:
        console.log(
          "Unknown platform, defaulting to Facebook. Platform was:",
          platform,
        );
        return (
          <FacebookPostPreview
            content={selectedPost.description}
            media={mediaUrls}
            pageName={pageName}
          />
        );
    }
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="mx-[-24px] border-b border-gray-200 px-6 pb-4 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
              Social Dashboard
            </h1>

            {/* Month Navigation */}
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={goToPrevious}
                className="hover:bg-gray-200 dark:hover:bg-gray-700"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <h2 className="min-w-[200px] text-center text-lg font-medium text-gray-700 dark:text-gray-300">
                {renderCalendarHeader()}
              </h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={goToNext}
                className="hover:bg-gray-200 dark:hover:bg-gray-700"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Right Side Controls */}
          <div className="flex items-center space-x-4">
            <UserPresence />

            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                fetchScheduledPosts(
                  filterCreator,
                  selectedStatuses,
                  filterClient,
                )
              }
              disabled={loadingPosts}
            >
              <RefreshCw
                className={`mr-1 h-4 w-4 ${loadingPosts ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>
            {/* Filters */}
            <div className="flex items-center space-x-3">
              {/* All Creators */}
              <Select
                value={filterCreator || "all"}
                onValueChange={(value) =>
                  setFilterCreator(value === "all" ? null : value)
                }
                disabled={loadingCMs}
                open={openSelect === "creator"}
                onOpenChange={(open) => {
                  if (open) {
                    setOpenSelect("creator");
                  } else {
                    setOpenSelect(null);
                  }
                }}
              >
                <SelectTrigger className="w-48">
                  <SelectValue
                    placeholder={loadingCMs ? "Loading..." : "All Creators"}
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    {loadingCMs ? "Loading..." : "All Creators"}
                  </SelectItem>
                  {creatorOptions.map((name) => (
                    <SelectItem key={`creator-${name}`} value={name}>
                      {name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {/* All Clients */}
              {userRole !== "client" && (
                <Select
                  value={filterClient || "all"}
                  onValueChange={(value) =>
                    setFilterClient(value === "all" ? null : value)
                  }
                  open={openSelect === "client"}
                  onOpenChange={(open) => {
                    if (open) {
                      setOpenSelect("client");
                    } else {
                      setOpenSelect(null);
                    }
                  }}
                >
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="All Clients" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Clients</SelectItem>
                    {clientOptions.map((label) => (
                      <SelectItem key={`client-${label}`} value={label}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Controls Bar */}
      <div className="mx-[-24px] border-b border-gray-200 px-6 py-4 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {/* Search */}
            <div className="flex items-center space-x-2">
              <Input
                placeholder="Enter year (e.g., 2025)"
                className="w-48 border-gray-300 bg-white dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400"
                value={searchYear}
                onChange={(e) => setSearchYear(e.target.value)}
              />
              <Button onClick={handleSearchYear} className="font-medium bg-primary text-white hover:bg-primary/90 dark:hover:bg-primary/80">
                <Search className="mr-2 h-4 w-4" />
                Search
              </Button>
            </div>

            {/* View Options */}
            <div className="flex items-center space-x-1 rounded-lg border border-gray-200 bg-gray-100 p-1 text-black dark:border-gray-800 dark:bg-gray-800 dark:text-white">
              <Button variant="ghost" size="sm" onClick={goToToday}>
                Today
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className={
                  calendarView === "week"
                    ? "bg-white shadow-sm dark:bg-gray-600 dark:text-white"
                    : ""
                }
                onClick={() => setCalendarView("week")}
              >
                Week
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className={
                  calendarView === "month"
                    ? "bg-white shadow-sm dark:bg-gray-600 dark:text-white"
                    : ""
                }
                onClick={() => setCalendarView("month")}
              >
                Month
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className={
                  calendarView === "quarter"
                    ? "bg-white shadow-sm dark:bg-gray-600 dark:text-white"
                    : ""
                }
                onClick={() => setCalendarView("quarter")}
              >
                Quarter
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className={
                  calendarView === "year"
                    ? "bg-white shadow-sm dark:bg-gray-600 dark:text-white"
                    : ""
                }
                onClick={() => setCalendarView("year")}
              >
                Year
              </Button>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <span className="mr-2 text-sm text-gray-600 dark:text-gray-300">
              Status:
            </span>
            <div className="flex items-center space-x-1">
              {statusConfig.map(
                ({ key, label, icon: Icon, color, bgColor, borderColor }) => {
                  const isSelected = selectedStatuses.includes(key);
                  return (
                    <button
                      key={key}
                      onClick={() => toggleStatus(key)}
                      className={`flex items-center space-x-1 rounded-lg border px-3 py-2 transition-all duration-200 ${isSelected
                        ? `${bgColor} ${borderColor} ${color} shadow-sm`
                        : "border-gray-200 bg-white text-gray-500 hover:bg-gray-50 dark:border-gray-500 dark:bg-gray-600 dark:text-gray-200"
                        } `}
                      title={`Filter by ${label}`}
                    >
                      <Icon className="h-4 w-4" />
                      <span className="text-xs font-medium">{label}</span>
                    </button>
                  );
                },
              )}
            </div>
            {selectedStatuses.length > 0 && (
              <button
                onClick={() => setSelectedStatuses([])}
                className="ml-2 text-xs text-gray-400 hover:text-gray-600"
                title="Clear all filters"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}

      <Tabs
        value={activeTab}
        onValueChange={(value) =>
          setActiveTab(value as "calendar" | "post_table")
        }
        className="space-y-6 py-6"
      >
        <div className="flex items-center justify-between">
          <TabsList className="gap-2 border border-gray-300 bg-gray-100 font-medium dark:border-gray-700 dark:bg-gray-800">
            <TabsTrigger
              value="calendar"
              className="flex items-center space-x-2 bg-white shadow-sm data-[state=active]:bg-secondary data-[state=active]:text-white dark:bg-gray-700 dark:text-gray-300 dark:data-[state=active]:bg-secondary dark:data-[state=active]:bg-opacity-60"
            >
              <CalendarDays className="h-4 w-4" />
              <span>Calendar</span>
            </TabsTrigger>
            <TabsTrigger
              value="post_table"
              className="flex items-center space-x-2 bg-white shadow-sm data-[state=active]:bg-secondary data-[state=active]:text-white dark:bg-gray-700 dark:text-gray-300 dark:data-[state=active]:bg-secondary dark:data-[state=active]:bg-opacity-60"
            >
              <Kanban className="h-4 w-4" />
              <span>Posts Table</span>
            </TabsTrigger>
          </TabsList>

          <Link href="/content" className="block w-fit">
            <button
              type="button"
              className="flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-primary px-8 py-2 text-lg font-medium text-white transition hover:bg-opacity-90 disabled:opacity-80"
            >
              Create New Post
            </button>
          </Link>
        </div>
        <TabsContent value="calendar">
          {/* Calendar View - Using original simple structure */}
          <div
            className={`overflow-hidden dark:shadow-card ${activeTab === "calendar" ? "rounded-lg bg-white shadow-lg dark:bg-gray-800" : ""}`}
          >
            {calendarView === "month" ? (
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
            )}
          </div>
        </TabsContent>

        <TabsContent value="post_table">
          {/* Posts Table - Using original simple design */}
          <PostTable
            posts={scheduledPosts}
            onRefresh={handleRefresh}
            currentDate={currentDate}
            calendarView={calendarView}
            onPostClick={setSelectedPost}
            onDragEnd={onDragEnd}
            canApproveReject={canApproveReject}
            onApprove={handleApprove}
            onReject={handleReject}
          />
        </TabsContent>
      </Tabs>

      {selectedPost && (
        <PostCardModal
          selectedPost={selectedPost}
          setSelectedPost={setSelectedPost}
          fetchScheduledPosts={fetchScheduledPosts}
          renderPreview={renderPreview}
          currentUser={currentUserForModal}
          onApprove={handleApprove}
          onReject={handleReject}
        />
      )}

      {/* Multi-Post Selection Modal */}
      <MultiPostModal
        visible={showMultiPostModal && !!selectedDay}
        day={selectedDay}
        posts={selectedDayPosts}
        onClose={() => {
          setShowMultiPostModal(false);
          setSelectedDayPosts([]);
          setSelectedDay(null);
        }}
        onPick={(post) => {
          setSelectedPost(post);
          setShowMultiPostModal(false);
          setSelectedDayPosts([]);
          setSelectedDay(null);
        }}
      />

      {/* Override Client Approval Confirmation Modal */}
      <Dialog open={showOverrideModal} onOpenChange={setShowOverrideModal}>
        <DialogContent className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-gray-900 dark:text-white">Override Client Approval</DialogTitle>
            <DialogDescription className="text-gray-600 dark:text-gray-300">
              Do you want to validate and schedule this post without client
              approval?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowOverrideModal(false);
                setPendingValidationPostId(null);
              }}
              className="bg-white text-gray-700 border-gray-300 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-700"
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (pendingValidationPostId) {
                  handleValidatePost(pendingValidationPostId, true); // Override client approval
                }
                setShowOverrideModal(false);
                setPendingValidationPostId(null);
              }}
              className="bg-primary text-white hover:bg-primary/90 dark:hover:bg-primary/80"
            >
              Yes, Override
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
