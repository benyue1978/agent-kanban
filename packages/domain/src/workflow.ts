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
  humanInstructionGranted?: boolean;
  requiredSectionsPresent?: boolean;
  executionResultPresent?: boolean;
  reviewGatePassed?: boolean;
  summaryPresent?: boolean;
  dodCheckPresent?: boolean;
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
        "agents may only move cards to Ready under explicit human instruction",
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
      ...(input.actorId === undefined ? {} : { actorId: input.actorId }),
    });

    return;
  }

  if (input.from === CardState.InProgress && input.to === CardState.InReview) {
    if (input.actorId === undefined) {
      throwWorkflowError(
        "forbidden_action",
        "review transitions require reviewer identity",
        { from: input.from, to: input.to }
      );
    }

    if (input.ownerId === null || input.ownerId === undefined) {
      throwWorkflowError(
        "missing_owner",
        "an owner is required to move a card into review",
        { from: input.from, to: input.to }
      );
    }

    if (input.executionResultPresent !== true) {
      throwWorkflowError(
        "missing_required_section",
        "an execution result is required before moving a card into review",
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
    if (input.actorId === undefined) {
      throwWorkflowError(
        "forbidden_action",
        "review transitions require reviewer identity",
        { from: input.from, to: input.to }
      );
    }

    if (input.actorKind === "agent" && !policy.allowAgentReview) {
      throwWorkflowError(
        "forbidden_action",
        "agents are not allowed to reopen cards from review",
        { from: input.from, to: input.to }
      );
    }

    if (input.actorId !== undefined && input.ownerId !== undefined && input.ownerId !== null) {
      assertReviewGateAllowed({
        policy,
        actorKind: input.actorKind,
        ownerId: input.ownerId,
        actorId: input.actorId,
      });
    }

    if (input.ownerId === null || input.ownerId === undefined) {
      throwWorkflowError(
        "missing_owner",
        "a card in review must have an owner before it can be reopened",
        { from: input.from, to: input.to }
      );
    }

    if (input.reviewRationalePresent !== true) {
      throwWorkflowError(
        "missing_required_section",
        "review rationale is required before reopening a card",
        { from: input.from, to: input.to }
      );
    }

    return;
  }

  if (input.from === CardState.InReview && input.to === CardState.Done) {
    if (input.actorId === undefined) {
      throwWorkflowError(
        "forbidden_action",
        "review transitions require reviewer identity",
        { from: input.from, to: input.to }
      );
    }

    if (input.actorKind === "agent" && !policy.allowAgentReview) {
      throwWorkflowError(
        "forbidden_action",
        "agents are not allowed to complete review",
        { from: input.from, to: input.to }
      );
    }

    if (input.ownerId !== undefined && input.ownerId !== null) {
      assertReviewGateAllowed({
        policy,
        actorKind: input.actorKind,
        ownerId: input.ownerId,
        actorId: input.actorId,
      });
    }

    if (input.ownerId === null || input.ownerId === undefined) {
      throwWorkflowError(
        "missing_owner",
        "a card in review must have an owner before it can be completed",
        { from: input.from, to: input.to }
      );
    }

    if (input.summaryPresent !== true) {
      throwWorkflowError(
        "summary_required",
        "a final summary is required before a card can be completed",
        { from: input.from, to: input.to }
      );
    }

    if (input.dodCheckPresent !== true) {
      throwWorkflowError(
        "summary_required",
        "a DoD Check is required before a card can be completed",
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
  }
}
