import {
  CardState,
  defaultProjectPolicy,
  type CardStateValue,
  type ErrorCode,
  type ProjectPolicy,
} from "@agent-kanban/contracts";
import { assertReadyPickupAllowed, assertReviewGateAllowed, WorkflowDomainError } from "./policy.js";

export interface WorkflowTransitionInput {
  from: CardStateValue;
  to: CardStateValue;
  actorKind: "human" | "agent";
  actorId?: string;
  ownerId?: string | null;
  targetOwnerId?: string | null;
  policy?: ProjectPolicy;
  requiredSectionsPresent?: boolean;
  reviewGatePassed?: boolean;
  summaryPresent?: boolean;
  reviewRationalePresent?: boolean;
}

const allowedTransitions = new Set<string>([
  `${CardState.New}=>${CardState.Ready}`,
  `${CardState.Ready}=>${CardState.InProgress}`,
  `${CardState.InProgress}=>${CardState.InReview}`,
  `${CardState.InReview}=>${CardState.Done}`,
  `${CardState.InReview}=>${CardState.InProgress}`,
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

function isSameActor(actorId: string | undefined, ownerId: string | null | undefined): boolean {
  return actorId !== undefined && ownerId !== undefined && ownerId !== null && actorId === ownerId;
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
    if (input.requiredSectionsPresent === false) {
      throwWorkflowError(
        "missing_required_section",
        "required sections must be present before moving a card to Ready",
        { from: input.from, to: input.to }
      );
    }

    return;
  }

  if (input.from === CardState.Ready && input.to === CardState.InProgress) {
    const currentOwnerId = input.ownerId ?? null;
    const targetOwnerId = input.targetOwnerId ?? currentOwnerId;

    if (currentOwnerId === null && targetOwnerId === null) {
      if (input.actorKind === "agent") {
        if (!policy.allowAgentPickUnassignedReady) {
          throwWorkflowError(
            "forbidden_action",
            "agents may not pick unassigned ready cards",
            { from: input.from, to: input.to }
          );
        }

        if (input.actorId === undefined) {
          throwWorkflowError(
            "missing_owner",
            "an owner is required to move a ready card into progress",
            { from: input.from, to: input.to }
          );
        }
      } else {
        throwWorkflowError(
          "missing_owner",
          "an owner is required to move a ready card into progress",
          { from: input.from, to: input.to }
        );
      }
    }

    assertReadyPickupAllowed({
      policy,
      actorKind: input.actorKind,
      currentOwnerId,
      targetOwnerId,
      ...(input.actorId === undefined ? {} : { actorId: input.actorId }),
    });

    return;
  }

  if (input.from === CardState.InProgress && input.to === CardState.InReview) {
    if (input.ownerId === null || input.ownerId === undefined) {
      throwWorkflowError(
        "missing_owner",
        "an owner is required to move a card into review",
        { from: input.from, to: input.to }
      );
    }

    if (input.actorKind === "agent" && !isSameActor(input.actorId, input.ownerId)) {
      throwWorkflowError(
        "forbidden_action",
        "only the current owner may move the card into review",
        { actorId: input.actorId, ownerId: input.ownerId }
      );
    }

    return;
  }

  if (input.from === CardState.InReview && input.to === CardState.InProgress) {
    if (input.ownerId === null || input.ownerId === undefined) {
      throwWorkflowError(
        "missing_owner",
        "a card in review must have an owner before it can be reopened",
        { from: input.from, to: input.to }
      );
    }

    if (input.reviewRationalePresent === false) {
      throwWorkflowError(
        "missing_required_section",
        "review rationale is required before reopening a card",
        { from: input.from, to: input.to }
      );
    }

    assertReviewGateAllowed({
      policy,
      actorKind: input.actorKind,
      ownerId: input.ownerId,
      ...(input.actorId === undefined ? {} : { actorId: input.actorId }),
    });

    return;
  }

  if (input.from === CardState.InReview && input.to === CardState.Done) {
    if (input.ownerId === null || input.ownerId === undefined) {
      throwWorkflowError(
        "missing_owner",
        "a card in review must have an owner before it can be completed",
        { from: input.from, to: input.to }
      );
    }

    if (input.summaryPresent === false) {
      throwWorkflowError(
        "summary_required",
        "a final summary is required before a card can be completed",
        { from: input.from, to: input.to }
      );
    }

    if (input.reviewGatePassed !== true) {
      throwWorkflowError(
        "review_gate_not_passed",
        "the review gate must be passed before a card can be completed",
        { from: input.from, to: input.to }
      );
    }

    assertReviewGateAllowed({
      policy,
      actorKind: input.actorKind,
      ownerId: input.ownerId,
      ...(input.actorId === undefined ? {} : { actorId: input.actorId }),
    });
  }
}
