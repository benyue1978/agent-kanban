"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

interface RealTimeRefresherProps {
  projectId?: string;
  cardId?: string;
  apiUrl: string;
}

export function RealTimeRefresher({ projectId, cardId, apiUrl }: RealTimeRefresherProps) {
  const router = useRouter();

  useEffect(() => {
    const url = new URL("/events", apiUrl);
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

        router.refresh();
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
  }, [projectId, cardId, apiUrl, router]);

  return null; // This is a logic-only component
}
