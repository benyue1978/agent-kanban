import { CardState } from "@agent-kanban/contracts";
import { getOptionalStringFlag, parseCommandArgs, resolveProjectId, } from "./common.js";
const orderedStates = [
    CardState.New,
    CardState.Ready,
    CardState.InProgress,
    CardState.InReview,
    CardState.Done,
];
export async function runListCommand({ args, client, env }) {
    const { values } = parseCommandArgs(args, {
        json: { type: "boolean" },
        project: { type: "string" },
        state: { type: "string" },
        "assigned-to": { type: "string" },
    });
    const projectId = resolveProjectId(values, env);
    const stateFilter = getOptionalStringFlag(values, "state");
    const assignedToValue = getOptionalStringFlag(values, "assigned-to");
    const assignedTo = assignedToValue === "me" ? env.actorId : assignedToValue;
    const board = await client.getBoard(projectId);
    const cards = orderedStates
        .flatMap((state) => [...board.columns[state].cards])
        .filter((card) => {
        if (stateFilter !== undefined && card.state !== stateFilter) {
            return false;
        }
        if (assignedTo !== undefined && card.owner?.id !== assignedTo) {
            return false;
        }
        return true;
    });
    return { cards };
}
