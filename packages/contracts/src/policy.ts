export type DefaultSelectionPolicy =
  | "priority_then_ready_age_then_updated_at";

export interface ProjectPolicy {
  allowAgentPickUnassignedReady: boolean;
  defaultSelectionPolicy: DefaultSelectionPolicy;
}

export const defaultProjectPolicy = {
  allowAgentPickUnassignedReady: false,
  defaultSelectionPolicy: "priority_then_ready_age_then_updated_at",
} as const satisfies ProjectPolicy;
