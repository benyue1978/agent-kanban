import { defaultProjectPolicy, type ErrorCode, type ProjectPolicy } from "@agent-kanban/contracts";

export class WorkflowDomainError extends Error {
  readonly code: ErrorCode;
  readonly details: Record<string, unknown> | undefined;

  constructor(code: ErrorCode, message: string, details?: Record<string, unknown>) {
    super(message);
    this.name = "WorkflowDomainError";
    this.code = code;
    this.details = details;
  }
}

export interface ReviewGatePolicyContext {
  policy?: ProjectPolicy;
  actorKind: "human" | "agent";
  actorId?: string;
  ownerId?: string | null;
}

export interface ReadyPickupPolicyContext {
  policy?: ProjectPolicy;
  actorKind: "human" | "agent";
  actorId?: string;
  currentOwnerId?: string | null;
  targetOwnerId?: string | null;
}

function resolvePolicy(policy?: ProjectPolicy): ProjectPolicy {
  return policy ?? defaultProjectPolicy;
}

function isSelfReview(actorId: string | undefined, ownerId: string | null | undefined): boolean {
  return actorId !== undefined && ownerId !== undefined && ownerId !== null && actorId === ownerId;
}

export function assertReviewGateAllowed(context: ReviewGatePolicyContext): void {
  const policy = resolvePolicy(context.policy);

  if (context.actorKind === "agent") {
    if (!policy.allowAgentReview) {
      throw new WorkflowDomainError(
        "forbidden_action",
        "agents are not allowed to pass the review gate",
        { actorKind: context.actorKind }
      );
    }

    if (isSelfReview(context.actorId, context.ownerId) && !policy.allowSelfReview) {
      throw new WorkflowDomainError(
        "forbidden_action",
        "self review is not allowed",
        { actorId: context.actorId, ownerId: context.ownerId }
      );
    }

    return;
  }

  if (isSelfReview(context.actorId, context.ownerId) && !policy.allowSelfReview) {
    throw new WorkflowDomainError(
      "forbidden_action",
      "self review is not allowed",
      { actorId: context.actorId, ownerId: context.ownerId }
    );
  }
}

export function assertReadyPickupAllowed(context: ReadyPickupPolicyContext): void {
  const policy = resolvePolicy(context.policy);
  const currentOwnerId = context.currentOwnerId ?? null;
  const targetOwnerId = context.targetOwnerId ?? currentOwnerId;

  if (currentOwnerId !== null) {
    return;
  }

  if (context.actorKind !== "agent") {
    return;
  }

  if (!policy.allowAgentPickUnassignedReady) {
    throw new WorkflowDomainError(
      "forbidden_action",
      "agents may not pick unassigned ready cards",
      { actorKind: context.actorKind }
    );
  }

  if (targetOwnerId !== null && targetOwnerId !== context.actorId) {
    throw new WorkflowDomainError(
      "forbidden_action",
      "agents may only claim an unassigned ready card for themselves",
      {
        actorId: context.actorId,
        targetOwnerId,
      }
    );
  }
}
