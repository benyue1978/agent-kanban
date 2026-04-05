import { describe, expect, it } from "vitest";
import { parsePlanTasks } from "../import-plan-tasks";

describe("plan importer", () => {
  it("parses executable tasks from a superpowers implementation plan", async () => {
    const tasks = await parsePlanTasks({
      planPath: "docs/superpowers/plans/2026-04-04-local-first-mvp-vertical-slice.md",
      specPath: "docs/superpowers/specs/2026-04-04-local-first-mvp-vertical-slice-design.md",
    });

    expect(tasks).toHaveLength(11);
    expect(tasks[0]?.sourceTaskId).toBe(
      "docs/superpowers/plans/2026-04-04-local-first-mvp-vertical-slice.md#task-1"
    );
    expect(tasks[0]?.descriptionMd).toContain("## Goal");
    expect(tasks[0]?.descriptionMd).toContain("## Definition of Done");
    expect(tasks[0]?.descriptionMd).toContain("docs/superpowers/specs/2026-04-04-local-first-mvp-vertical-slice-design.md");
    expect(tasks[0]?.sourceTaskFingerprint).toHaveLength(40);
  });
});
