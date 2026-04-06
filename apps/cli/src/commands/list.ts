import { CardState, type CardListItem } from "@agent-kanban/contracts";
import { getOptionalCardStateValue, resolveProjectId, type CommandContext } from "./common.js";

const orderedStates = [
  CardState.New,
  CardState.Ready,
  CardState.InProgress,
  CardState.Done,
] as const;

export async function runListCommand(options: any, { client, env }: CommandContext) {
  const projectId = await resolveProjectId(options, env, client);
  const stateFilter = getOptionalCardStateValue(options, "state");
  const assignedToValue = options.assignedTo;
  const assignedTo = assignedToValue === "me" ? env.actorId : (typeof assignedToValue === "string" ? assignedToValue : undefined);
  
  const board = await client.getBoard(projectId);
  const cards = orderedStates
    .flatMap((state) => [...board.columns[state].cards] as CardListItem[])
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
