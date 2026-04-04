export interface ProtectedSections {
  goal?: string;
  context?: string;
  scope?: string;
  definitionOfDone?: string;
  constraints?: string;
  plan?: string;
  finalSummary?: string;
}

const sectionHeadings = [
  ["goal", "Goal"],
  ["context", "Context"],
  ["scope", "Scope"],
  ["definitionOfDone", "Definition of Done"],
  ["constraints", "Constraints"],
  ["plan", "Plan"],
  ["finalSummary", "Final Summary"],
] as const satisfies ReadonlyArray<readonly [keyof ProtectedSections, string]>;

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function getSectionContent(markdown: string, heading: string): string | undefined {
  const pattern = new RegExp(
    `^## ${escapeRegex(heading)}\\s*$\\n?([\\s\\S]*?)(?=^##\\s+|$)`,
    "m"
  );
  const match = pattern.exec(markdown);
  const content = match?.[1]?.trim();

  return content && content.length > 0 ? content : undefined;
}

export function getProtectedSections(markdown: string): ProtectedSections {
  const sections: ProtectedSections = {};

  for (const [key, heading] of sectionHeadings) {
    const content = getSectionContent(markdown, heading);

    if (content !== undefined) {
      sections[key] = content;
    }
  }

  return sections;
}
