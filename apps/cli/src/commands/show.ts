import type { CommandContext } from "./common.js";

export async function runShowCommand(options: any, { client }: CommandContext) {
  const cardId = options.id;
  if (typeof cardId !== "string" || cardId.length === 0) {
    throw new Error("missing required flag --id");
  }
  return await client.getCard(cardId);
}
