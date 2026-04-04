import { type CardStateValue, type ProjectPolicy } from "@agent-kanban/contracts";
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
    executionResultPresent?: boolean;
    reviewGatePassed?: boolean;
    summaryPresent?: boolean;
    dodCheckPresent?: boolean;
    reviewRationalePresent?: boolean;
}
export declare function canTransition(input: WorkflowTransitionInput): void;
//# sourceMappingURL=workflow.d.ts.map