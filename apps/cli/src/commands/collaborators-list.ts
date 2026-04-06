import type { CommandContext } from "./common.js";

export async function runCollaboratorsListCommand(_options: any, { client }: CommandContext) {
  return await client.listCollaborators();
}
