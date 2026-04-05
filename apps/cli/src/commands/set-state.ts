import { CardState } from "@agent-kanban/contracts";
import { getCardRevision } from "../client.js";
import type { CommandContext } from "./common.js";
import {
  getOptionalStringFlag,
  parseCommandArgs,
  requireCardStateValue,
  requireStringFlag,
  resolveActorId,
} from "./common.js";

export async function runSetStateCommand({ args, client, env }: CommandContext) {
  const { values } = parseCommandArgs(args, {
    actor: { type: "string" },
    id: { type: "string" },
    json: { type: "boolean" },
    owner: { type: "string" },
    to: { type: "string" },
  });
  const cardId = requireStringFlag(values, "id");
  const to = requireCardStateValue(values, "to");
  const actorId = resolveActorId(values, env);
  const ownerValue = getOptionalStringFlag(values, "owner");
  const card = await client.getCard(cardId);

  if (to === CardState.InProgress && ownerValue === undefined) {
    throw new Error("missing required flag --owner when setting state to in-progress");
  }

  return await client.setState(cardId, {
    actorId,
    ...(to === CardState.InProgress ? { ownerId: ownerValue } : {}),
    revision: getCardRevision(card.card),
    to,
  });
}
