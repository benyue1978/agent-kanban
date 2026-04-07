import {
  CardState,
  defaultProjectPolicy,
  type CardStateValue,
  type ErrorCode,
  type ProjectPolicy,
} from "@agent-kanban/contracts";
import { assertReadyPickupAllowed, WorkflowDomainError } from "./policy.js";

export interface WorkflowTransitionInput {
  from: CardStateValue;
  to: CardStateValue;
  actorKind: "human" | "agent";
  actorId?: string;
  titlePresent?: boolean;
  ownerId?: string | null;
  targetOwnerId?: string | null;
  policy?: ProjectPolicy;
  humanInstructionGranted?: boolean;
  requiredSectionsPresent?: boolean;
  summaryPresent?: boolean;
  dodCheckPresent?: boolean;
  verificationEvidencePresent?: boolean;
}

const allowedTransitions = new Set<string>([
  `${CardState.New}=>${CardState.Ready}`,
  `${CardState.Ready}=>${CardState.InProgress}`,
  `${CardState.InProgress}=>${CardState.InReview}`,
  `${CardState.InReview}=>${CardState.InProgress}`,
  `${CardState.InReview}=>${CardState.Done}`,
]);

function throwWorkflowError(
  code: ErrorCode,
  message: string,
  details?: Record<string, unknown>
): never {
  throw new WorkflowDomainError(code, message, details);
}

function resolvePolicy(policy?: ProjectPolicy): ProjectPolicy {
  return policy ?? defaultProjectPolicy;
}

function validateDoneTransition(input: WorkflowTransitionInput) {
  if (input.ownerId === null || input.ownerId === undefined) {
    throwWorkflowError("missing_owner", "an owner is required before a card can be completed", {
      from: input.from,
      to: input.to,
    });
  }

  if (input.summaryPresent !== true) {
    throwWorkflowError("summary_required", "a final summary is required before a card can be completed", {
      from: input.from,
      to: input.to,
    });
  }

  if (input.dodCheckPresent !== true) {
    throwWorkflowError(
      "missing_required_section",
      "a Definition of Done check is required in the final summary before completion",
      { from: input.from, to: input.to }
    );
  }

  if (input.verificationEvidencePresent !== true) {
    throwWorkflowError(
      "missing_required_section",
      "verification evidence is required before a card can be completed",
      { from: input.from, to: input.to }
    );
  }
}

export function canTransition(input: WorkflowTransitionInput): void {
  const policy = resolvePolicy(input.policy);
  const transition = `${input.from}=>${input.to}`;

  if (input.from === input.to || !allowedTransitions.has(transition)) {
    throwWorkflowError(
      "invalid_transition",
      `invalid transition from ${input.from} to ${input.to}`,
      { from: input.from, to: input.to }
    );
  }

  if (input.from === CardState.New && input.to === CardState.Ready) {
    if (input.titlePresent !== true) {
      throwWorkflowError(
        "missing_required_section",
        "a title is required before moving a card to Ready",
        { from: input.from, to: input.to }
      );
    }

    if (input.requiredSectionsPresent !== true) {
      throwWorkflowError(
        "missing_required_section",
        "required sections must be present before moving a card to Ready",
        { from: input.from, to: input.to }
      );
    }

    if (input.actorKind === "agent" && input.humanInstructionGranted !== true) {
      throwWorkflowError(
        "forbidden_action",
        "agents may only move cards to Ready under explicit human instruction, try again with `--actor human` flag",
        { from: input.from, to: input.to }
      );
    }

    return;
  }

  if (input.from === CardState.Ready && input.to === CardState.InProgress) {
    const currentOwnerId = input.ownerId ?? null;
    const targetOwnerId = input.targetOwnerId ?? currentOwnerId;

    assertReadyPickupAllowed({
      policy,
      actorKind: input.actorKind,
      currentOwnerId,
      targetOwnerId,
      ...(input.humanInstructionGranted === undefined
        ? {}
        : { humanInstructionGranted: input.humanInstructionGranted }),
      ...(input.actorId === undefined ? {} : { actorId: input.actorId }),
    });

    return;
  }

  if (input.from === CardState.InProgress && input.to === CardState.InReview) {
    // Basic validation for moving to review
    if (input.ownerId === null || input.ownerId === undefined) {
      throwWorkflowError("missing_owner", "an owner is required before a card can be reviewed", {
        from: input.from,
        to: input.to,
      });
    }
    return;
  }

  if (input.from === CardState.InReview && input.to === CardState.Done) {
    // Reuse existing Done validation, ensuring it comes from InReview
    validateDoneTransition(input);
    return;
  }

  if (input.from === CardState.InReview && input.to === CardState.InProgress) {
    // Basic validation for moving back for fixes
    if (input.ownerId === null || input.ownerId === undefined) {
      throwWorkflowError("missing_owner", "an owner is required before a card can be moved back for fixes", {
        from: input.from,
        to: input.to,
      });
    }
    return;
  }
}
