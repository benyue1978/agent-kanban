import Link from "next/link";
import { notFound } from "next/navigation";
import { BoardColumn } from "@/components/board-column";
import { RealTimeRefresher } from "@/components/real-time-refresher";
import { Badge } from "@/components/ui/badge";
import { fetchBoard, fetchProjects } from "@/lib/api";
import { getApiBaseUrl, getHumanActorId } from "@/lib/config";
import { resolveProjectRef } from "@/lib/projects";

export const dynamic = "force-dynamic";

const columnDescriptions = {
  New: "Freshly created cards before they are shaped into reviewable work.",
  Ready: "Queued work that can be pulled once scope and DoD are clear.",
  "In Progress": "Execution lanes owned by the current collaborator, including verification and summary work.",
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
      <RealTimeRefresher projectId={project.id} />
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
        <div className="flex flex-col gap-3 rounded-[1.6rem] border border-border/60 bg-white/60 px-4 py-4 text-sm leading-6 text-muted-foreground shadow-[0_20px_60px_-38px_rgba(15,23,42,0.45)] backdrop-blur-xl">
          <div>Server-rendered from the API with no client-side workflow duplication.</div>
          {humanActorId === null ? (
            <div>Set `KANBAN_HUMAN_ACTOR_ID` to enable the human inbox.</div>
          ) : (
            <Link
              href="/inbox"
              className="inline-flex items-center rounded-full border border-border/70 bg-white/80 px-4 py-2 font-medium text-foreground transition hover:bg-white"
            >
              Open {humanActorId} inbox
            </Link>
          )}
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-4">
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
          state="Done"
          description={columnDescriptions.Done}
          cards={board.columns.Done.cards}
        />
      </section>
    </main>
  );
}
