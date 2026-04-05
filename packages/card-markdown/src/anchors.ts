export interface ProtectedSections {
  goal?: string;
  context?: string;
  scope?: string;
  definitionOfDone?: string;
  constraints?: string;
  plan?: string;
  finalSummary?: string;
  finalSummaryWhatWasDone?: string;
  finalSummaryKeyDecisions?: string;
  finalSummaryResultLinks?: string;
  finalSummaryDodCheck?: string;
}

export interface SourceTaskMetadata {
  taskId: string;
  planPath: string;
  specPath: string | null;
}

interface HeadingBlock {
  bodyStart: number;
  content: string;
  end: number;
  start: number;
}

const topLevelSectionHeadings = [
  ["goal", "Goal"],
  ["context", "Context"],
  ["scope", "Scope"],
  ["definitionOfDone", "Definition of Done"],
  ["constraints", "Constraints"],
  ["plan", "Plan"],
  ["finalSummary", "Final Summary"],
] as const satisfies ReadonlyArray<readonly [keyof ProtectedSections, string]>;

const finalSummaryHeadings = [
  ["finalSummaryWhatWasDone", "What was done"],
  ["finalSummaryKeyDecisions", "Key Decisions"],
  ["finalSummaryResultLinks", "Result / Links"],
  ["finalSummaryDodCheck", "DoD Check"],
] as const satisfies ReadonlyArray<readonly [keyof ProtectedSections, string]>;

const sourceMetadataPatterns = {
  taskId: /<!--\s*agent-kanban:source-task-id=(.+?)\s*-->/,
  planPath: /<!--\s*agent-kanban:source-plan-path=(.+?)\s*-->/,
  specPath: /<!--\s*agent-kanban:source-spec-path=(.+?)\s*-->/,
} as const;

function getHeadingLineEnd(markdown: string, start: number, headingLength: number): number {
  const afterHeading = start + headingLength;

  if (markdown.slice(afterHeading, afterHeading + 2) === "\r\n") {
    return afterHeading + 2;
  }

  if (markdown[afterHeading] === "\n") {
    return afterHeading + 1;
  }

  return afterHeading;
}

function findHeadingBlock(markdown: string, level: 2 | 3, heading: string): HeadingBlock | undefined {
  const headingPattern = level === 2 ? /^##\s+(.+?)\s*$/gm : /^###\s+(.+?)\s*$/gm;
  const matches = [...markdown.matchAll(headingPattern)];
  const index = matches.findIndex((match) => match[1]?.trim() === heading);

  if (index === -1) {
    return undefined;
  }

  const current = matches.at(index);

  if (current === undefined || current.index === undefined) {
    return undefined;
  }

  const bodyStart = getHeadingLineEnd(markdown, current.index, current[0].length);
  const nextStart = matches[index + 1]?.index ?? markdown.length;

  return {
    start: current.index,
    bodyStart,
    end: nextStart,
    content: markdown.slice(bodyStart, nextStart).trim(),
  };
}

export function findProtectedSection(markdown: string, heading: string): HeadingBlock | undefined {
  return findHeadingBlock(markdown, 2, heading);
}

export function getProtectedSections(markdown: string): ProtectedSections {
  const sections: ProtectedSections = {};

  for (const [key, heading] of topLevelSectionHeadings) {
    const block = findHeadingBlock(markdown, 2, heading);

    if (block !== undefined) {
      sections[key] = block.content;
    }
  }

  const finalSummary = sections.finalSummary;

  if (finalSummary === undefined) {
    return sections;
  }

  for (const [key, heading] of finalSummaryHeadings) {
    const block = findHeadingBlock(finalSummary, 3, heading);

    if (block !== undefined) {
      sections[key] = block.content;
    }
  }

  return sections;
}

export function getSourceTaskMetadata(markdown: string): SourceTaskMetadata | null {
  const taskId = markdown.match(sourceMetadataPatterns.taskId)?.[1]?.trim();
  const planPath = markdown.match(sourceMetadataPatterns.planPath)?.[1]?.trim();
  const specPathValue = markdown.match(sourceMetadataPatterns.specPath)?.[1]?.trim();

  if (taskId === undefined || planPath === undefined) {
    return null;
  }

  return {
    taskId,
    planPath,
    specPath: specPathValue === undefined || specPathValue === "null" ? null : specPathValue,
  };
}

export function upsertSourceTaskMetadata(
  markdown: string,
  metadata: SourceTaskMetadata
): string {
  const withoutExisting = markdown
    .replace(/^<!--\s*agent-kanban:source-task-id=.+?-->\n?/gm, "")
    .replace(/^<!--\s*agent-kanban:source-plan-path=.+?-->\n?/gm, "")
    .replace(/^<!--\s*agent-kanban:source-spec-path=.+?-->\n?/gm, "")
    .trimStart();

  const metadataBlock = [
    `<!-- agent-kanban:source-task-id=${metadata.taskId} -->`,
    `<!-- agent-kanban:source-plan-path=${metadata.planPath} -->`,
    `<!-- agent-kanban:source-spec-path=${metadata.specPath ?? "null"} -->`,
  ].join("\n");

  return `${metadataBlock}\n${withoutExisting}`;
}
