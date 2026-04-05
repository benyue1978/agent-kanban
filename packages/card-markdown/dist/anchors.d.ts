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
export declare function findProtectedSection(markdown: string, heading: string): HeadingBlock | undefined;
export declare function getProtectedSections(markdown: string): ProtectedSections;
export declare function getSourceTaskMetadata(markdown: string): SourceTaskMetadata | null;
export declare function upsertSourceTaskMetadata(markdown: string, metadata: SourceTaskMetadata): string;
export {};
//# sourceMappingURL=anchors.d.ts.map