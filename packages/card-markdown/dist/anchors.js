const topLevelSectionHeadings = [
    ["goal", "Goal"],
    ["context", "Context"],
    ["scope", "Scope"],
    ["definitionOfDone", "Definition of Done"],
    ["constraints", "Constraints"],
    ["plan", "Plan"],
    ["finalSummary", "Final Summary"],
];
const finalSummaryHeadings = [
    ["finalSummaryWhatWasDone", "What was done"],
    ["finalSummaryKeyDecisions", "Key Decisions"],
    ["finalSummaryResultLinks", "Result / Links"],
    ["finalSummaryDodCheck", "DoD Check"],
];
function getHeadingLineEnd(markdown, start, headingLength) {
    const afterHeading = start + headingLength;
    if (markdown.slice(afterHeading, afterHeading + 2) === "\r\n") {
        return afterHeading + 2;
    }
    if (markdown[afterHeading] === "\n") {
        return afterHeading + 1;
    }
    return afterHeading;
}
function findHeadingBlock(markdown, level, heading) {
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
export function findProtectedSection(markdown, heading) {
    return findHeadingBlock(markdown, 2, heading);
}
export function getProtectedSections(markdown) {
    const sections = {};
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
