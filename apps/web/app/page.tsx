import Link from "next/link";
import { fetchProjects } from "@/lib/api";
import { buildProjectHref } from "@/lib/projects";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const projects = await fetchProjects();

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-10 md:px-8">
      <section className="flex flex-col gap-3">
        <p className="text-sm font-medium uppercase tracking-[0.24em] text-muted-foreground">
          agent-kanban
        </p>
        <h1 className="text-balance text-4xl font-semibold tracking-[-0.05em] text-foreground md:text-6xl">
          Choose a project board.
        </h1>
        <p className="max-w-2xl text-base leading-7 text-muted-foreground md:text-lg">
          Boards are keyed to projects. Open one to inspect cards, ownership, comments, and workflow state.
        </p>
      </section>

      <section className="grid gap-4">
        {projects.map((project) => (
          <Link
            key={project.id}
            href={buildProjectHref(project)}
            className="rounded-[1.6rem] border border-border/60 bg-white/75 px-6 py-5 shadow-[0_20px_60px_-38px_rgba(15,23,42,0.45)] transition hover:bg-white"
          >
            <div className="flex flex-col gap-2">
              <div className="text-lg font-semibold text-foreground">{project.name}</div>
              <div className="text-sm text-muted-foreground">{project.repoUrl}</div>
              <div className="text-sm text-muted-foreground">
                New {project.countsByState.New} · Ready {project.countsByState.Ready} · In Progress{" "}
                {project.countsByState["In Progress"]} · Done {project.countsByState.Done}
              </div>
            </div>
          </Link>
        ))}
      </section>
    </main>
  );
}
