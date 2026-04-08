#!/usr/bin/env node

import { Command } from "commander";
import { ApiClient, CliApiError, asErrorResponse } from "./client.js";
import { runAppendSummaryCommand } from "./commands/append-summary.js";
import { runAssignOwnerCommand } from "./commands/assign-owner.js";
import { runCommentCommand } from "./commands/comment.js";
import { loadLocalConfig, type CommandEnvironment, type CommandContext } from "./commands/common.js";
import { runConfigCommand } from "./commands/config.js";
import { runCreateCommand } from "./commands/create.js";
import { runListCommand } from "./commands/list.js";
import { runProjectsCreateCommand } from "./commands/projects-create.js";
import { runProjectsListCommand } from "./commands/projects-list.js";
import { runCollaboratorsListCommand } from "./commands/collaborators-list.js";
import { runSetStateCommand } from "./commands/set-state.js";
import { runShowCommand } from "./commands/show.js";
import { runUpdateCardCommand } from "./commands/update-card.js";

const defaultApiUrl = "http://127.0.0.1:3001";

function printSuccess(result: unknown, json: boolean): void {
  if (json) {
    process.stdout.write(`${JSON.stringify(result)}\n`);
    return;
  }

  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
}

function printFailure(error: unknown, jsonRequested: boolean): void {
  const isJson = jsonRequested || process.argv.includes("--json");
  if (isJson) {
    const response = asErrorResponse(error);
    // Handle Commander errors specifically
    if (error && typeof error === "object" && "code" in error && String(error.code).startsWith("commander.")) {
        process.stderr.write(`${JSON.stringify({
            error: {
                code: "cli_usage_error",
                message: (error as any).message
            }
        })}\n`);
        return;
    }
    // Handle generic errors not already formatted by asErrorResponse
    if (error instanceof Error && !("error" in response)) {
        process.stderr.write(`${JSON.stringify({
            error: {
                code: "cli_usage_error",
                message: error.message
            }
        })}\n`);
        return;
    }
    process.stderr.write(`${JSON.stringify(response)}\n`);
    return;
  }

  if (error instanceof CliApiError) {
    process.stderr.write(`${error.message}\n`);
    return;
  }

  process.stderr.write(`${error instanceof Error ? error.message : "unexpected cli error"}\n`);
}

const program = new Command();

program
  .name("kanban")
  .description("CLI for agent-kanban")
  .version("0.0.0")
  .exitOverride();

program.showHelpAfterError(false);

function isJsonRequested(): boolean {
    return process.argv.includes("--json");
}

process.on("uncaughtException", (error) => {
    printFailure(error, isJsonRequested());
    process.exit(1);
});

program
  .option("--api-url <url>", "API URL")
  .option("--actor <id>", "Actor ID")
  .option("--json", "Output in JSON format", false)
  .option("--dry-run", "Validate arguments and state but skip the final API call", false);

async function getContext(): Promise<CommandContext> {
  const options = program.opts();
  const localConfig = await loadLocalConfig();

  const env: CommandEnvironment = {
    apiUrl: options.apiUrl ?? process.env.KANBAN_API_URL ?? localConfig.apiUrl,
    actorId: options.actor ?? process.env.KANBAN_ACTOR_ID ?? localConfig.actorId,
    projectId: localConfig.projectId,
  };
  const client = new ApiClient(env.apiUrl || defaultApiUrl);

  return { env, client };
}

async function executeCommand(handler: (options: any, context: CommandContext) => Promise<unknown>, cmdOptions: any) {
  const context = await getContext();
  const globalOptions = program.opts();
  const options = { ...globalOptions, ...cmdOptions };

  try {
    if (options.dryRun) {
        printSuccess({ dryRun: true, message: "Dry run successful. Arguments validated." }, options.json);
        return;
    }

    const result = await handler(options, context);
    if (result === null) {
      throw new Error("Command returned null");
    }
    printSuccess(result, options.json);
  } catch (error) {
    printFailure(error, options.json);
    process.exit(1);
  }
}

program
  .command("config")
  .description("Display current configuration")
  .action(async (options) => {
    await executeCommand(runConfigCommand, options);
  });

