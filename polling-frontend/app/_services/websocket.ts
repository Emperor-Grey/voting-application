/* eslint-disable @typescript-eslint/no-explicit-any */
export interface WebSocketMessage {
  type: "subscribe" | "poll_update" | "vote";
  pollId: string;
  data?: any;
}

export class WebSocketService {
  private static instance: WebSocketService;
  private ws: WebSocket | null = null;
  private subscribers: Map<string, ((data: any) => void)[]> = new Map();

  private constructor() {}

  static getInstance(): WebSocketService {
    if (!WebSocketService.instance) {
      WebSocketService.instance = new WebSocketService();
    }
    return WebSocketService.instance;
  }

  connect(url: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(url);

      this.ws.onopen = () => {
        console.log("WebSocket connected");
        resolve();
      };

      this.ws.onmessage = (event) => {
        console.log("WebSocket message received", event);

        const message: WebSocketMessage = JSON.parse(event.data);
        this.handleMessage(message);
      };

      this.ws.onerror = (error) => {
        console.error("WebSocket error:", error);
        reject(error);
      };

      this.ws.onclose = (err) => {
        console.log("WebSocket closed");
        // Enjoy the error
        console.error("WebSocket closed", err);
      };
    });
  }

  subscribe(pollId: string, callback: (data: any) => void) {
    if (!this.subscribers.has(pollId)) {
      this.subscribers.set(pollId, []);
    }
    this.subscribers.get(pollId)?.push(callback);

    // Send subscription message to server
    this.send({
      type: "subscribe",
      pollId,
    });
  }

  unsubscribe(pollId: string, callback: (data: any) => void) {
    const callbacks = this.subscribers.get(pollId) || [];
    this.subscribers.set(
      pollId,
      callbacks.filter((cb) => cb !== callback)
    );
  }

  vote(pollId: string, optionId: string) {
    this.send({
      type: "vote",
      pollId,
      data: { optionId },
    });
  }

  private send(message: WebSocketMessage) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    }
  }

  private handleMessage(message: WebSocketMessage) {
    const callbacks = this.subscribers.get(message.pollId) || [];
    callbacks.forEach((callback) => callback(message.data));
  }

  disconnect() {
    this.ws?.close();
    this.ws = null;
    this.subscribers.clear();
  }
}
