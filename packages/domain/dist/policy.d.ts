import { type ErrorCode, type ProjectPolicy } from "@agent-kanban/contracts";
export declare class WorkflowDomainError extends Error {
    readonly code: ErrorCode;
    readonly details: Record<string, unknown> | undefined;
    constructor(code: ErrorCode, message: string, details?: Record<string, unknown>);
}
export interface ReadyPickupPolicyContext {
    policy?: ProjectPolicy;
    actorKind: "human" | "agent";
    actorId?: string;
    currentOwnerId?: string | null;
    targetOwnerId?: string | null;
    humanInstructionGranted?: boolean;
}
export declare function assertReadyPickupAllowed(context: ReadyPickupPolicyContext): void;
//# sourceMappingURL=policy.d.ts.map