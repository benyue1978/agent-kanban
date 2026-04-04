import { getCardRevision } from "../client.js";
import type { CommandContext } from "./common.js";
import {
  parseCommandArgs,
  readTextFile,
  requireStringFlag,
  resolveActorId,
} from "./common.js";

export async function runAppendSummaryCommand({ args, client, env }: CommandContext) {
  const { values } = parseCommandArgs(args, {
    actor: { type: "string" },
    file: { type: "string" },
    id: { type: "string" },
    json: { type: "boolean" },
  });
  const cardId = requireStringFlag(values, "id");
  const summaryMd = await readTextFile(requireStringFlag(values, "file"));
  const card = await client.getCard(cardId);

  return await client.appendSummary(cardId, {
    actorId: resolveActorId(values, env),
    revision: getCardRevision(card.card),
    summaryMd,
  });
}
