/* eslint-disable @typescript-eslint/no-explicit-any */
type WebSocketCallback = (data: any) => void;

export class WebSocketService {
  private static instance: WebSocketService;
  private ws: WebSocket | null = null;
  private subscribers: Map<string, Set<WebSocketCallback>> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectTimeout = 1000;
  private isConnecting = false;

  private constructor() {
    this.connect();
  }

  static getInstance(): WebSocketService {
    if (!WebSocketService.instance) {
      WebSocketService.instance = new WebSocketService();
    }
    return WebSocketService.instance;
  }

  private connect() {
    if (this.ws?.readyState === WebSocket.OPEN || this.isConnecting) {
      return;
    }

    this.isConnecting = true;

    try {
      // Determine if we're in production
      const isProduction = process.env.NODE_ENV === "production";

      // Use WSS in production, WS in development
      const wsProtocol = isProduction ? "wss://" : "ws://";
      const wsBaseUrl =
        process.env.NEXT_PUBLIC_WS_URL || "websocket.13.61.25.120.sslip.io";

      // Remove any existing protocol
      const cleanWsUrl = wsBaseUrl.replace(/^(wss?:\/\/)/, "");

      this.ws = new WebSocket(`${wsProtocol}${cleanWsUrl}/ws/polls`);

      this.ws.onopen = () => {
        console.log("WebSocket connected");
        this.reconnectAttempts = 0;
        this.isConnecting = false;

        // Resubscribe to all polls
        this.subscribers.forEach((_, pollId) => {
          this.sendSubscription(pollId);
        });
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.poll_id) {
            const subscribers = this.subscribers.get(data.poll_id);
            subscribers?.forEach((callback) => callback(data));
          }
        } catch (error) {
          console.error("Error processing WebSocket message:", error);
        }
      };

      this.ws.onerror = (error) => {
        console.error("WebSocket error:", error);
      };

      this.ws.onclose = () => {
        this.isConnecting = false;
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
          setTimeout(() => {
            this.reconnectAttempts++;
            this.connect();
          }, this.reconnectTimeout * Math.pow(2, this.reconnectAttempts));
        } else {
          console.error("Max reconnection attempts reached");
        }
      };
    } catch (error) {
      console.error("Failed to establish WebSocket connection:", error);
      this.isConnecting = false;
    }
  }

  private sendSubscription(pollId: string) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(
        JSON.stringify({
          type: "Subscribe",
          poll_id: pollId,
        })
      );
    }
  }

  subscribe(pollId: string, callback: WebSocketCallback) {
    if (!this.subscribers.has(pollId)) {
      this.subscribers.set(pollId, new Set());
    }
    this.subscribers.get(pollId)?.add(callback);

    if (this.ws?.readyState === WebSocket.OPEN) {
      this.sendSubscription(pollId);
    } else {
      this.connect();
    }
  }

  unsubscribe(pollId: string, callback: WebSocketCallback) {
    const subscribers = this.subscribers.get(pollId);
    if (subscribers) {
      subscribers.delete(callback);
      if (subscribers.size === 0) {
        this.subscribers.delete(pollId);
      }
    }
  }

  vote(pollId: string, optionId: string) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(
        JSON.stringify({
          type: "Vote",
          poll_id: pollId,
          option_id: optionId,
        })
      );
    } else {
      console.error("WebSocket is not connected");
      this.connect();
    }
  }

  public subscribeToResults(pollId: string) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(
        JSON.stringify({
          type: "SubscribeResults",
          poll_id: pollId,
          live: true,
        })
      );
    }
  }

  public onPollUpdate(callback: (pollId: string, updatedPoll: any) => void) {
    if (this.ws) {
      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === "PollUpdate" && data.poll) {
            callback(data.poll_id, data.poll);
          } else if (data.type === "PollDeleted" && data.poll_id) {
            callback(data.poll_id, null); // null indicates deletion
          }
        } catch (error) {
          console.error("Error processing WebSocket message:", error);
        }
      };
    }
  }

  public cleanup() {
    if (this.ws) {
      this.ws.close();
      this.subscribers.clear();
    }
  }
}
