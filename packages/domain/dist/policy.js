import { defaultProjectPolicy } from "@agent-kanban/contracts";
export class WorkflowDomainError extends Error {
    code;
    details;
    constructor(code, message, details) {
        super(message);
        this.name = "WorkflowDomainError";
        this.code = code;
        this.details = details;
    }
}
function resolvePolicy(policy) {
    return policy ?? defaultProjectPolicy;
}
function isSelfReview(actorId, ownerId) {
    return actorId !== undefined && ownerId !== undefined && ownerId !== null && actorId === ownerId;
}
export function assertReviewGateAllowed(context) {
    const policy = resolvePolicy(context.policy);
    if (context.actorKind === "agent") {
        if (!policy.allowAgentReview) {
            throw new WorkflowDomainError("forbidden_action", "agents are not allowed to pass the review gate", { actorKind: context.actorKind });
        }
        if (isSelfReview(context.actorId, context.ownerId) && !policy.allowSelfReview) {
            throw new WorkflowDomainError("forbidden_action", "self review is not allowed", { actorId: context.actorId, ownerId: context.ownerId });
        }
        return;
    }
    if (isSelfReview(context.actorId, context.ownerId) && !policy.allowSelfReview) {
        throw new WorkflowDomainError("forbidden_action", "self review is not allowed", { actorId: context.actorId, ownerId: context.ownerId });
    }
}
export function assertReadyPickupAllowed(context) {
    const policy = resolvePolicy(context.policy);
    const currentOwnerId = context.currentOwnerId ?? null;
    const targetOwnerId = context.targetOwnerId ?? null;
    if (targetOwnerId === null) {
        throw new WorkflowDomainError("missing_owner", "an owner is required to move a ready card into progress", {
            actorKind: context.actorKind,
        });
    }
    if (context.actorKind !== "agent") {
        return;
    }
    if (context.actorId === undefined) {
        throw new WorkflowDomainError("forbidden_action", "agents must identify themselves when claiming a ready card", { actorKind: context.actorKind });
    }
    if (currentOwnerId === null) {
        if (!policy.allowAgentPickUnassignedReady && context.humanInstructionGranted !== true) {
            throw new WorkflowDomainError("forbidden_action", "agents may not pick unassigned ready cards", { actorKind: context.actorKind });
        }
        if (targetOwnerId !== context.actorId) {
            throw new WorkflowDomainError("forbidden_action", "agents may only claim an unassigned ready card for themselves", {
                actorId: context.actorId,
                targetOwnerId,
            });
        }
        return;
    }
    if (context.actorId !== currentOwnerId) {
        throw new WorkflowDomainError("forbidden_action", "agents may not start a card already assigned to another owner", {
            actorId: context.actorId,
            currentOwnerId,
            targetOwnerId,
        });
    }
    if (targetOwnerId !== currentOwnerId) {
        throw new WorkflowDomainError("forbidden_action", "agent claims must keep the existing assigned owner", {
            actorId: context.actorId,
            currentOwnerId,
            targetOwnerId,
        });
    }
}
