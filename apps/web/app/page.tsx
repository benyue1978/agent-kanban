import Link from "next/link";
import { PollingRefresher } from "@/components/polling-refresher";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { fetchProjects } from "@/lib/api";
import { buildProjectHref } from "@/lib/projects";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const projects = await fetchProjects();

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-10 md:px-8">
      <PollingRefresher />
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
            className="group block transition-transform active:scale-[0.99]"
          >
            <Card className="border-border bg-surface/30 hover:bg-surface/50 transition-all">
              <CardContent className="flex items-center justify-between p-6">
                <div className="flex flex-col gap-1.5">
                  <div className="text-lg font-semibold tracking-tight text-foreground group-hover:text-accent transition-colors">
                    {project.name}
                  </div>
                  <div className="text-sm font-medium text-muted-foreground font-mono opacity-80">
                    {project.repoUrl}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Badge variant="muted" className="bg-background/50">
                    {project.countsByState.New +
                      project.countsByState.Ready +
                      project.countsByState["In Progress"] +
                      project.countsByState["In Review"] +
                      project.countsByState.Done}{" "}
                    cards
                  </Badge>
                  <div className="text-xs font-medium text-muted-foreground uppercase tracking-widest hidden md:block">
                    New {project.countsByState.New} · Ready {project.countsByState.Ready} · In
                    Progress {project.countsByState["In Progress"]} · In Review {project.countsByState["In Review"]} · Done {project.countsByState.Done}
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </section>
    </main>
  );
}
