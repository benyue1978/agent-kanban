import type { CardDetail as CardDetailModel } from "@agent-kanban/contracts";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { CommentList } from "@/components/comment-list";
import { ReviewActions } from "@/components/review-actions";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export function CardDetail({
  card,
  humanActorId,
}: {
  card: CardDetailModel;
  humanActorId: string | null;
}) {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-10 md:px-8">
      <Link
        href={`/projects/${card.projectId}`}
        className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Back to board
      </Link>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.55fr)_360px]">
        <Card className="overflow-hidden">
          <CardHeader className="gap-4 border-b border-border/70 bg-gradient-to-br from-white/70 via-transparent to-primary/5">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline">{card.id}</Badge>
              <Badge data-testid="card-state-badge">{card.state}</Badge>
              <Badge variant="secondary">
                {card.owner === null ? "Unassigned" : `Owner ${card.owner.displayName ?? card.owner.id}`}
              </Badge>
              <Badge variant="muted">
                {card.priority === null ? "Priority none" : `Priority ${card.priority}`}
              </Badge>
            </div>
            <div className="flex flex-col gap-2">
              <CardTitle className="text-3xl md:text-4xl">{card.title}</CardTitle>
              <CardDescription>
                Revision {card.revision} updated {new Date(card.updatedAt).toLocaleString()}
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-8 p-6 md:p-8">
            <div className="prose-kanban">
              <Markdown remarkPlugins={[remarkGfm]}>{card.descriptionMd}</Markdown>
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col gap-6">
          <ReviewActions card={card} humanActorId={humanActorId} />

          <Card>
            <CardHeader>
              <CardTitle>Final Summary</CardTitle>
              <CardDescription>Completion notes and final delivery signal.</CardDescription>
            </CardHeader>
            <CardContent>
              {card.summaryMd === null ? (
                <div className="rounded-[1.4rem] border border-dashed border-border/80 bg-background/80 px-4 py-5 text-sm leading-6 text-muted-foreground">
                  No final summary has been appended yet.
                </div>
              ) : (
                <div className="prose-kanban">
                  <Markdown remarkPlugins={[remarkGfm]}>{card.summaryMd}</Markdown>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Execution Context</CardTitle>
              <CardDescription>Timeline notes, verification evidence, and source links.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="flex items-center gap-3 rounded-[1.4rem] bg-muted/60 px-4 py-3 text-sm text-muted-foreground">
                <CheckCircle2 className="size-4 text-primary" />
                Browser writes stay intentionally limited in this slice; markdown editing and richer planning changes remain CLI-first.
              </div>
              {card.sourceTaskId === null ? null : (
                <>
                  <Separator />
                  <div className="rounded-[1.2rem] border border-border/70 bg-background/80 px-4 py-4 text-sm leading-6 text-muted-foreground">
                    <div className="font-medium text-foreground">Imported task linkage</div>
                    <div>Task: {card.sourceTaskId}</div>
                    {card.sourcePlanPath === null ? null : <div>Plan: {card.sourcePlanPath}</div>}
                    {card.sourceSpecPath === null ? null : <div>Spec: {card.sourceSpecPath}</div>}
                  </div>
                </>
              )}
              <Separator />
              <CommentList comments={card.comments} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
