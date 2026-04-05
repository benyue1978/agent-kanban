import { describe, expect, it } from "vitest";
import type { ProjectListItem } from "@agent-kanban/contracts";
import { buildProjectHref, resolveProjectRef } from "./projects";

const projects: ProjectListItem[] = [
  {
    id: "project-1",
    name: "agent-kanban",
    repoUrl: "git@github.com:benyue1978/agent-kanban.git",
    countsByState: {
      New: 0,
      Ready: 1,
      "In Progress": 0,
      Done: 0,
    },
  },
  {
    id: "project-2",
    name: "other-project",
    repoUrl: "git@github.com:benyue1978/other-project.git",
    countsByState: {
      New: 0,
      Ready: 0,
      "In Progress": 0,
      Done: 0,
    },
  },
];

describe("project routing helpers", () => {
  it("resolves an exact project id", () => {
    expect(resolveProjectRef(projects, "project-1")?.id).toBe("project-1");
  });

  it("resolves an exact project name", () => {
    expect(resolveProjectRef(projects, "agent-kanban")?.id).toBe("project-1");
  });

  it("returns null when no project matches", () => {
    expect(resolveProjectRef(projects, "missing")).toBeNull();
  });

  it("builds project links from the project name", () => {
    expect(buildProjectHref(projects[0])).toBe("/projects/agent-kanban");
  });
});
