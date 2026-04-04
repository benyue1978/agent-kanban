export type DefaultSelectionPolicy =
  | "priority_then_ready_age_then_updated_at";

export interface ProjectPolicy {
  allowAgentReview: boolean;
  allowSelfReview: boolean;
  allowAgentPickUnassignedReady: boolean;
  defaultSelectionPolicy: DefaultSelectionPolicy;
}

export const defaultProjectPolicy = {
  allowAgentReview: false,
  allowSelfReview: false,
  allowAgentPickUnassignedReady: false,
  defaultSelectionPolicy: "priority_then_ready_age_then_updated_at",
} as const satisfies ProjectPolicy;
