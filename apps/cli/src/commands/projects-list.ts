import type { CommandContext } from "./common.js";

export async function runProjectsListCommand(_options: any, { client }: CommandContext) {
  return await client.listProjects();
}
