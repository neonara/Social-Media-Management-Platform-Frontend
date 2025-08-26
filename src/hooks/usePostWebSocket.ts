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
  const [isConnecting, setIsConnecting] = useState(false);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const maxReconnectAttempts = 5;

  const connect = useCallback(async () => {
    // Prevent multiple connection attempts or if we're in the middle of disconnecting
    if (
      isConnecting ||
      isDisconnecting.current ||
      ws.current?.readyState === WebSocket.OPEN
    ) {
      console.log("WebSocket already connecting or connected");
      return;
    }

    try {
      setIsConnecting(true);

      // Validate token with backend before connecting
      const tokenValidation = await clientValidateToken();

      if (!tokenValidation.isValid) {
        console.error(
          "Invalid or expired token. Cannot connect to WebSocket:",
          tokenValidation.error,
        );
        setIsConnecting(false);
        return;
      }

      // Get the token from server action
      const token = await getToken();

      if (!token) {
        console.error(
          "No access token available for WebSocket connection after validation",
        );
        setIsConnecting(false);
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
        setIsConnecting(false);
        setReconnectAttempts(0); // Reset attempts on successful connection

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
        setIsConnecting(false);
        ws.current = null;

        // Only reconnect if it wasn't a manual disconnect and we haven't exceeded max attempts
        if (event.code !== 1000 && reconnectAttempts < maxReconnectAttempts) {
          const nextAttempt = reconnectAttempts + 1;
          setReconnectAttempts(nextAttempt);

          // Exponential backoff: 3s, 6s, 12s, 24s, 48s (max 30s)
          const delay = Math.min(3000 * Math.pow(2, reconnectAttempts), 30000);
          console.log(
            `Attempting to reconnect in ${delay / 1000} seconds... (Attempt ${nextAttempt}/${maxReconnectAttempts})`,
          );

          reconnectTimeout.current = setTimeout(() => {
            connect();
          }, delay);
        } else if (reconnectAttempts >= maxReconnectAttempts) {
          console.warn(
            "Max reconnection attempts reached. Stopping reconnection.",
          );
        }
      };

      ws.current.onerror = (error) => {
        console.error("WebSocket error:", error);
        setIsConnecting(false);
      };
    } catch (error) {
      console.error("Error connecting to WebSocket:", error);
      setIsConnected(false);
      setIsConnecting(false);
    }
  }, [reconnectAttempts, maxReconnectAttempts, onMessage, isConnecting]);

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
    setIsConnecting(false);
    setIsConnected(false);
    setReconnectAttempts(0);

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
