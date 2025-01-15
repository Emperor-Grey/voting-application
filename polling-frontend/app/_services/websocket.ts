/* eslint-disable @typescript-eslint/no-explicit-any */
type WebSocketCallback = (data: any) => void;

export class WebSocketService {
  private static instance: WebSocketService;
  private ws: WebSocket | null = null;
  private subscribers: Map<string, Set<WebSocketCallback>> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000; // in milliseconds ---->  1 second
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

  private async connect() {
    if (this.ws?.readyState === WebSocket.OPEN || this.isConnecting) {
      return;
    }

    this.isConnecting = true;

    try {
      this.ws = new WebSocket(
        process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:3003/ws/polls"
      );

      this.ws.onopen = () => {
        console.log("WebSocket connected");
        this.reconnectAttempts = 0;
        this.reconnectDelay = 1000;
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
          console.log(
            `WebSocket closed, attempting to reconnect... Attempt ${
              this.reconnectAttempts + 1
            }`
          );
          setTimeout(() => {
            this.reconnectAttempts++;
            this.reconnectDelay *= 2;
            this.connect();
          }, this.reconnectDelay);
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
}
