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
interface HeadingBlock {
    bodyStart: number;
    content: string;
    end: number;
    start: number;
}
export declare function findProtectedSection(markdown: string, heading: string): HeadingBlock | undefined;
export declare function getProtectedSections(markdown: string): ProtectedSections;
export {};
//# sourceMappingURL=anchors.d.ts.map