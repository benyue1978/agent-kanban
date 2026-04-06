import type { CommandContext } from "./common.js";

export async function runConfigCommand(_options: any, { env }: CommandContext) {
  return {
    config: {
      apiUrl: env.apiUrl,
      actorId: env.actorId,
    },
  };
}
