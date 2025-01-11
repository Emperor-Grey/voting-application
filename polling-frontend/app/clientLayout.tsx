"use client";

import { useEffect } from "react";
import { WebSocketService } from "./_services/websocket";

interface ClientLayoutProps {
  children: React.ReactNode;
}

export function ClientLayout({ children }: ClientLayoutProps) {
  useEffect(() => {
    const wsService = WebSocketService.getInstance();

    wsService.connect("ws://localhost:8080/ws/polls").catch(console.error);

    return () => {
      wsService.disconnect();
    };
  }, []);

  return <>{children}</>;
}
