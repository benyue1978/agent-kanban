import { type CardListItem } from "@agent-kanban/contracts";
import type { CommandContext } from "./common.js";
export declare function runListCommand({ args, client, env }: CommandContext): Promise<{
    cards: CardListItem[];
}>;
//# sourceMappingURL=list.d.ts.map