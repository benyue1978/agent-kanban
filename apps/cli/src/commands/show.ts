import type { CommandContext } from "./common.js";
import { parseCommandArgs, requireStringFlag } from "./common.js";

export async function runShowCommand({ args, client }: CommandContext) {
  const { values } = parseCommandArgs(args, {
    id: { type: "string" },
    json: { type: "boolean" },
  });

  return await client.getCard(requireStringFlag(values, "id"));
}
