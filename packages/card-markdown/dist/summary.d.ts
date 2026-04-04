export declare class SummaryValidationError extends Error {
    readonly code = "summary_required";
    constructor(message: string);
}
export declare function validateCompletionSummary(markdown: string): void;
export declare function appendCompletionSummary(markdown: string, summaryMarkdown: string): string;
//# sourceMappingURL=summary.d.ts.map