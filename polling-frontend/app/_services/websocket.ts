/* eslint-disable @typescript-eslint/no-explicit-any */
export class WebSocketService {
  private static instance: WebSocketService;
  private ws: WebSocket | null = null;
  private subscribers: Map<string, Set<(data: any) => void>> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000; // in seconds
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
      this.ws = new WebSocket("ws://localhost:3003/ws/polls");

      this.ws.onopen = () => {
        console.log("WebSocket connected");
        this.reconnectAttempts = 0;
        this.reconnectDelay = 1000;
        this.isConnecting = false;
      };

      this.ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.poll_id) {
          const subscribers = this.subscribers.get(data.poll_id);
          if (subscribers) {
            subscribers.forEach((callback) => callback(data));
          }
        }
      };

      this.ws.onerror = (event) => {
        console.error("WebSocket error:", event);
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

  subscribe(pollId: string, callback: (data: any) => void) {
    if (!this.subscribers.has(pollId)) {
      this.subscribers.set(pollId, new Set());
    }
    this.subscribers.get(pollId)?.add(callback);

    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(
        JSON.stringify({
          type: "Subscribe",
          poll_id: pollId,
        })
      );
    } else {
      this.connect();
    }
  }

  unsubscribe(pollId: string, callback: (data: any) => void) {
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
    }
  }
}
