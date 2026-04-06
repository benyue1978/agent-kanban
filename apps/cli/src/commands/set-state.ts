import { requireCardStateValue, resolveActorId, type CommandContext } from "./common.js";

export async function runSetStateCommand(options: any, { client, env }: CommandContext) {
  const cardId = options.id;
  if (typeof cardId !== "string" || cardId.length === 0) {
    throw new Error("missing required flag --id");
  }

  const { card } = await client.getCard(cardId);
  const revision = options.revision !== undefined ? Number.parseInt(String(options.revision), 10) : card.revision;

  return await client.setState(cardId, {
    actorId: resolveActorId(options, env),
    to: requireCardStateValue(options, "to"),
    ownerId: typeof options.owner === "string" ? options.owner : undefined,
    revision,
  });
}
