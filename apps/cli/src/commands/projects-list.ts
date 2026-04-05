import type { CommandContext } from "./common.js";

export async function runProjectsListCommand({ client }: CommandContext) {
  return await client.listProjects();
}
