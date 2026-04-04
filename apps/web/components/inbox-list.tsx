"use client";

import type { InboxItem, InboxItemStatusValue } from "@agent-kanban/contracts";
import { Inbox, LoaderCircle, MessageSquareShare } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

async function getErrorMessage(response: Response): Promise<string> {
  try {
    const payload = (await response.json()) as { error?: { message?: string } };
    return payload.error?.message ?? `Request failed with ${response.status}`;
  } catch {
    return `Request failed with ${response.status}`;
  }
}

export function InboxList({
  actorId,
  items,
}: {
  actorId: string;
  items: InboxItem[];
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pendingItemId, setPendingItemId] = useState<string | null>(null);
  const [isRefreshing, startRefresh] = useTransition();

  async function updateStatus(itemId: string, status: InboxItemStatusValue): Promise<void> {
    setPendingItemId(itemId);
    setError(null);

    const response = await fetch(`/api/inbox/items/${encodeURIComponent(itemId)}/status`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({ status }),
    });

    if (!response.ok) {
      setError(await getErrorMessage(response));
      setPendingItemId(null);
      return;
    }

    setPendingItemId(null);
    startRefresh(() => {
      router.refresh();
    });
  }

  if (items.length === 0) {
    return (
      <Card className="border-dashed bg-card/70">
        <CardContent className="flex flex-col items-start gap-3 p-6 text-sm leading-6 text-muted-foreground">
          <Inbox className="size-5 text-primary" />
          <div>No open mentions for <span className="font-mono text-foreground">{actorId}</span>.</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {items.map((item) => {
        const isBusy = pendingItemId === item.id || isRefreshing;

        return (
          <Card key={item.id} className="overflow-hidden">
              <CardHeader className="gap-4 border-b border-border/60 bg-gradient-to-r from-white/70 to-primary/5">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge data-testid="inbox-status-badge">{item.status}</Badge>
                  <Badge variant="muted">{new Date(item.createdAt).toLocaleString()}</Badge>
                </div>
                <CardTitle className="text-xl">
                  Mention on <span className="font-mono text-primary">{item.cardId}</span>
                </CardTitle>
              </CardHeader>
            <CardContent className="flex flex-col gap-4 p-6">
              <div className="flex flex-wrap items-center gap-3 text-sm leading-6 text-muted-foreground">
                <MessageSquareShare className="size-4 text-primary" />
                <span>Comment {item.commentId} is waiting for a human response path.</span>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <Button
                  variant="secondary"
                  disabled={isBusy || item.status !== "open"}
                  onClick={() => {
                    void updateStatus(item.id, "acknowledged");
                  }}
                >
                  {isBusy ? <LoaderCircle className="size-4 animate-spin" /> : null}
                  Acknowledge
                </Button>
                <Button
                  variant="ghost"
                  disabled={isBusy || item.status === "resolved"}
                  onClick={() => {
                    void updateStatus(item.id, "resolved");
                  }}
                >
                  Mark Resolved
                </Button>
                <Link
                  href={`/cards/${item.cardId}`}
                  className="inline-flex h-11 items-center rounded-full border border-border/70 bg-white/70 px-4 text-sm font-medium text-foreground transition hover:bg-white"
                >
                  View Card
                </Link>
              </div>
            </CardContent>
          </Card>
        );
      })}

      {error === null ? null : (
        <div className="rounded-[1.2rem] border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-700">
          {error}
        </div>
      )}
    </div>
  );
}
