import { readTextFile, resolveActorId, type CommandContext } from "./common.js";

export async function runUpdateCardCommand(options: any, { client, env }: CommandContext) {
  const cardId = options.id;
  if (typeof cardId !== "string" || cardId.length === 0) {
    throw new Error("missing required flag --id");
  }

  const file = options.file;
  if (typeof file !== "string" || file.length === 0) {
    throw new Error("missing required flag --file");
  }

  const revision = options.revision;
  if (revision === undefined) {
    throw new Error("missing required flag --revision");
  }

  return await client.updateMarkdown(cardId, {
    actorId: resolveActorId(options, env),
    descriptionMd: await readTextFile(file),
    revision: Number.parseInt(String(revision), 10),
  });
}
