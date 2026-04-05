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

export interface ReadyPickupPolicyContext {
  policy?: ProjectPolicy;
  actorKind: "human" | "agent";
  actorId?: string;
  currentOwnerId?: string | null;
  targetOwnerId?: string | null;
  humanInstructionGranted?: boolean;
}

function resolvePolicy(policy?: ProjectPolicy): ProjectPolicy {
  return policy ?? defaultProjectPolicy;
}

export function assertReadyPickupAllowed(context: ReadyPickupPolicyContext): void {
  const policy = resolvePolicy(context.policy);
  const currentOwnerId = context.currentOwnerId ?? null;
  const targetOwnerId = context.targetOwnerId ?? null;

  if (targetOwnerId === null) {
    throw new WorkflowDomainError(
      "missing_owner",
      "an owner is required to move a ready card into progress",
      {
        actorKind: context.actorKind,
      }
    );
  }

  if (context.actorKind !== "agent") {
    return;
  }

  if (context.actorId === undefined) {
    throw new WorkflowDomainError(
      "forbidden_action",
      "agents must identify themselves when claiming a ready card",
      { actorKind: context.actorKind }
    );
  }

  if (currentOwnerId === null) {
    if (!policy.allowAgentPickUnassignedReady && context.humanInstructionGranted !== true) {
      throw new WorkflowDomainError(
        "forbidden_action",
        "agents may not pick unassigned ready cards",
        { actorKind: context.actorKind }
      );
    }

    if (targetOwnerId !== context.actorId) {
      throw new WorkflowDomainError(
        "forbidden_action",
        "agents may only claim an unassigned ready card for themselves",
        {
          actorId: context.actorId,
          targetOwnerId,
        }
      );
    }

    return;
  }

  if (context.actorId !== currentOwnerId) {
    throw new WorkflowDomainError(
      "forbidden_action",
      "agents may not start a card already assigned to another owner",
      {
        actorId: context.actorId,
        currentOwnerId,
        targetOwnerId,
      }
    );
  }

  if (targetOwnerId !== currentOwnerId) {
    throw new WorkflowDomainError(
      "forbidden_action",
      "agent claims must keep the existing assigned owner",
      {
        actorId: context.actorId,
        currentOwnerId,
        targetOwnerId,
      }
    );
  }
}
