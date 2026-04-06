"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { POLLING_REFRESH_INTERVAL_MS } from "@/lib/refresh-policy";

export function PollingRefresher() {
  const router = useRouter();

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      router.refresh();
    }, POLLING_REFRESH_INTERVAL_MS);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [router]);

  return null;
}
