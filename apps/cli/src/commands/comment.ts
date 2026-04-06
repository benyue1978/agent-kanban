import { resolveActorId, type CommandContext } from "./common.js";

export async function runCommentCommand(options: any, { client, env }: CommandContext) {
  const cardId = options.id;
  if (typeof cardId !== "string" || cardId.length === 0) {
    throw new Error("missing required flag --id");
  }

  const body = options.body;
  if (typeof body !== "string" || body.length === 0) {
    throw new Error("missing required flag --body");
  }

  const kind = options.kind;
  if (typeof kind !== "string" || kind.length === 0) {
    throw new Error("missing required flag --kind");
  }

  return await client.addComment(cardId, {
    authorId: resolveActorId(options, env, "author"),
    body,
    kind,
  });
}
