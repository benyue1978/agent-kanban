import { getProtectedSections } from "./anchors.js";
export class SummaryValidationError extends Error {
    code = "summary_required";
    constructor(message) {
        super(message);
        this.name = "SummaryValidationError";
    }
}
function normalizeBlock(markdown) {
    return markdown.trim().replace(/\n{3,}/g, "\n\n");
}
function getSubsectionContent(section, heading) {
    const pattern = new RegExp(`^### ${heading.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*$\\n?([\\s\\S]*?)(?=^###\\s+|$)`, "m");
    const match = pattern.exec(section);
    const content = match?.[1]?.trim();
    return content && content.length > 0 ? content : undefined;
}
export function validateCompletionSummary(markdown) {
    const finalSummary = getProtectedSections(markdown).finalSummary;
    if (finalSummary === undefined) {
        throw new SummaryValidationError("summary_required: final summary is required before completion");
    }
    const whatWasDone = getSubsectionContent(finalSummary, "What was done");
    const dodCheck = getSubsectionContent(finalSummary, "DoD Check");
    if (whatWasDone === undefined || dodCheck === undefined) {
        throw new SummaryValidationError("summary_required: final summary must include 'What was done' and 'DoD Check'");
    }
}
export function appendCompletionSummary(markdown, summaryMarkdown) {
    const trimmedMarkdown = markdown.trimEnd();
    const normalizedSummary = normalizeBlock(summaryMarkdown);
    const finalSummary = getProtectedSections(markdown).finalSummary;
    if (finalSummary === undefined) {
        const separator = trimmedMarkdown.length === 0 ? "" : "\n\n";
        return `${trimmedMarkdown}${separator}## Final Summary\n${normalizedSummary}\n`;
    }
    const finalSummaryPattern = /^## Final Summary\s*$\n?[\s\S]*?(?=^##\s+|$)/m;
    return trimmedMarkdown.replace(finalSummaryPattern, (existingSection) => {
        const existingTrimmed = existingSection.trimEnd();
        return `${existingTrimmed}\n\n${normalizedSummary}`;
    }) + "\n";
}
