import { getCardRevision } from "../client.js";
import type { CommandContext } from "./common.js";
import {
  parseCommandArgs,
  requireStringFlag,
  resolveActorId,
} from "./common.js";

export async function runAssignOwnerCommand({ args, client, env }: CommandContext) {
  const { values } = parseCommandArgs(args, {
    actor: { type: "string" },
    id: { type: "string" },
    json: { type: "boolean" },
    to: { type: "string" },
  });
  const cardId = requireStringFlag(values, "id");
  const ownerValue = requireStringFlag(values, "to");
  const card = await client.getCard(cardId);

  return await client.assignOwner(cardId, {
    actorId: resolveActorId(values, env),
    ownerId: ownerValue === "none" ? null : ownerValue,
    revision: getCardRevision(card.card),
  });
}
