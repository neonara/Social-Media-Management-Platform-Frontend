import type { ChatWebSocketHook, ChatWebSocketMessage } from "@/types/chat";
import { clientValidateToken } from "@/utils/clientAuthWrapper";
import { getToken } from "@/utils/token";
import { getChatWebSocketUrl } from "@/utils/websocket";
import { useCallback, useEffect, useRef } from "react";

export const useChatWebSocket = (
  onMessage: (message: ChatWebSocketMessage) => void,
): ChatWebSocketHook => {
  const ws = useRef<WebSocket | null>(null);
  const reconnectTimeout = useRef<NodeJS.Timeout | undefined>(undefined);
  const isConnected = useRef(false);
  const currentRoomId = useRef<number | null>(null);

  const connect = useCallback(
    async (roomId?: number) => {
      if (ws.current?.readyState === WebSocket.OPEN) {
        return; // Already connected
      }

      try {
        // Validate token with backend before connecting
        const tokenValidation = await clientValidateToken();

        if (!tokenValidation.isValid) {
          console.error(
            "Invalid or expired token. Cannot connect to chat WebSocket:",
            tokenValidation.error,
          );
          return;
        }

        const token = await getToken();
        if (!token) {
          console.error("No token available for chat WebSocket connection");
          return;
        }

        const wsUrl = getChatWebSocketUrl(token);
        console.log("Attempting to connect to chat WebSocket:", wsUrl);

        ws.current = new WebSocket(wsUrl);

        ws.current.onopen = () => {
          console.log("Chat WebSocket connected");
          isConnected.current = true;

          // Send connection confirmation message
          if (ws.current) {
            ws.current.send(
              JSON.stringify({
                type: "connection_ready",
                message: "Chat WebSocket ready",
              }),
            );
          }

          // If a room ID was provided, join it
          if (roomId) {
            joinRoom(roomId);
          }
        };

        ws.current.onmessage = (event) => {
          try {
            const raw = JSON.parse(event.data);
            console.log("Chat WebSocket message received:", raw);

            // Normalize server message shapes to frontend ChatWebSocketMessage
            // Backend sometimes sends { type: 'message', message: { id, content, sender: { id, name, email }, created_at } }
            // Convert that to { type: 'message_received', room_id?, message: Message }
            if (raw && raw.type === "message" && raw.message) {
              const serverMsg = raw.message;

              const normalizedMessage: any = {
                id: serverMsg.id,
                content: serverMsg.content,
                sender: serverMsg.sender?.id ?? null,
                sender_name:
                  serverMsg.sender?.name ?? serverMsg.sender_name ?? "",
                sender_email:
                  serverMsg.sender?.email ?? serverMsg.sender_email ?? "",
                created_at: serverMsg.created_at ?? new Date().toISOString(),
                // keep optional fields aligned with API Message shape
                is_read: serverMsg.is_read ?? false,
                read_at: serverMsg.read_at ?? null,
              };

              const normalized: ChatWebSocketMessage = {
                type: "message_received",
                room_id: currentRoomId.current ?? raw.room_id,
                message: normalizedMessage,
              };

              onMessage(normalized);
              return;
            }

            // If message already matches frontend schema, pass through
            onMessage(raw as ChatWebSocketMessage);
          } catch (error) {
            console.error("Failed to parse chat WebSocket message:", error);
          }
        };

        ws.current.onclose = (event) => {
          console.log("Chat WebSocket disconnected:", event.code, event.reason);
          isConnected.current = false;
          currentRoomId.current = null;

          // Only reconnect if it wasn't a clean close and we have a valid token
          // 1000 = Normal Closure, 1001 = Going Away, 1008 = Policy Violation (auth failed)
          if (
            event.code !== 1000 &&
            event.code !== 1001 &&
            event.code !== 1008
          ) {
            reconnectTimeout.current = setTimeout(async () => {
              // Validate token before attempting reconnection
              const tokenValidation = await clientValidateToken();
              if (tokenValidation.isValid) {
                console.log("Reconnecting to chat WebSocket...");
                connect(currentRoomId.current || undefined);
              } else {
                console.log(
                  "Token invalid, not reconnecting to chat WebSocket",
                );
              }
            }, 3000);
          }
        };

        ws.current.onerror = (error) => {
          console.error("Chat WebSocket error:", error);
          isConnected.current = false;
        };
      } catch (error) {
        console.error("Failed to connect to chat WebSocket:", error);
      }
    },
    [onMessage],
  );

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
    currentRoomId.current = null;
  }, []);

  const sendMessage = useCallback((message: Record<string, unknown>) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(message));
    } else {
      console.warn(
        "Chat WebSocket not connected, cannot send message:",
        message,
      );
    }
  }, []);

  const joinRoom = useCallback((roomId: number) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(
        JSON.stringify({
          action: "join_room",
          room_id: roomId,
        }),
      );
      currentRoomId.current = roomId;
    } else {
      console.warn("Chat WebSocket not connected, cannot join room:", roomId);
    }
  }, []);

  const leaveRoom = useCallback((roomId: number) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(
        JSON.stringify({
          action: "leave_room",
          room_id: roomId,
        }),
      );
      if (currentRoomId.current === roomId) {
        currentRoomId.current = null;
      }
    } else {
      console.warn("Chat WebSocket not connected, cannot leave room:", roomId);
    }
  }, []);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  // Auto-connect when the hook is used and a valid token exists.
  // This allows the websocket to open as soon as the user is logged in
  // (or when the hook is mounted) without requiring each caller to call connect().
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const tokenValidation = await clientValidateToken();
        if (!mounted) return;
        if (tokenValidation.isValid) {
          // Attempt to connect; connect() is idempotent if already open
          await connect();
        }
      } catch (e) {
        // ignore auto-connect failures
      }
    })();

    return () => {
      mounted = false;
    };
  }, [connect]);

  return {
    isConnected: isConnected.current,
    connect,
    disconnect,
    sendMessage,
    joinRoom,
    leaveRoom,
  };
};
