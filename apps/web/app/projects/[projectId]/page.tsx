import Link from "next/link";
import { notFound } from "next/navigation";
import { BoardColumn } from "@/components/board-column";
import { PollingRefresher } from "@/components/polling-refresher";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { fetchBoard, fetchProjects } from "@/lib/api";
import { getHumanActorId } from "@/lib/config";
import { resolveProjectRef } from "@/lib/projects";

export const dynamic = "force-dynamic";

const columnDescriptions = {
  New: "Freshly created cards before they are shaped into reviewable work.",
  Ready: "Queued work that can be pulled once scope and DoD are clear.",
  "In Progress": "Execution lanes owned by the current collaborator, including verification and summary work.",
  "In Review": "Cards awaiting peer review or approval.",
  Done: "Completed cards with final summaries attached.",
};

export default async function ProjectBoardPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId: projectRef } = await params;
  const projects = await fetchProjects();
  const project = resolveProjectRef(projects, projectRef);

  if (project === null) {
    notFound();
  }

  const board = await fetchBoard(project.id);
  const humanActorId = getHumanActorId();

  return (
    <main className="mx-auto flex w-full max-w-[1600px] flex-col gap-8 px-4 py-10 md:px-8">
      <PollingRefresher />
      <section className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="flex max-w-3xl flex-col gap-3">
          <Badge variant="outline">Project {project.name}</Badge>
          <h1 className="max-w-4xl text-balance text-4xl font-semibold tracking-[-0.05em] text-foreground md:text-6xl">
            Card-driven execution for humans and agents.
          </h1>
          <p className="max-w-2xl text-base leading-7 text-muted-foreground md:text-lg">
            The board is the live process surface. Cards keep markdown and timeline context, while the backend remains the only workflow authority.
          </p>
        </div>
        <Card className="max-w-sm border-border bg-surface/50 backdrop-blur-xl">
          <CardContent className="flex flex-col gap-4 p-5">
            <div className="flex items-start gap-3 text-sm leading-relaxed text-muted-foreground">
              <div className="mt-1 size-1.5 rounded-full bg-accent shrink-0" />
              <p>Server-rendered from the API with no client-side workflow duplication.</p>
            </div>
            {humanActorId === null ? (
              <div className="text-xs font-medium text-accent uppercase tracking-wider">
                Set `KANBAN_HUMAN_ACTOR_ID` to enable inbox.
              </div>
            ) : (
              <Link
                href="/inbox"
                className="inline-flex h-8 w-full items-center justify-start rounded-md border border-border/40 bg-secondary px-3 text-xs font-medium text-secondary-foreground transition hover:bg-secondary/80 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent/60"
              >
                Open {humanActorId} inbox
              </Link>
            )}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-5">
        <BoardColumn
          state="New"
          description={columnDescriptions.New}
          cards={board.columns.New.cards}
        />
        <BoardColumn
          state="Ready"
          description={columnDescriptions.Ready}
          cards={board.columns.Ready.cards}
        />
        <BoardColumn
          state="In Progress"
          description={columnDescriptions["In Progress"]}
          cards={board.columns["In Progress"].cards}
        />
        <BoardColumn
          state="In Review"
          description={columnDescriptions["In Review"]}
          cards={board.columns["In Review"].cards}
        />
        <BoardColumn
          state="Done"
          description={columnDescriptions.Done}
          cards={board.columns.Done.cards}
        />
      </section>
    </main>
  );
}
