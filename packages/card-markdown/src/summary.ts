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

export function isSectionComplete(content: string): boolean {
  const trimmed = content.trim();
  if (trimmed.length === 0) return false;
  
  const upperContent = trimmed.toUpperCase();
  if (upperContent.includes("TBD") || upperContent.includes("TODO")) return false;
  if (trimmed.includes("[ ]")) return false;
  
  return true;
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

  if (sections.finalSummaryResultLinks === undefined) {
    throw new SummaryValidationError(
      "summary_required: final summary must include 'Result / Links'"
    );
  }

  const links = sections.finalSummaryResultLinks;
  const hasGitHash = /[0-9a-f]{7,}/i.test(links);
  const hasUrl = /https?:\/\//.test(links);

  if (!hasGitHash && !hasUrl) {
    throw new SummaryValidationError(
      "summary_required: 'Result / Links' must contain a URL or git hash as evidence"
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

export function replaceCompletionSummary(markdown: string, summaryMarkdown: string): string {
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

  // Replace the entire content within Final Summary
  const prefix = markdown.slice(0, finalSummaryBlock.bodyStart);
  const suffix = markdown.slice(finalSummaryBlock.end).replace(/^\n+/, "");
  const suffixPrefix = suffix.length === 0 ? "\n" : "\n\n";
  const contentPrefix = prefix.endsWith("\n") ? "" : "\n";

  return (
    `${prefix}${contentPrefix}${normalizedSummary}${suffixPrefix}${suffix}`.replace(
      /\n{3,}/g,
      "\n\n"
    )
  );
}
