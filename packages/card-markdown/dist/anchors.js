const sectionHeadings = [
    ["goal", "Goal"],
    ["context", "Context"],
    ["scope", "Scope"],
    ["definitionOfDone", "Definition of Done"],
    ["constraints", "Constraints"],
    ["plan", "Plan"],
    ["finalSummary", "Final Summary"],
];
function escapeRegex(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
function getSectionContent(markdown, heading) {
    const pattern = new RegExp(`^## ${escapeRegex(heading)}\\s*$\\n?([\\s\\S]*?)(?=^##\\s+|$)`, "m");
    const match = pattern.exec(markdown);
    const content = match?.[1]?.trim();
    return content && content.length > 0 ? content : undefined;
}
export function getProtectedSections(markdown) {
    const sections = {};
    for (const [key, heading] of sectionHeadings) {
        const content = getSectionContent(markdown, heading);
        if (content !== undefined) {
            sections[key] = content;
        }
    }
    return sections;
}
