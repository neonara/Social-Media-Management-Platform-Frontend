/**
 * Utility functions for WebSocket configuration in different environments
 */

/**
 * Get the appropriate WebSocket URL based on the current environment
 */
export function getWebSocketUrl(path: string = ""): string {
  // Check if we're in the browser
  if (typeof window === "undefined") {
    return "";
  }

  // Use environment variable if available
  if (process.env.NEXT_PUBLIC_WS_URL) {
    const wsUrl = `${process.env.NEXT_PUBLIC_WS_URL}${path}`;
    console.log("WebSocket URL (from env):", wsUrl);
    return wsUrl;
  }

  const { protocol, hostname, port } = window.location;

  // Determine the WebSocket protocol
  const wsProtocol = protocol === "https:" ? "wss:" : "ws:";

  // Handle different deployment scenarios
  let wsHost: string;
  let wsPort: string;

  // Development environment
  if (
    process.env.NODE_ENV === "development" ||
    (hostname === "localhost" && port === "3000")
  ) {
    wsHost = "localhost";
    wsPort = "8000"; // Django dev server port
  }
  // Production environment
  else if (process.env.NODE_ENV === "production") {
    // Accessing through nginx proxy
    if (port === "8081" || port === "8443") {
      wsHost = hostname;
      wsPort = port;
    }
    // Direct access to frontend in Docker (port 3100)
    else if (port === "3100") {
      wsHost = hostname;
      wsPort = "8080"; // Backend Docker port mapping
    }
    // Direct access to backend in Docker
    else if (port === "8080") {
      wsHost = hostname;
      wsPort = port;
    }
    // Production domain (with standard ports)
    else {
      wsHost = hostname;
      wsPort = port || (protocol === "https:" ? "443" : "80");
    }
  }
  // Fallback
  else {
    wsHost = hostname || "localhost";
    wsPort = "8000";
  }

  // Construct the WebSocket URL
  const wsUrl = `${wsProtocol}//${wsHost}:${wsPort}${path}`;

  console.log("WebSocket URL:", wsUrl);
  return wsUrl;
}

/**
 * Get the WebSocket URL for notifications
 */
export function getNotificationWebSocketUrl(token: string): string {
  return getWebSocketUrl(`/ws/notifications/?token=${token}`);
}

/**
 * Get the WebSocket URL for user presence/activity
 */
export function getUserPresenceWebSocketUrl(token: string): string {
  return getWebSocketUrl(`/ws/user_activity/?token=${token}`);
}

/**
 * WebSocket connection with retry logic
 */
export class ReconnectingWebSocket {
  private url: string;
  private protocols?: string | string[];
  private options: {
    maxReconnectAttempts?: number;
    reconnectInterval?: number;
    maxReconnectInterval?: number;
    reconnectDecay?: number;
  };

  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private reconnectTimeoutId: NodeJS.Timeout | null = null;

  public onopen: ((event: Event) => void) | null = null;
  public onclose: ((event: CloseEvent) => void) | null = null;
  public onmessage: ((event: MessageEvent) => void) | null = null;
  public onerror: ((event: Event) => void) | null = null;

  constructor(
    url: string,
    protocols?: string | string[],
    options: {
      maxReconnectAttempts?: number;
      reconnectInterval?: number;
      maxReconnectInterval?: number;
      reconnectDecay?: number;
    } = {},
  ) {
    this.url = url;
    this.protocols = protocols;
    this.options = {
      maxReconnectAttempts: 5,
      reconnectInterval: 1000,
      maxReconnectInterval: 30000,
      reconnectDecay: 1.5,
      ...options,
    };

    this.connect();
  }

  private connect() {
    try {
      this.ws = new WebSocket(this.url, this.protocols);

      this.ws.onopen = (event) => {
        console.log("WebSocket connected");
        this.reconnectAttempts = 0;
        this.onopen?.(event);
      };

      this.ws.onclose = (event) => {
        console.log(
          `WebSocket closed with code: ${event.code}, reason: ${event.reason}`,
        );
        this.onclose?.(event);

        if (!event.wasClean && this.shouldReconnect()) {
          this.scheduleReconnect();
        }
      };

      this.ws.onmessage = (event) => {
        this.onmessage?.(event);
      };

      this.ws.onerror = (event) => {
        console.error("WebSocket error:", event);
        this.onerror?.(event);
      };
    } catch (error) {
      console.error("Error creating WebSocket:", error);
      if (this.shouldReconnect()) {
        this.scheduleReconnect();
      }
    }
  }

  private shouldReconnect(): boolean {
    return this.reconnectAttempts < (this.options.maxReconnectAttempts || 5);
  }

  private scheduleReconnect() {
    if (this.reconnectTimeoutId) {
      clearTimeout(this.reconnectTimeoutId);
    }

    const timeout = Math.min(
      (this.options.reconnectInterval || 1000) *
        Math.pow(this.options.reconnectDecay || 1.5, this.reconnectAttempts),
      this.options.maxReconnectInterval || 30000,
    );

    console.log(
      `Attempting to reconnect in ${timeout / 1000}s... (attempt ${this.reconnectAttempts + 1})`,
    );

    this.reconnectTimeoutId = setTimeout(() => {
      this.reconnectAttempts++;
      this.connect();
    }, timeout);
  }

  public send(data: string | ArrayBufferLike | Blob | ArrayBufferView) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(data);
    } else {
      console.warn("WebSocket is not connected. Message not sent:", data);
    }
  }

  public close(code?: number, reason?: string) {
    if (this.reconnectTimeoutId) {
      clearTimeout(this.reconnectTimeoutId);
      this.reconnectTimeoutId = null;
    }

    if (this.ws) {
      this.ws.close(code, reason);
    }
  }

  public get readyState(): number {
    return this.ws?.readyState ?? WebSocket.CLOSED;
  }
}
