"use client";

import { useEffect } from "react";

interface RealTimeRefresherProps {
  projectId?: string;
  cardId?: string;
}

export function RealTimeRefresher({ projectId, cardId }: RealTimeRefresherProps) {
  useEffect(() => {
    const url = new URL("/kanban-api/events", window.location.origin);
    if (projectId) {
      url.searchParams.set("projectId", projectId);
    }

    const eventSource = new EventSource(url.toString());

    eventSource.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        console.log("Real-time event received:", payload);

        // If we are on a specific card, only refresh if the event is about this card
        if (cardId && payload.cardId && payload.cardId !== cardId) {
          return;
        }

        window.location.reload();
      } catch (err) {
        console.error("Failed to parse real-time event:", err);
      }
    };

    eventSource.onerror = (err) => {
      console.error("EventSource error:", err);
      // EventSource will automatically retry, but we might want to log it
    };

    return () => {
      eventSource.close();
    };
  }, [projectId, cardId]);

  return null; // This is a logic-only component
}
