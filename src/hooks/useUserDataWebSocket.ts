import { useEffect, useRef, useCallback } from "react";
import { getWebSocketUrl } from "@/utils/websocket";
import { clientValidateToken } from "@/utils/clientAuthWrapper";
import { getToken } from "@/utils/token";

export interface UserDataWebSocketMessage {
  type:
    | "connection_established"
    | "user_data_updated"
    | "user_created"
    | "user_deleted"
    | "assignment_changed"
    | "role_changed"
    | "error";
  action?:
    | "created"
    | "updated"
    | "deleted"
    | "assignment_changed"
    | "role_changed";
  data?: Record<string, unknown>;
  user_id?: string;
  changed_by?: string;
  message?: string;
}

export interface UserDataWebSocketHook {
  isConnected: boolean;
  connect: () => void;
  disconnect: () => void;
  sendMessage: (message: Record<string, unknown>) => void;
}

export const useUserDataWebSocket = (
  onMessage: (message: UserDataWebSocketMessage) => void,
): UserDataWebSocketHook => {
  const ws = useRef<WebSocket | null>(null);
  const reconnectTimeout = useRef<NodeJS.Timeout | undefined>(undefined);
  const isConnected = useRef(false);

  const connect = useCallback(async () => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      return; // Already connected
    }

    try {
      // Validate token with backend before connecting
      const tokenValidation = await clientValidateToken();

      if (!tokenValidation.isValid) {
        console.error(
          "Invalid or expired token. Cannot connect to WebSocket:",
          tokenValidation.error,
        );
        return;
      }

      const token = await getToken();
      if (!token) {
        console.error("No token available for WebSocket connection");
        return;
      }

      const wsUrl = getWebSocketUrl("/ws/user_data/");
      console.log("Attempting to connect to user data WebSocket:", wsUrl);

      ws.current = new WebSocket(wsUrl);

      ws.current.onopen = () => {
        console.log("User data WebSocket connected");
        isConnected.current = true;

        // Send authentication message
        if (ws.current && token) {
          ws.current.send(
            JSON.stringify({
              type: "authenticate",
              token: token,
            }),
          );
        }
      };

      ws.current.onmessage = (event) => {
        try {
          const message: UserDataWebSocketMessage = JSON.parse(event.data);
          console.log("User data WebSocket message received:", message);
          onMessage(message);
        } catch (error) {
          console.error("Failed to parse user data WebSocket message:", error);
        }
      };

      ws.current.onclose = (event) => {
        console.log(
          "User data WebSocket disconnected:",
          event.code,
          event.reason,
        );
        isConnected.current = false;

        // Reconnect after 3 seconds unless it was a clean close
        if (event.code !== 1000) {
          reconnectTimeout.current = setTimeout(() => {
            console.log("Reconnecting to user data WebSocket...");
            connect();
          }, 3000);
        }
      };

      ws.current.onerror = (error) => {
        console.error("User data WebSocket error:", error);
        isConnected.current = false;
      };
    } catch (error) {
      console.error("Failed to connect to user data WebSocket:", error);
    }
  }, [onMessage]);

  const disconnect = useCallback(() => {
    if (reconnectTimeout.current) {
      clearTimeout(reconnectTimeout.current);
      reconnectTimeout.current = undefined;
    }

    if (ws.current) {
      ws.current.close(1000, "User initiated disconnect");
      ws.current = null;
    }
    isConnected.current = false;
  }, []);

  const sendMessage = useCallback((message: Record<string, unknown>) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(message));
    } else {
      console.warn("WebSocket not connected, cannot send message:", message);
    }
  }, []);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    isConnected: isConnected.current,
    connect,
    disconnect,
    sendMessage,
  };
};
