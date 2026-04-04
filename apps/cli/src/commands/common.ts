import { readFile } from "node:fs/promises";
import { parseArgs } from "node:util";
import type { ApiClient } from "../client.js";

export interface CommandEnvironment {
  actorId?: string;
  apiUrl?: string;
  projectId?: string;
}

export interface CommandContext {
  args: string[];
  client: ApiClient;
  env: CommandEnvironment;
}

export function parseCommandArgs(
  args: string[],
  options: Record<string, { type: "boolean" | "string" }>
) {
  return parseArgs({
    args,
    allowPositionals: false,
    strict: true,
    options,
  });
}

export function requireStringFlag(
  values: Record<string, string | boolean | undefined>,
  name: string
): string {
  const value = values[name];

  if (typeof value !== "string" || value.length === 0) {
    throw new Error(`missing required flag --${name}`);
  }

  return value;
}

export function getOptionalStringFlag(
  values: Record<string, string | boolean | undefined>,
  name: string
): string | undefined {
  const value = values[name];
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

export function getOptionalBooleanFlag(
  values: Record<string, string | boolean | undefined>,
  name: string
): boolean {
  return values[name] === true;
}

export function resolveProjectId(
  values: Record<string, string | boolean | undefined>,
  env: CommandEnvironment
): string {
  return getOptionalStringFlag(values, "project") ?? env.projectId ?? fail("missing project id");
}

export function resolveActorId(
  values: Record<string, string | boolean | undefined>,
  env: CommandEnvironment,
  flagName = "actor"
): string | undefined {
  return getOptionalStringFlag(values, flagName) ?? env.actorId;
}

export async function readTextFile(path: string): Promise<string> {
  return await readFile(path, "utf8");
}

export function defaultCardDescription(title: string): string {
  return `# ${title}

## Goal
TBD

## Scope
TBD

## Definition of Done
- [ ] implementation complete
- [ ] tests added`;
}

export function fail(message: string): never {
  throw new Error(message);
}
