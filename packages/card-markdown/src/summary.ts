import { findProtectedSection, getProtectedSections } from "./anchors.js";

export class SummaryValidationError extends Error {
  readonly code = "summary_required";

  constructor(message: string) {
    super(message);
    this.name = "SummaryValidationError";
  }
}

export class SummaryAppendError extends Error {
  readonly code = "invalid_summary_append";

  constructor(message: string) {
    super(message);
    this.name = "SummaryAppendError";
  }
}

function normalizeBlock(markdown: string): string {
  return markdown.trim().replace(/\n{3,}/g, "\n\n");
}

export function validateCompletionSummary(markdown: string): void {
  const sections = getProtectedSections(markdown);

  if (sections.finalSummary === undefined) {
    throw new SummaryValidationError("summary_required: final summary is required before completion");
  }

  if (sections.finalSummaryWhatWasDone === undefined) {
    throw new SummaryValidationError(
      "summary_required: final summary must include 'What was done'"
    );
  }
}

export function appendCompletionSummary(markdown: string, summaryMarkdown: string): string {
  const trimmedMarkdown = markdown.trimEnd();
  const normalizedSummary = normalizeBlock(summaryMarkdown);

  if (/^##\s+Final Summary\s*$/m.test(normalizedSummary)) {
    throw new SummaryAppendError(
      "invalid_summary_append: append payload must not include the '## Final Summary' heading"
    );
  }

  const finalSummaryBlock = findProtectedSection(markdown, "Final Summary");

  if (finalSummaryBlock === undefined) {
    const separator = trimmedMarkdown.length === 0 ? "" : "\n\n";
    return `${trimmedMarkdown}${separator}## Final Summary\n${normalizedSummary}\n`;
  }

  const existingContent = finalSummaryBlock.content;
  const nextContent =
    existingContent.length === 0 ? normalizedSummary : `${existingContent}\n\n${normalizedSummary}`;
  const prefix = markdown.slice(0, finalSummaryBlock.bodyStart);
  const suffix = markdown.slice(finalSummaryBlock.end).replace(/^\n+/, "");
  const suffixPrefix = suffix.length === 0 ? "\n" : "\n\n";
  const contentPrefix = prefix.endsWith("\n") ? "" : "\n";

  return (
    `${prefix}${contentPrefix}${nextContent}${suffixPrefix}${suffix}`.replace(
      /\n{3,}/g,
      "\n\n"
    )
  );
}
