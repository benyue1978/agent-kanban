#!/usr/bin/env node

import { ApiClient, CliApiError, asErrorResponse } from "./client.js";
import { runAppendSummaryCommand } from "./commands/append-summary.js";
import { runAssignOwnerCommand } from "./commands/assign-owner.js";
import { runCommentCommand } from "./commands/comment.js";
import type { CommandEnvironment } from "./commands/common.js";
import { runCreateCommand } from "./commands/create.js";
import { runListCommand } from "./commands/list.js";
import { runSetStateCommand } from "./commands/set-state.js";
import { runShowCommand } from "./commands/show.js";
import { runUpdateCardCommand } from "./commands/update-card.js";

function isJsonRequested(args: string[]): boolean {
  return args.includes("--json");
}

function printSuccess(result: unknown, json: boolean): void {
  if (json) {
    process.stdout.write(`${JSON.stringify(result)}\n`);
    return;
  }

  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
}

function printFailure(error: unknown, json: boolean): void {
  if (json) {
    process.stderr.write(`${JSON.stringify(asErrorResponse(error))}\n`);
    return;
  }

  if (error instanceof CliApiError) {
    process.stderr.write(`${error.message}\n`);
    return;
  }

  process.stderr.write(`${error instanceof Error ? error.message : "unexpected cli error"}\n`);
}

async function main(): Promise<void> {
  const [command, ...args] = process.argv.slice(2);
  const json = isJsonRequested(args);

  if (command === undefined) {
    printFailure(new Error("missing command"), json);
    process.exitCode = 1;
    return;
  }

  const env: CommandEnvironment = {
    ...(process.env.KANBAN_ACTOR_ID === undefined
      ? {}
      : { actorId: process.env.KANBAN_ACTOR_ID }),
    ...(process.env.KANBAN_API_URL === undefined
      ? {}
      : { apiUrl: process.env.KANBAN_API_URL }),
    ...(process.env.KANBAN_PROJECT_ID === undefined
      ? {}
      : { projectId: process.env.KANBAN_PROJECT_ID }),
  };

  if (env.apiUrl === undefined) {
    printFailure(new Error("KANBAN_API_URL is required"), json);
    process.exitCode = 1;
    return;
  }

  const client = new ApiClient(env.apiUrl);
  const context = { args, client, env };

  try {
    const result =
      command === "list"
        ? await runListCommand(context)
        : command === "show"
          ? await runShowCommand(context)
          : command === "create"
            ? await runCreateCommand(context)
            : command === "assign-owner"
              ? await runAssignOwnerCommand(context)
              : command === "set-state"
                ? await runSetStateCommand(context)
                : command === "update-card"
                  ? await runUpdateCardCommand(context)
                  : command === "append-summary"
                    ? await runAppendSummaryCommand(context)
                    : command === "comment"
                      ? await runCommentCommand(context)
                      : null;

    if (result === null) {
      throw new Error(`unknown command: ${command}`);
    }

    printSuccess(result, json);
  } catch (error) {
    printFailure(error, json);
    process.exitCode = 1;
  }
}

await main();
