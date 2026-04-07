"use client";

import {
  CardState,
  CommentKind,
  type CardDetail,
  type CommentKindValue,
} from "@agent-kanban/contracts";
import { LoaderCircle, MessageSquarePlus, ShieldCheck, Zap } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { humanActorConfigurationMessage } from "@/lib/config";

async function getErrorMessage(response: Response): Promise<string> {
  try {
    const payload = (await response.json()) as { error?: { message?: string } };
    return payload.error?.message ?? `Request failed with ${response.status}`;
  } catch {
    return `Request failed with ${response.status}`;
  }
}

export function ReviewActions({
  card,
  humanActorId,
}: {
  card: CardDetail;
  humanActorId: string | null;
}) {
  if (humanActorId === null) {
    return (
      <Card className="border-dashed bg-card/70">
        <CardHeader>
          <CardTitle>Browser card actions are not configured.</CardTitle>
          <CardDescription>{humanActorConfigurationMessage}</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return <ConfiguredReviewActions card={card} humanActorId={humanActorId} />;
}

function ConfiguredReviewActions({
  card,
  humanActorId,
}: {
  card: CardDetail;
  humanActorId: string;
}) {
  const router = useRouter();
  const [comment, setComment] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [isRefreshing, startRefresh] = useTransition();
  const [optimisticState, setOptimisticState] = useState(card.state);
  const [priorityValue, setPriorityValue] = useState(
    card.priority === null ? "" : String(card.priority)
  );

  const isBusy = pendingAction !== null || isRefreshing;

  useEffect(() => {
    setPriorityValue(card.priority === null ? "" : String(card.priority));
  }, [card.priority]);

  useEffect(() => {
    // Only sync back to server state when we are not busy
    if (!isBusy) {
      setOptimisticState(card.state);
    }
  }, [card.state, isBusy]);

  const [commentKind, setCommentKind] = useState<CommentKindValue>(
    optimisticState === CardState.InProgress ? CommentKind.Verification : CommentKind.Note
  );

  useEffect(() => {
    setCommentKind(optimisticState === CardState.InProgress ? CommentKind.Verification : CommentKind.Note);
  }, [optimisticState]);

  async function runAction(
    action: string,
    request: () => Promise<Response>,
    onSuccess?: () => void
  ): Promise<void> {
    setPendingAction(action);
    setError(null);

    try {
      const response = await request();

      if (!response.ok) {
        setError(await getErrorMessage(response));
        setPendingAction(null);
        return;
      }

      onSuccess?.();
      
      startRefresh(() => {
        router.refresh();
        setPendingAction(null);
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
      setPendingAction(null);
    }
  }

  return (
    <Card className="overflow-hidden border-border bg-surface">
      <CardHeader className="gap-4 border-b border-border bg-gradient-to-br from-primary/10 via-transparent to-accent/15">
        <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.28em] text-primary">
          <ShieldCheck className="size-4" />
          Human Card Controls
        </div>
        <div className="space-y-2">
          <CardTitle>Browser actions stay small and deliberate.</CardTitle>
          <CardDescription>
            Acting as <span className="font-mono text-foreground">{humanActorId}</span>. Browser writes are limited to queueing, priority tuning, verification comments, and completion.
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-5 p-6">
        <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_auto]">
          <div className="space-y-2">
            <label
              htmlFor="card-priority"
              className="text-[11px] font-medium uppercase tracking-[0.28em] text-muted-foreground"
            >
              Priority
            </label>
            <select
              id="card-priority"
              aria-label="Priority"
              className="h-9 w-full rounded-md border border-border bg-secondary px-3 text-sm text-foreground outline-none transition focus:border-accent/60 focus:ring-1 focus:ring-accent/30"
              disabled={isBusy}
              value={priorityValue}
              onChange={(event) => {
                const nextValue = event.target.value;
                setPriorityValue(nextValue);
                void runAction("priority", async () => {
                  return await fetch(`/api/cards/${card.id}/priority`, {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                      priority: nextValue === "" ? null : Number(nextValue),
                      revision: card.revision,
                    }),
                  });
                });
              }}
            >
              <option value="">None</option>
              <option value="1">1</option>
              <option value="2">2</option>
              <option value="3">3</option>
              <option value="4">4</option>
            </select>
          </div>

          <div className="flex flex-wrap items-end gap-2">
            {optimisticState === CardState.New ? (
              <Button
                disabled={isBusy}
                data-testid="move-to-ready-button"
                onClick={() => {
                  void runAction("move-ready", async () => {
                    return await fetch(`/api/cards/${card.id}/state`, {
                      method: "POST",
                      headers: {
                        "Content-Type": "application/json",
                      },
                      body: JSON.stringify({
                        revision: card.revision,
                        to: CardState.Ready,
                      }),
                    });
                  }, () => {
                    setOptimisticState(CardState.Ready);
                  });
                }}
              >
                {pendingAction === "move-ready" ? <LoaderCircle className="size-4 animate-spin" /> : null}
                Move To Ready
              </Button>
            ) : null}

            {optimisticState === CardState.Ready ? (
              <Button
                disabled={isBusy}
                data-testid="start-work-button"
                onClick={() => {
                  void runAction("start-work", async () => {
                    return await fetch(`/api/cards/${card.id}/state`, {
                      method: "POST",
                      headers: {
                        "Content-Type": "application/json",
                      },
                      body: JSON.stringify({
                        ownerId: humanActorId,
                        revision: card.revision,
                        to: CardState.InProgress,
                      }),
                    });
                  }, () => {
                    setOptimisticState(CardState.InProgress);
                  });
                }}
              >
                {pendingAction === "start-work" ? <LoaderCircle className="size-4 animate-spin" /> : null}
                Start Work
              </Button>
            ) : null}

            {optimisticState === CardState.InProgress ? (
              <>
                <Button
                  disabled={isBusy}
                  data-testid="mark-done-button"
                  onClick={() => {
                    void runAction("mark-done", async () => {
                      return await fetch(`/api/cards/${card.id}/state`, {
                        method: "POST",
                        headers: {
                          "Content-Type": "application/json",
                        },
                        body: JSON.stringify({
                          revision: card.revision,
                          to: CardState.Done,
                        }),
                      });
                    }, () => {
                      setOptimisticState(CardState.Done);
                    });
                  }}
                >
                  {pendingAction === "mark-done" ? (
                    <LoaderCircle className="size-4 animate-spin" />
                  ) : (
                    <Zap className="size-4" />
                  )}
                  Mark Done
                </Button>
              </>
            ) : null}
          </div>
        </div>

        <div className="space-y-2">
          <label
            htmlFor="card-comment"
            className="text-[11px] font-medium uppercase tracking-[0.28em] text-muted-foreground"
          >
            Comment
          </label>
          <textarea
            id="card-comment"
            aria-label="Comment"
            className="min-h-28 w-full rounded-md border border-border bg-secondary px-4 py-3 text-sm leading-6 text-foreground outline-none transition focus:border-accent/60 focus:ring-1 focus:ring-accent/30"
            disabled={isBusy}
            placeholder="Leave rationale, a send-back note, or a mention."
            value={comment}
            onChange={(event) => {
              setComment(event.target.value);
            }}
          />
        </div>

        <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
          <div className="space-y-2">
            <label
              htmlFor="card-comment-kind"
              className="text-[11px] font-medium uppercase tracking-[0.28em] text-muted-foreground"
            >
              Comment kind
            </label>
            <select
              id="card-comment-kind"
              aria-label="Comment kind"
              className="h-9 w-full rounded-md border border-border bg-secondary px-3 text-sm text-foreground outline-none transition focus:border-accent/60 focus:ring-1 focus:ring-accent/30"
              disabled={isBusy}
              value={commentKind}
              onChange={(event) => {
                setCommentKind(event.target.value as CommentKindValue);
              }}
            >
              <option value={CommentKind.Note}>note</option>
              <option value={CommentKind.Decision}>decision</option>
              <option value={CommentKind.Question}>question</option>
              <option value={CommentKind.Progress}>progress</option>
              <option value={CommentKind.Verification}>verification</option>
            </select>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="text-sm leading-6 text-muted-foreground">
            Keep CLI-first markdown editing. Use verification comments to record completion evidence before marking a card done.
          </div>
          <Button
            variant="secondary"
            disabled={isBusy || comment.trim().length === 0}
            data-testid="add-comment-button"
            onClick={() => {
              void runAction(
                "comment",
                async () => {
                  return await fetch(`/api/cards/${card.id}/comments`, {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                      body: comment.trim(),
                      kind: commentKind,
                    }),
                  });
                },
                () => {
                  setComment("");
                }
              );
            }}
          >
            {pendingAction === "comment" ? (
              <LoaderCircle className="size-4 animate-spin" />
            ) : (
              <MessageSquarePlus className="size-4" />
            )}
            Add Comment
          </Button>
        </div>

        {error === null ? null : (
          <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-700">
            {error}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
