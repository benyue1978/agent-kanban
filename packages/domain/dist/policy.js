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
    const targetOwnerId = context.targetOwnerId ?? currentOwnerId;
    if (currentOwnerId !== null) {
        return;
    }
    if (context.actorKind !== "agent") {
        return;
    }
    if (!policy.allowAgentPickUnassignedReady) {
        throw new WorkflowDomainError("forbidden_action", "agents may not pick unassigned ready cards", { actorKind: context.actorKind });
    }
    if (targetOwnerId !== null && targetOwnerId !== context.actorId) {
        throw new WorkflowDomainError("forbidden_action", "agents may only claim an unassigned ready card for themselves", {
            actorId: context.actorId,
            targetOwnerId,
        });
    }
}
