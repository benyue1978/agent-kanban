import { type DefaultSelectionPolicy } from "@agent-kanban/contracts";
export interface ReadyCardCandidate {
    id: string;
    priority: number | null;
    readyAt: string | number | Date;
    updatedAt: string | number | Date;
}
export declare function sortReadyCards<T extends ReadyCardCandidate>(cards: readonly T[], policy?: DefaultSelectionPolicy): T[];
//# sourceMappingURL=selection.d.ts.map