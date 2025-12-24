"use client";

import { useNotification } from "@/context/NotificationContext";
import { useUser } from "@/context/UserContext";
import { useChatWebSocket } from "@/hooks/useChatWebSocket";
import { chatService } from "@/services/chatService";
import type { ChatWebSocketMessage } from "@/types/chat";
import { getDisplayName } from "@/utils/displayName";
import React, { useEffect, useRef } from "react";

/**
 * ChatNotifier
 * - Connects to the chat WebSocket at app-level and shows a desktop toast/notification
 *   when messages arrive while the user isn't on the chat page (or tab is hidden).
 * - Also dispatches a window event `chat:message` with the payload so any page
 *   can listen and react (e.g., update badge counts).
 */
export const ChatNotifier: React.FC = () => {
  const handlerRef = useRef<((m: ChatWebSocketMessage) => void) | null>(null);
  // Use the shared NotificationProvider rather than a separate toast system
  const { showNotification } = useNotification();

  useEffect(() => {
    // Request Notification permission eagerly so we can show desktop notifications
    // we will use in-app notifications (toasts) only — avoid browser/desktop notifications
  }, []);

  // Stable onMessage delegator
  const onMessage = (msg: ChatWebSocketMessage) => {
    try {
      // Dispatch event so any mounted Chat UI can pick it up
      if (typeof window !== "undefined") {
        // store latest message per room in a small in-memory cache so pages
        // that mount after the event can still pick up the latest state
        // (useful during navigation where ordering may cause missed events)
        // @ts-ignore global cache
        window.__CHAT_LATEST = window.__CHAT_LATEST || {};
        // store the raw message object (safe since it's small)
        // @ts-ignore
        window.__CHAT_LATEST[msg.room_id ?? "null"] = msg.message;
        window.dispatchEvent(new CustomEvent("chat:message", { detail: msg }));
      }

      // Only react to actual messages
      if (msg.type !== "message_received" || !msg.message) return;

      const sender = getDisplayName(msg.message) || "New message";
      const body = (msg.message.content || "").toString();

      const pathname =
        typeof window !== "undefined" ? window.location.pathname : "";
      const tabVisible =
        typeof document !== "undefined"
          ? document.visibilityState === "visible"
          : false;

      // Determine whether user is inside a specific chat room route like /chat/123
      const inRoom =
        typeof pathname === "string" && /\/chat\/\d+/.test(pathname);

      // Show notification through the app's NotificationProvider so it behaves
      // the same as other notifications in the app.
      try {
        const short = body.length > 120 ? body.slice(0, 120) + "…" : body;
        // showNotification(message, type, title)
        showNotification(short, "success", sender);
      } catch (e) {
        // eslint-disable-next-line no-console
        console.warn("Failed to show notification", e);
      }
    } catch (e) {
      console.error("ChatNotifier onMessage error", e);
    }
  };

  // Keep stable ref to onMessage
  handlerRef.current = onMessage;

  // Stable handler that delegates to the latest handlerRef — safe to pass to hook
  const stableHandler = React.useCallback(
    (m: ChatWebSocketMessage) => handlerRef.current?.(m),
    [],
  );

  // Call hook at top-level (rules of hooks) and then connect/disconnect in effect
  const { connect, disconnect, joinRoom } = useChatWebSocket(stableHandler);

  const { userProfile, isLoading } = useUser();

  // Connect when the user is authenticated; disconnect on logout.
  useEffect(() => {
    // Wait until user loading is finished
    if (isLoading) return;

    // If there's no authenticated user, ensure websocket is disconnected
    if (!userProfile) {
      disconnect();
      return;
    }

    // If user is authenticated, connect and join rooms
    let mounted = true;
    try {
      const connectAsync = connect as unknown as () => Promise<unknown>;
      const p = connectAsync();
      if (p && typeof (p as Promise<unknown>).catch === "function") {
        (p as Promise<unknown>)
          .then(async () => {
            if (!mounted) return;
            try {
              const rooms = await chatService.getChatRooms();
              rooms.forEach((r: any) => {
                try {
                  joinRoom(r.id);
                } catch (e) {
                  // ignore per-room join failures
                }
              });
            } catch (e) {
              // ignore failures to list/join rooms
            }
          })
          .catch((e: unknown) =>
            console.error("ChatNotifier connect failed", e),
          );
      }
    } catch (e) {
      console.error("ChatNotifier connect threw", e);
    }

    return () => {
      mounted = false;
      // Only disconnect when user logs out or component unmounts
      disconnect();
    };
    // Intentionally include userProfile/isLoading so we react to login/logout
    // connect/disconnect/joinRoom are stable from the hook
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userProfile, isLoading]);

  return null;
};

export default ChatNotifier;
