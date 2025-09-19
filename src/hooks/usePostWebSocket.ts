import { useCallback, useRef, useState } from "react";
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
  data?: Record<string, unknown>;
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
  const isDisconnecting = useRef(false);
  const [isConnected, setIsConnected] = useState(false);

  const connect = useCallback(async () => {
    // Prevent multiple connection attempts
    if (
      ws.current?.readyState === WebSocket.OPEN ||
      ws.current?.readyState === WebSocket.CONNECTING
    ) {
      console.log("WebSocket already connecting or connected");
      return;
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

      // Close existing connection if any
      if (ws.current) {
        ws.current.close();
      }

      const wsUrl = getWebSocketUrl(`/ws/posts/?token=${token}`);
      console.log("Connecting to WebSocket with validated token:", wsUrl);

      ws.current = new WebSocket(wsUrl);

      ws.current.onopen = () => {
        console.log("WebSocket connected successfully");
        setIsConnected(true);

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
        setIsConnected(false);
        ws.current = null;

        // Only reconnect if it wasn't a manual disconnect
        if (event.code !== 1000) {
          console.log("Attempting to reconnect in 3 seconds...");

          reconnectTimeout.current = setTimeout(() => {
            connect();
          }, 3000);
        }
      };

      ws.current.onerror = (error) => {
        console.error("WebSocket error:", error);
      };
    } catch (error) {
      console.error("Error connecting to WebSocket:", error);
      setIsConnected(false);
    }
  }, [onMessage]);

  const disconnect = useCallback(() => {
    // Prevent multiple simultaneous disconnections
    if (isDisconnecting.current) {
      return;
    }

    isDisconnecting.current = true;
    console.log("Manually disconnecting WebSocket");

    // Clear any pending reconnection
    if (reconnectTimeout.current) {
      clearTimeout(reconnectTimeout.current);
      reconnectTimeout.current = undefined;
    }

    // Close the connection if it exists and is not already closed
    if (ws.current && ws.current.readyState !== WebSocket.CLOSED) {
      ws.current.close(1000, "Manual disconnect");
      ws.current = null;
    }

    // Reset state
    setIsConnected(false);

    // Reset the disconnecting flag
    isDisconnecting.current = false;
  }, []);

  const sendMessage = useCallback((message: Record<string, unknown>) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(message));
    } else {
      console.error("WebSocket is not connected");
    }
  }, []);

  // Note: Removed automatic useEffect connection - let the component control when to connect

  return {
    isConnected,
    connect,
    disconnect,
    sendMessage,
  };
};
