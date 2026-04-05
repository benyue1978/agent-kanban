export declare const errorCodes: readonly ["invalid_transition", "missing_owner", "missing_required_section", "summary_required", "forbidden_action", "revision_conflict", "claim_conflict"];
export type ErrorCode = (typeof errorCodes)[number];
export interface ContractError {
    code: ErrorCode;
    message: string;
    details?: Record<string, unknown>;
}
export interface ErrorResponse {
    error: ContractError;
}
//# sourceMappingURL=errors.d.ts.map