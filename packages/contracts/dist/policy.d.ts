export type DefaultSelectionPolicy = "priority_then_ready_age_then_updated_at";
export interface ProjectPolicy {
    allowAgentReview: boolean;
    allowSelfReview: boolean;
    allowAgentPickUnassignedReady: boolean;
    defaultSelectionPolicy: DefaultSelectionPolicy;
}
export declare const defaultProjectPolicy: {
    readonly allowAgentReview: false;
    readonly allowSelfReview: false;
    readonly allowAgentPickUnassignedReady: false;
    readonly defaultSelectionPolicy: "priority_then_ready_age_then_updated_at";
};
//# sourceMappingURL=policy.d.ts.map