import { createHash } from "node:crypto";
import { basename } from "node:path";
import type { ImportPlanTaskItem } from "@agent-kanban/contracts";

function normalizeBlock(markdown: string): string {
  return markdown.trim().replace(/\n{3,}/g, "\n\n");
}

function deriveTaskId(index: string, body: string): string {
  const explicitId = body.match(/^Task ID:\s*(.+)$/im)?.[1]?.trim();
  return explicitId && explicitId.length > 0 ? explicitId : `task-${index}`;
}

function extractStepChecklist(body: string): string[] {
  const matches = Array.from(body.matchAll(/^- \[ \] \*\*Step \d+:\*\* (.+)$/gm));
  return matches.map((match) => match[1]?.trim()).filter((line): line is string => Boolean(line));
}

function buildCardDescription(input: {
  planPath: string;
  specPath?: string;
  sourceTaskId: string;
  taskBody: string;
  title: string;
}): string {
  const taskBody = normalizeBlock(input.taskBody);
  const checklist = extractStepChecklist(taskBody);
  const definitionOfDone =
    checklist.length === 0
      ? ["- [ ] Task implemented", "- [ ] Verification recorded"]
      : checklist.map((item) => `- [ ] ${item}`);
  const sourceLines = [
    `- Plan: ${input.planPath}`,
    `- Task ID: ${input.sourceTaskId}`,
    ...(input.specPath === undefined ? [] : [`- Spec: ${input.specPath}`]),
  ];

  return [
    `# ${input.title}`,
    "",
    "## Goal",
    `Implement approved plan task \`${input.sourceTaskId}\` from ${basename(input.planPath)}.`,
    "",
    "## Context",
    ...sourceLines,
    "",
    "## Scope",
    "Execute the approved task below without redefining the plan outside the card workflow.",
    "",
    "## Definition of Done",
    ...definitionOfDone,
    "",
    "## Plan",
    taskBody,
  ].join("\n");
}

export function parsePlanTasks(input: {
  planMarkdown: string;
  planPath: string;
  specPath?: string;
}): ImportPlanTaskItem[] {
  const normalized = `${input.planMarkdown.replaceAll("\r\n", "\n")}\n### Task END: Sentinel\n`;
  const matches = Array.from(
    normalized.matchAll(/^### Task (\d+): (.+)\n([\s\S]*?)(?=^### Task (?:\d+|END): )/gm)
  );

  return matches.map((match) => {
    const index = match[1] ?? "";
    const title = (match[2] ?? "").trim();
    const taskBody = (match[3] ?? "").trim();
    const sourceTaskId = deriveTaskId(index, taskBody);
    const descriptionMd = buildCardDescription({
      planPath: input.planPath,
      ...(input.specPath === undefined ? {} : { specPath: input.specPath }),
      sourceTaskId,
      taskBody,
      title,
    });

    return {
      sourceTaskId,
      sourcePlanPath: input.planPath,
      sourceSpecPath: input.specPath ?? null,
      sourceTaskFingerprint: createHash("sha256").update(`${title}\n${taskBody}`).digest("hex"),
      title,
      descriptionMd,
      priority: null,
    };
  });
}
