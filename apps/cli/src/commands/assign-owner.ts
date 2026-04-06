import { resolveActorId, type CommandContext } from "./common.js";

export async function runAssignOwnerCommand(options: any, { client, env }: CommandContext) {
  const cardId = options.id;
  if (typeof cardId !== "string" || cardId.length === 0) {
    throw new Error("missing required flag --id");
  }

  const to = options.to;
  if (typeof to !== "string" || to.length === 0) {
    throw new Error("missing required flag --to");
  }

  return await client.assignOwner(cardId, {
    actorId: resolveActorId(options, env),
    ownerId: to === "none" ? null : to,
  });
}
