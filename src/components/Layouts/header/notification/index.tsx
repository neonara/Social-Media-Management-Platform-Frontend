"use client";

import {
  Dropdown,
  DropdownContent,
  DropdownTrigger,
} from "@/components/ui/dropdown";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
// import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { BellIcon } from "./icons";
import {
  fetchNotifications,
  markAllNotificationsAsRead,
} from "@/services/notifications";
import type { Notification } from "@/types/notification";
import { API_BASE_URL } from "@/config/api";

export function Notification() {
  const [isOpen, setIsOpen] = useState(false);
  const [isDotVisible, setIsDotVisible] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const isMobile = useIsMobile();

  useEffect(() => {
    // Fetch initial notifications
    const loadNotifications = async () => {
      try {
        const data = await fetchNotifications();
        setNotifications(data);
      } catch (error) {
        console.error("Error fetching notifications:", error);
      }
    };

    loadNotifications();

    // WebSocket connection for real-time updates
    const ws = new WebSocket(`${API_BASE_URL}/notifications/`);

    ws.onmessage = (event) => {
      const newNotification = JSON.parse(event.data);
      setNotifications((prev) => [newNotification, ...prev]);
      setIsDotVisible(true); // Show the notification dot for new notifications
    };

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    return () => {
      ws.close();
    };
  }, []);

  const handleMarkAllAsRead = async () => {
    try {
      await markAllNotificationsAsRead();
      setNotifications((prev) =>
        prev.map((notification) => ({ ...notification, read: true })),
      );
      setIsDotVisible(false);
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
    }
  };

  return (
    <Dropdown
      isOpen={isOpen}
      setIsOpen={(open) => {
        setIsOpen(open);

        if (setIsDotVisible) setIsDotVisible(false);
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
          {notifications.map((item, index) => (
            <li key={index} role="menuitem">
              <Link
                href="#"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-4 rounded-lg px-2 py-1.5 outline-none hover:bg-gray-2 focus-visible:bg-gray-2 dark:hover:bg-dark-3 dark:focus-visible:bg-dark-3"
              >
                {/* <Image
                  src={item.image || "/images/default-avatar.png"}
                  className="size-14 rounded-full object-cover"
                  width={200}
                  height={200}
                  alt="User"
                /> */}

                <div>
                  <strong className="block text-sm font-medium text-dark dark:text-white">
                    {item.title}
                  </strong>

                  <span className="truncate text-sm font-medium text-dark-5 dark:text-dark-6">
                    {item.message}
                  </span>
                  <br />
                  <span className="truncate text-sm font-medium text-dark-5 dark:text-dark-6">
                    {item.created_at.split("T")[0]}{" "}
                  </span>
                </div>
              </Link>
            </li>
          ))}
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
