#!/usr/bin/env node

import { ApiClient, CliApiError, asErrorResponse } from "./client.js";
import { runAppendSummaryCommand } from "./commands/append-summary.js";
import { runAssignOwnerCommand } from "./commands/assign-owner.js";
import { runCommentCommand } from "./commands/comment.js";
import type { CommandEnvironment } from "./commands/common.js";
import { runCreateCommand } from "./commands/create.js";
import { runListCommand } from "./commands/list.js";
import { runProjectsCreateCommand } from "./commands/projects-create.js";
import { runProjectsListCommand } from "./commands/projects-list.js";
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

function printHelp(message: string): void {
  process.stdout.write(`${message}\n`);
}

function topLevelHelp(): string {
  return `Usage:
  kanban projects list [--json]
  kanban projects create [--name <name>] [--repo-url <url>] [--description <text>] [--policy-file <path>] [--json]
  kanban cards list [--project <id>] [--state <new|ready|in-progress|done>] [--assigned-to <id>] [--json]
  kanban cards show --id <card-id> [--json]
  kanban cards create [--project <id>] --title <title> [--description-file <path>] [--priority <n>] [--actor <id>] [--json]
  kanban cards assign-owner --id <card-id> --to <owner-id|none> [--actor <id>] [--json]
  kanban cards set-state --id <card-id> --to <new|ready|in-progress|done> [--owner <owner-id>] [--actor <id>] [--json]
  kanban cards update --id <card-id> --file <path> --revision <n> [--actor <id>] [--json]
  kanban cards append-summary --id <card-id> --file <path> [--actor <id>] [--json]
  kanban cards comment --id <card-id> --body <text> --kind <progress|question|decision|note|verification> [--author <id>] [--json]`;
}

function projectsHelp(): string {
  return `Usage:
  kanban projects list [--json]
  kanban projects create [--name <name>] [--repo-url <url>] [--description <text>] [--policy-file <path>] [--json]`;
}

function cardsHelp(): string {
  return `Usage:
  kanban cards list [--project <id>] [--state <new|ready|in-progress|done>] [--assigned-to <id>] [--json]
  kanban cards show --id <card-id> [--json]
  kanban cards create [--project <id>] --title <title> [--description-file <path>] [--priority <n>] [--actor <id>] [--json]
  kanban cards assign-owner --id <card-id> --to <owner-id|none> [--actor <id>] [--json]
  kanban cards set-state --id <card-id> --to <new|ready|in-progress|done> [--owner <owner-id>] [--actor <id>] [--json]
  kanban cards update --id <card-id> --file <path> --revision <n> [--actor <id>] [--json]
  kanban cards append-summary --id <card-id> --file <path> [--actor <id>] [--json]
  kanban cards comment --id <card-id> --body <text> --kind <progress|question|decision|note|verification> [--author <id>] [--json]`;
}

async function dispatchCommand(
  resource: string,
  action: string,
  args: string[],
  env: CommandEnvironment
): Promise<unknown> {
  if (env.apiUrl === undefined) {
    throw new Error("KANBAN_API_URL is required");
  }

  const client = new ApiClient(env.apiUrl);
  const context = { args, client, env };

  if (resource === "projects") {
    return action === "list"
      ? await runProjectsListCommand(context)
      : action === "create"
        ? await runProjectsCreateCommand(context)
        : null;
  }

  if (resource === "cards") {
    return action === "list"
      ? await runListCommand(context)
      : action === "show"
        ? await runShowCommand(context)
        : action === "create"
          ? await runCreateCommand(context)
          : action === "assign-owner"
            ? await runAssignOwnerCommand(context)
            : action === "set-state"
              ? await runSetStateCommand(context)
              : action === "update"
                ? await runUpdateCardCommand(context)
                : action === "append-summary"
                  ? await runAppendSummaryCommand(context)
                  : action === "comment"
                    ? await runCommentCommand(context)
                    : null;
  }

  return null;
}

async function main(): Promise<void> {
  const [resource, action, ...args] = process.argv.slice(2);
  const json = isJsonRequested([resource, action, ...args].filter((value): value is string => value !== undefined));

  if (resource === undefined || resource === "--help") {
    printHelp(topLevelHelp());
    return;
  }

  if (resource === "projects" && (action === undefined || action === "--help")) {
    printHelp(projectsHelp());
    return;
  }

  if (resource === "cards" && (action === undefined || action === "--help")) {
    printHelp(cardsHelp());
    return;
  }

  const env: CommandEnvironment = {
    ...(process.env.KANBAN_ACTOR_ID === undefined
      ? {}
      : { actorId: process.env.KANBAN_ACTOR_ID }),
    ...(process.env.KANBAN_API_URL === undefined
      ? {}
      : { apiUrl: process.env.KANBAN_API_URL }),
  };

  try {
    const result = await dispatchCommand(resource, action ?? "", args, env);

    if (result === null) {
      throw new Error(`unknown command: ${resource}${action === undefined ? "" : ` ${action}`}`);
    }

    printSuccess(result, json);
  } catch (error) {
    printFailure(error, json);
    process.exitCode = 1;
  }
}

await main();
