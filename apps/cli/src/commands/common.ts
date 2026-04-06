import { readFile } from "node:fs/promises";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { CardState, defaultProjectPolicy, type ProjectPolicy } from "@agent-kanban/contracts";
import type { ApiClient } from "../client.js";

const execFileAsync = promisify(execFile);

export interface CommandEnvironment {
  actorId?: string | undefined;
  apiUrl?: string | undefined;
  projectId?: string | undefined;
}

export interface CommandContext {
  client: ApiClient;
  env: CommandEnvironment;
}

export async function loadLocalConfig(): Promise<Partial<CommandEnvironment>> {
  try {
    const raw = await readFile(".kanban.json", "utf8");
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

export async function resolveProjectId(
  options: Record<string, any>,
  env: CommandEnvironment,
  client: ApiClient
): Promise<string> {
  const explicitProjectId = options.project ?? env.projectId;

  if (typeof explicitProjectId === "string" && explicitProjectId.length > 0) {
    return explicitProjectId;
  }

  const gitOriginUrl = await getGitOriginUrl();

  if (gitOriginUrl === undefined) {
    fail("missing project id; pass --project or run `kanban projects list`");
  }

  const normalizedOrigin = normalizeRepoUrl(gitOriginUrl);
  const { projects } = await client.listProjects();
  const matches = projects.filter((project) => normalizeRepoUrl(project.repoUrl) === normalizedOrigin);
  const singleMatch = matches[0];

  if (matches.length === 1 && singleMatch !== undefined) {
    return singleMatch.id;
  }

  if (matches.length > 1) {
    fail("multiple projects match the current repo; pass --project or run `kanban projects list`");
  }

  fail("could not infer project from git origin; pass --project or run `kanban projects list`");
}

export async function getCurrentRepoUrl(): Promise<string | undefined> {
  return await getGitOriginUrl();
}

export function inferProjectNameFromRepoUrl(repoUrl: string): string {
  const normalized = repoUrl.trim().replace(/\.git$/i, "").replace(/\/+$/, "");
  const parts = normalized.split(/[/:]/);
  const value = parts.at(-1);

  if (value === undefined || value.length === 0) {
    fail(`could not infer project name from repo url: ${repoUrl}`);
  }

  return value;
}

export function resolveActorId(
  options: Record<string, any>,
  env: CommandEnvironment,
  flagName = "actor"
): string | undefined {
  const value = options[flagName];
  return (typeof value === "string" && value.length > 0) ? value : env.actorId;
}

export async function readTextFile(path: string): Promise<string> {
  if (path === "-") {
    const chunks: Buffer[] = [];
    for await (const chunk of process.stdin) {
      chunks.push(chunk as Buffer);
    }
    return Buffer.concat(chunks).toString("utf8");
  }
  return await readFile(path, "utf8");
}

export async function readProjectPolicyFile(path: string | undefined): Promise<ProjectPolicy> {
  if (path === undefined) {
    return defaultProjectPolicy;
  }

  const raw = await readTextFile(path);

  try {
    return JSON.parse(raw) as ProjectPolicy;
  } catch {
    fail(`invalid project policy JSON in ${path}`);
  }
}

const stateSlugMap = {
  done: CardState.Done,
  "in-progress": CardState.InProgress,
  new: CardState.New,
  ready: CardState.Ready,
} as const;

export function getOptionalCardStateValue(
  options: Record<string, any>,
  name: string
): string | undefined {
  const value = options[name];

  if (typeof value !== "string" || value.length === 0) {
    return undefined;
  }

  return stateSlugMap[value as keyof typeof stateSlugMap] ?? fail(`unsupported state: ${value}`);
}

export function requireCardStateValue(
  options: Record<string, any>,
  name: string
): string {
  const value = options[name];
  if (typeof value !== "string" || value.length === 0) {
    fail(`missing required flag --${name}`);
  }
  return stateSlugMap[value as keyof typeof stateSlugMap] ?? fail(`unsupported state: ${value}`);
}

async function getGitOriginUrl(): Promise<string | undefined> {
  try {
    const { stdout } = await execFileAsync("git", ["remote", "get-url", "origin"], {
      cwd: process.cwd(),
    });
    const value = stdout.trim();
    return value.length > 0 ? value : undefined;
  } catch {
    return undefined;
  }
}

function normalizeRepoUrl(input: string): string {
  const trimmed = input.trim().replace(/\.git$/i, "");
  const scpMatch = trimmed.match(/^(?<user>[^@]+)@(?<host>[^:]+):(?<path>.+)$/);

  if (scpMatch?.groups !== undefined) {
    return `${scpMatch.groups.host}/${scpMatch.groups.path}`.toLowerCase();
  }

  const withoutProtocol = trimmed.replace(/^[a-z]+:\/\//i, "").replace(/^[^@]+@/, "");
  return withoutProtocol.replace(/\/+$/, "").toLowerCase();
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
