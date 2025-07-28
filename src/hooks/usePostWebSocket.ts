import { useEffect, useRef, useCallback } from "react";
import { getWebSocketUrl } from "@/utils/websocket";
import { clientValidateToken } from "@/utils/clientAuthWrapper";
import { getToken } from "@/utils/token";

export interface PostWebSocketMessage {
  type:
    | "connection_established"
    | "post_updated"
    | "post_created"
    | "post_deleted"
    | "post_status_changed"
    | "error";
  action?: "created" | "updated" | "deleted" | "status_changed";
  data?: Record<string, unknown>; // Changed from post_data to data
  post_id?: string;
  old_status?: string;
  new_status?: string;
  user_id?: string;
  message?: string;
}
export interface PostWebSocketHook {
  isConnected: boolean;
  connect: () => void;
  disconnect: () => void;
  sendMessage: (message: Record<string, unknown>) => void;
}

export const usePostWebSocket = (
  onMessage: (message: PostWebSocketMessage) => void,
): PostWebSocketHook => {
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

      // Get the token from server action
      const token = await getToken();

      if (!token) {
        console.error(
          "No access token available for WebSocket connection after validation",
        );
        return;
      }

      const wsUrl = getWebSocketUrl(`/ws/posts/?token=${token}`);
      console.log("Connecting to WebSocket with validated token:", wsUrl);

      ws.current = new WebSocket(wsUrl);

      ws.current.onopen = () => {
        console.log("WebSocket connected");
        isConnected.current = true;

        // Clear any reconnection timeout
        if (reconnectTimeout.current) {
          clearTimeout(reconnectTimeout.current);
          reconnectTimeout.current = undefined;
        }
      };

      ws.current.onmessage = (event) => {
        try {
          const message: PostWebSocketMessage = JSON.parse(event.data);
          console.log("WebSocket message received:", message);
          onMessage(message);
        } catch (error) {
          console.error("Error parsing WebSocket message:", error);
        }
      };

      ws.current.onclose = (event) => {
        console.log("WebSocket disconnected:", event.code, event.reason);
        isConnected.current = false;

        // Attempt to reconnect after 3 seconds unless it was a manual disconnect
        if (event.code !== 1000) {
          reconnectTimeout.current = setTimeout(() => {
            console.log("Attempting to reconnect WebSocket...");
            connect();
          }, 3000);
        }
      };

      ws.current.onerror = (error) => {
        console.error("WebSocket error:", error);
        isConnected.current = false;
      };
    } catch (error) {
      console.error("Error connecting to WebSocket:", error);
      isConnected.current = false;
    }
  }, [onMessage]);

  const disconnect = useCallback(() => {
    if (reconnectTimeout.current) {
      clearTimeout(reconnectTimeout.current);
      reconnectTimeout.current = undefined;
    }

    if (ws.current) {
      ws.current.close(1000, "Manual disconnect");
      ws.current = null;
    }
    isConnected.current = false;
  }, []);

  const sendMessage = useCallback((message: Record<string, unknown>) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(message));
    } else {
      console.error("WebSocket is not connected");
    }
  }, []);

  useEffect(() => {
    connect();

    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return {
    isConnected: isConnected.current,
    connect,
    disconnect,
    sendMessage,
  };
};
