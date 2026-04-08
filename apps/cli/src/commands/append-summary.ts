import { readTextFile, resolveActorId, type CommandContext } from "./common.js";

export async function runAppendSummaryCommand(options: any, { client, env }: CommandContext) {
  const cardId = options.id;
  if (typeof cardId !== "string" || cardId.length === 0) {
    throw new Error("missing required flag --id");
  }

  const file = options.file;
  if (typeof file !== "string" || file.length === 0) {
    throw new Error("missing required flag --file");
  }

  const { card } = await client.getCard(cardId);

  return await client.appendSummary(cardId, {
    revision: card.revision,
    actorId: resolveActorId(options, env),
    summaryMd: await readTextFile(file),
    ...(options.replace ? { replace: true } : {}),
  });
}