program
  .command("discovery")
  .description("Output machine-readable command metadata")
  .action(() => {
    const discovery = {
        name: program.name(),
        description: program.description(),
        version: program.version(),
        commands: program.commands.map(cmd => ({
            name: cmd.name(),
            description: cmd.description(),
            options: cmd.options.map(opt => ({
                flags: opt.flags,
                description: opt.description,
                required: opt.required
            })),
            commands: cmd.commands.map(sub => ({
                name: sub.name(),
                description: sub.description(),
                options: sub.options.map(opt => ({
                    flags: opt.flags,
                    description: opt.description,
                    required: opt.required
                }))
            }))
        }))
    };
    printSuccess(discovery, true);
  });

const projects = program.command("projects").description("Project management");

projects
  .command("list")
  .description("List projects")
  .action(async (options) => {
    await executeCommand(runProjectsListCommand, options);
  });

projects
  .command("create")
  .description("Create a project")
  .option("--repo-url <url>", "Git repository URL")
  .option("--name <name>", "Project name (inferred from repo-url if omitted)")
  .option("--description <text>", "Project description")
  .option("--policy-file <path>", "Path to project policy JSON file")
  .action(async (options) => {
    await executeCommand(runProjectsCreateCommand, options);
  });

const collaborators = program.command("collaborators").description("Collaborator management");

collaborators
  .command("list")
  .description("List collaborators")
  .action(async (options) => {
    await executeCommand(runCollaboratorsListCommand, options);
  });

const cards = program.command("cards").description("Card management");

cards
  .command("list")
  .description("List cards")
  .option("--project <id>", "Project ID (inferred from git origin if omitted)")
  .option("--state <new|ready|in-progress|in-review|done>", "Filter by state")
  .option("--assigned-to <id|me>", "Filter by assigned owner")
  .action(async (options) => {
    await executeCommand(runListCommand, options);
  });

cards
  .command("show")
  .description("Show card details")
  .requiredOption("--id <card-id>", "Card ID")
  .action(async (options) => {
    await executeCommand(runShowCommand, options);
  });

cards
  .command("create")
  .description("Create a card")
  .option("--project <id>", "Project ID (inferred from git origin if omitted)")
  .requiredOption("--title <title>", "Card title")
  .option("--description-file <path>", "Path to markdown file for description")
  .option("--priority <n>", "Card priority")
  .action(async (options) => {
    await executeCommand(runCreateCommand, options);
  });

cards
  .command("assign-owner")
  .description("Assign owner to a card")
  .requiredOption("--id <card-id>", "Card ID")
  .requiredOption("--to <owner-id|none>", "Owner ID or 'none'")
  .action(async (options) => {
    await executeCommand(runAssignOwnerCommand, options);
  });

cards
  .command("set-state")
  .description("Set card state")
  .requiredOption("--id <card-id>", "Card ID")
  .requiredOption("--to <new|ready|in-progress|done>", "Target state")
  .option("--owner <owner-id>", "Set owner during state transition")
  .option("--actor <id>", "Actor ID (overrides default)")
  .option("--revision <n>", "Current card revision (fetched if omitted)")
  .action(async (options) => {
    await executeCommand(runSetStateCommand, options);
  });

cards
  .command("update")
  .description("Update card content")
  .requiredOption("--id <card-id>", "Card ID")
  .requiredOption("--file <path>", "Path to markdown file")
  .requiredOption("--revision <n>", "Current card revision")
  .action(async (options) => {
    await executeCommand(runUpdateCardCommand, options);
  });

cards
  .command("append-summary")
  .description("Append or replace summary on a card")
  .requiredOption("--id <card-id>", "Card ID")
  .requiredOption("--file <path>", "Path to markdown file")
  .option("--replace", "Replace entire Final Summary instead of appending")
  .action(async (options) => {
    await executeCommand(runAppendSummaryCommand, options);
  });

cards
  .command("comment")
  .description("Add a comment to a card")
  .requiredOption("--id <card-id>", "Card ID")
  .requiredOption("--body <text>", "Comment body")
  .requiredOption("--kind <progress|question|decision|note|verification>", "Comment kind")
  .option("--author <id>", "Author ID")
  .action(async (options) => {
    await executeCommand(runCommentCommand, options);
  });

try {
  await program.parseAsync(process.argv);
} catch (error: any) {
  if (error.code === "commander.helpDisplayed" || error.code === "commander.version") {
    process.exit(0);
  }
  const options = program.opts();
  printFailure(error, options.json);
  process.exit(1);
}
