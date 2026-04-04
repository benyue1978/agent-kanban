import { type CardStateValue, type ProjectPolicy } from "@agent-kanban/contracts";
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
export declare function canTransition(input: WorkflowTransitionInput): void;
//# sourceMappingURL=workflow.d.ts.map