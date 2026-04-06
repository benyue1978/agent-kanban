import { type CommandContext, parseCommandArgs } from "./common.js";

export async function runConfigCommand(context: CommandContext): Promise<unknown> {
  const { values } = parseCommandArgs(context.args, {
    json: { type: "boolean" },
  });

  const apiUrl = context.env.apiUrl ?? "http://127.0.0.1:3001";
  const actorId = context.env.actorId ?? "unknown";

  return {
    config: {
      apiUrl,
      actorId,
      source: {
        apiUrl: context.env.apiUrl ? "environment/flag" : "default",
        actorId: context.env.actorId ? "environment" : "default",
      },
    },
  };
}
