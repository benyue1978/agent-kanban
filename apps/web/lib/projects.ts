import type { ProjectListItem } from "@agent-kanban/contracts";

export function resolveProjectRef(
  projects: ProjectListItem[],
  projectRef: string
): ProjectListItem | null {
  const byId = projects.find((project) => project.id === projectRef);

  if (byId !== undefined) {
    return byId;
  }

  const byName = projects.find((project) => project.name === projectRef);
  return byName ?? null;
}

export function buildProjectHref(project: ProjectListItem): string {
  return `/projects/${project.name}`;
}
