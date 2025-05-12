"use client";

import {
  Dropdown,
  DropdownContent,
  DropdownTrigger,
} from "@/components/ui/dropdown";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useEffect, useState, useRef, useCallback } from "react";
import { BellIcon } from "./icons";
import {
  fetchNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
  deleteNotification,
  revalidateNotificationsCache,
} from "@/services/notificationService";
import type { Notification as NotificationType } from "@/types/notification";
import { getToken } from "@/utils/token";
import { useNotification } from "@/context/NotificationContext";

export function Notification() {
  const [isOpen, setIsOpen] = useState(false);
  const [isDotVisible, setIsDotVisible] = useState(false);
  const [notifications, setNotifications] = useState<NotificationType[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;
  const isMobile = useIsMobile();
  const { showNotification } = useNotification();

  // Track if the component is mounted to prevent state updates after unmount
  const isMountedRef = useRef(true);

  // Function to refresh notifications data
  const refreshNotifications = useCallback(async () => {
    if (!isMountedRef.current) return;

    setIsLoading(true);
    try {
      // Get fresh data from the server
      const freshData = await revalidateNotificationsCache();

      if (isMountedRef.current) {
        setNotifications(freshData);
        const hasUnread = freshData.some((n: NotificationType) => !n.is_read);
        setIsDotVisible(hasUnread);
      }
    } catch (error) {
      console.error("Error refreshing notifications:", error);
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    // Set mounted flag to true when component mounts
    isMountedRef.current = true;

    const loadNotifications = async () => {
      setIsLoading(true);
      try {
        const data = await fetchNotifications();

        if (isMountedRef.current) {
          setNotifications(data);
          const hasUnread = data.some((n: NotificationType) => !n.is_read);
          setIsDotVisible(hasUnread);
        }
      } catch (error) {
        console.error("Error fetching notifications:", error);
      } finally {
        if (isMountedRef.current) {
          setIsLoading(false);
        }
      }
    };

    const connectWebSocket = async () => {
      // Only connect if not already connecting or connected
      if (
        socketRef.current &&
        (socketRef.current.readyState === WebSocket.CONNECTING ||
          socketRef.current.readyState === WebSocket.OPEN)
      ) {
        return;
      }

      try {
        const token = await getToken();
        if (!token) {
          console.warn("No access token found in cookies");
          return;
        }

        // Close existing socket if it exists
        if (socketRef.current) {
          socketRef.current.close();
        }

        const socket = new WebSocket(
          `ws://127.0.0.1:8000/ws/notifications/?token=${token}`,
        );

        socketRef.current = socket;

        socket.onopen = () => {
          console.log("WebSocket connected");

          reconnectAttemptsRef.current = 0;
        };

        socket.onmessage = (e) => {
          try {
            const data = JSON.parse(e.data);

            if (data.type === "notification_count") {
              if (data.count > 0 && isMountedRef.current) {
                setIsDotVisible(true);
              }
            } else if (data.type === "new_notification") {
              const newNotification: NotificationType = data;
              if (isMountedRef.current) {
                setNotifications((prev) => [newNotification, ...prev]);
                setIsDotVisible(true);

                showNotification(
                  newNotification.message,
                  "success",
                  newNotification.title,
                );
              }
            }
          } catch (err) {
            console.error("Invalid WebSocket data:", e.data, err);
          }
        };

        socket.onclose = (event) => {
          console.log(
            `WebSocket closed with code: ${event.code}, reason: ${event.reason}`,
          );

          if (
            !event.wasClean &&
            reconnectAttemptsRef.current < maxReconnectAttempts &&
            isMountedRef.current
          ) {
            const timeout = Math.min(
              1000 * 2 ** reconnectAttemptsRef.current,
              30000,
            );
            console.log(`Attempting to reconnect in ${timeout / 1000}s...`);

            if (reconnectTimeoutRef.current) {
              clearTimeout(reconnectTimeoutRef.current);
            }

            reconnectTimeoutRef.current = setTimeout(() => {
              reconnectAttemptsRef.current += 1;
              if (isMountedRef.current) {
                connectWebSocket();
              }
            }, timeout);
          }
        };

        socket.onerror = (error) => {
          console.error("WebSocket error:", error);
        };
      } catch (error) {
        console.error("Error setting up WebSocket:", error);
      }
    };

    loadNotifications();
    connectWebSocket();

    return () => {
      // Set mounted flag to false when component unmounts
      isMountedRef.current = false;

      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }

      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
      }
    };
  }, [showNotification]); // Remove socketStatus from the dependency array

  const handleMarkAllAsRead = async () => {
    try {
      await markAllNotificationsAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setIsDotVisible(false);

      // Refresh data after marking all as read to ensure backend state is in sync
      await refreshNotifications();

      console.log("All notifications marked as read");
    } catch (error) {
      console.error("Error marking all as read:", error);
      console.log("Failed to mark notifications as read");
    }
  };

  const handleMarkAsRead = async (notificationId: number) => {
    try {
      await markNotificationAsRead(notificationId);

      // Update local state
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notificationId ? { ...n, is_read: true } : n,
        ),
      );

      // Check if there are any unread notifications left
      const hasUnreadRemaining = notifications.some(
        (n) => n.id !== notificationId && !n.is_read,
      );

      setIsDotVisible(hasUnreadRemaining);

      // Refresh to ensure we have the latest data
      await refreshNotifications();

      return true;
    } catch (error) {
      console.error(
        `Error marking notification ${notificationId} as read:`,
        error,
      );
      return false;
    }
  };

  const handleDeleteNotification = async (notificationId: number) => {
    try {
      await deleteNotification(notificationId);

      // Update local state by removing the deleted notification
      setNotifications((prev) => prev.filter((n) => n.id !== notificationId));

      // Refresh to ensure we have the latest data
      await refreshNotifications();

      return true;
    } catch (error) {
      console.error(`Error deleting notification ${notificationId}:`, error);
      return false;
    }
  };

  return (
    <Dropdown
      isOpen={isOpen}
      setIsOpen={(open) => {
        setIsOpen(open);
        if (open) setIsDotVisible(false);
      }}
    >
      <DropdownTrigger
        className="grid size-12 place-items-center rounded-full border bg-gray-2 text-dark outline-none hover:text-primary focus-visible:border-primary focus-visible:text-primary dark:border-dark-4 dark:bg-dark-3 dark:text-white dark:focus-visible:border-primary"
        aria-label="View Notifications"
      >
        <span className="relative">
          <BellIcon />
          {isDotVisible && (
            <span
              className={cn(
                "absolute right-0 top-0 z-1 size-2 rounded-full bg-red-light ring-2 ring-gray-2 dark:ring-dark-3",
              )}
            >
              <span className="absolute inset-0 -z-1 animate-ping rounded-full bg-red-light opacity-75" />
            </span>
          )}
        </span>
      </DropdownTrigger>

      <DropdownContent
        align={isMobile ? "end" : "center"}
        className="border border-stroke bg-white px-3.5 py-3 shadow-md dark:border-dark-3 dark:bg-gray-dark min-[350px]:min-w-[20rem]"
      >
        <div className="mb-1 flex items-center justify-between px-2 py-1.5">
          <span className="text-lg font-medium text-dark dark:text-white">
            Notifications
          </span>
          <button
            onClick={handleMarkAllAsRead}
            className="rounded-md bg-primary px-[9px] py-0.5 text-xs font-medium text-white"
          >
            Mark all as read
          </button>
        </div>

        <ul className="mb-3 max-h-[23rem] space-y-1.5 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-primary"></div>
            </div>
          ) : notifications.length === 0 ? (
            <div className="py-4 text-center text-dark-5 dark:text-dark-6">
              No notifications yet
            </div>
          ) : (
            notifications.map((item, index) => (
              <li
                key={index}
                role="menuitem"
                className="border-b border-gray-100 last:border-none dark:border-dark-4"
              >
                <Link
                  href={item.url}
                  onClick={() => {
                    handleMarkAsRead(item.id);
                    setIsOpen(false);
                  }}
                  className="relative flex w-full items-center gap-4 rounded-lg px-2 py-1.5 outline-none hover:bg-gray-2 focus-visible:bg-gray-2 dark:hover:bg-dark-3 dark:focus-visible:bg-dark-3"
                >
                  <div>
                    <strong className="block text-sm font-medium text-dark dark:text-white">
                      {item.title}
                    </strong>
                    <span className="w-full break-words text-sm font-medium text-dark-5 dark:text-dark-6">
                      {item.message}
                    </span>
                    <br />
                    <span className="truncate text-sm font-medium text-dark-5 dark:text-dark-6">
                      {new Date(item.created_at).toLocaleTimeString([], {
                        year: "numeric",
                        month: "short", // 'May', 'Jan'
                        day: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                        hour12: true,
                      })}
                    </span>
                  </div>
                  {!item.is_read && (
                    <span
                      className={cn(
                        "absolute left-0 top-0 z-1 size-2 rounded-full bg-red-light ring-2 ring-gray-2 dark:ring-dark-3",
                      )}
                    >
                      <span className="absolute inset-0 -z-1 animate-ping rounded-full bg-red-light opacity-75" />
                    </span>
                  )}
                </Link>
              </li>
            ))
          )}
        </ul>

        <Link
          href="#"
          onClick={() => setIsOpen(false)}
          className="block rounded-lg border border-primary p-2 text-center text-sm font-medium tracking-wide text-primary outline-none transition-colors hover:bg-blue-light-5 focus:bg-blue-light-5 focus:text-primary focus-visible:border-primary dark:border-dark-3 dark:text-dark-6 dark:hover:border-dark-5 dark:hover:bg-dark-3 dark:hover:text-dark-7 dark:focus-visible:border-dark-5 dark:focus-visible:bg-dark-3 dark:focus-visible:text-dark-7"
        >
          See all notifications
        </Link>
      </DropdownContent>
    </Dropdown>
  );
}
