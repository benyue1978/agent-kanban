import { execSync, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath, pathToFileURL } from "node:url";

interface PrismaLike {
  collaborator: {
    upsert(args: Record<string, unknown>): Promise<unknown>;
  };
  project: {
    findFirst(args: Record<string, unknown>): Promise<{ id: string } | null>;
  };
  $disconnect(): Promise<void>;
}

interface InjectApp {
  inject(input: {
    method: string;
    url: string;
    payload?: Record<string, unknown>;
  }): Promise<{
    body: string;
    json(): Record<string, any>;
    statusCode: number;
  }>;
  close(): Promise<void>;
}

export interface ParsedPlanTask {
  title: string;
  descriptionMd: string;
  sourcePlanPath: string;
  sourceSpecPath: string | null;
  sourceTaskId: string;
  sourceTaskFingerprint: string;
  priority: number | null;
}

const importerActorId = "plan-import";
const defaultPlanPath = "docs/superpowers/plans/2026-04-04-local-first-mvp-vertical-slice.md";

function getRepoRoot(): string {
  return path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
}

function toAbsolutePath(relativePath: string): string {
  return path.resolve(getRepoRoot(), relativePath);
}

function normalizeRemoteUrl(remoteUrl: string): string {
  if (remoteUrl.startsWith("git@github.com:")) {
    return `https://github.com/${remoteUrl.slice("git@github.com:".length).replace(/\.git$/, "")}.git`;
  }

  return remoteUrl;
}

function getRepoUrl(): string {
  try {
    const remote = execSync("git remote get-url origin", {
      cwd: getRepoRoot(),
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();

    return normalizeRemoteUrl(remote);
  } catch {
    return "https://example.com/repo.git";
  }
}

function run(command: string, args: string[]): void {
  const result = spawnSync(command, args, {
    cwd: getRepoRoot(),
    stdio: "inherit",
    shell: false,
  });

  if (result.status !== 0) {
    throw new Error(`command failed: ${command} ${args.join(" ")}`);
  }
}

async function loadApiRuntime(): Promise<{
  buildApp: () => Promise<InjectApp>;
  createPrismaClient: () => PrismaLike;
}> {
  run("pnpm", ["--filter", "@agent-kanban/contracts", "build"]);
  run("pnpm", ["--filter", "@agent-kanban/card-markdown", "build"]);
  run("pnpm", ["--filter", "@agent-kanban/domain", "build"]);
  run("pnpm", ["--filter", "@agent-kanban/api", "build"]);

  const appModule = (await import(
    pathToFileURL(toAbsolutePath("apps/api/dist/src/app.js")).href
  )) as { buildApp: () => Promise<InjectApp> };
  const prismaModule = (await import(
    pathToFileURL(toAbsolutePath("apps/api/dist/src/lib/prisma.js")).href
  )) as { createPrismaClient: () => PrismaLike };

  return {
    buildApp: appModule.buildApp,
    createPrismaClient: prismaModule.createPrismaClient,
  };
}

function extractTaskScope(block: string): string {
  const lines = block
    .split("\n")
    .map((line) => line.trimEnd())
    .filter((line) => !/^- \[ \] \*\*Step /.test(line))
    .filter((line) => line.trim() !== "");

  const scopedLines = lines.filter((line) => !/^### Task \d+:/.test(line));
  return scopedLines.length === 0
    ? "Follow the linked plan task and complete the implementation safely."
    : scopedLines.join("\n");
}

function extractStepTitles(block: string): string[] {
  return Array.from(block.matchAll(/^- \[ \] \*\*Step \d+: (.+?)\*\*/gm), (match) =>
    match[1]?.trim()
  ).filter((title): title is string => title !== undefined && title.length > 0);
}

function inferPriority(taskNumber: number): number | null {
  return taskNumber <= 3 ? 1 : taskNumber <= 7 ? 2 : 3;
}

function buildTaskMarkdown(input: {
  title: string;
  sourceTaskId: string;
  sourcePlanPath: string;
  sourceSpecPath: string | null;
  scope: string;
  steps: string[];
}): string {
  const definitionOfDone =
    input.steps.length === 0
      ? "- [ ] Complete the approved implementation task safely."
      : input.steps.map((step) => `- [ ] ${step}`).join("\n");

  const contextLines = [
    `- Imported from approved task \`${input.sourceTaskId}\``,
    `- Plan: \`${input.sourcePlanPath}\``,
    `- Spec: \`${input.sourceSpecPath ?? "not linked"}\``,
  ].join("\n");

  return [
    `# ${input.title}`,
    "",
    "## Goal",
    `Implement the approved plan task: ${input.title}.`,
    "",
    "## Context",
    contextLines,
    "",
    "## Scope",
    input.scope,
    "",
    "## Definition of Done",
    definitionOfDone,
    "",
    "## Constraints",
    "- Use the linked plan and spec as the planning source of truth.",
    "- Record progress, decisions, and verification evidence on the card timeline.",
    "- Keep the final summary up to date before marking the card Done.",
  ].join("\n");
}

function fingerprintTask(input: {
  title: string;
  scope: string;
  steps: string[];
  sourcePlanPath: string;
  sourceSpecPath: string | null;
  sourceTaskId: string;
}): string {
  return createHash("sha1")
    .update(JSON.stringify(input))
    .digest("hex");
}

export async function parsePlanTasks(input: {
  planPath: string;
  specPath?: string | null;
}): Promise<ParsedPlanTask[]> {
  const markdown = (await fs.readFile(toAbsolutePath(input.planPath), "utf8")).replaceAll(
    "\r\n",
    "\n"
  );
  const normalized = `${markdown}\n### Task END: Sentinel\n`;
  const matches = Array.from(
    normalized.matchAll(/^### Task (\d+): (.+)\n([\s\S]*?)(?=^### Task (?:\d+|END): )/gm)
  );

  return matches.map((match) => {
    const taskNumber = Number.parseInt(match[1] ?? "", 10);
    const title = (match[2] ?? "").trim();
    const block = (match[3] ?? "").trim();
    const sourceTaskId = `${input.planPath}#task-${taskNumber}`;
    const steps = extractStepTitles(block);
    const scope = extractTaskScope(block);
    const sourceSpecPath = input.specPath ?? null;

    return {
      title,
      descriptionMd: buildTaskMarkdown({
        title,
        sourceTaskId,
        sourcePlanPath: input.planPath,
        sourceSpecPath,
        scope,
        steps,
      }),
      sourcePlanPath: input.planPath,
      sourceSpecPath,
      sourceTaskId,
      sourceTaskFingerprint: fingerprintTask({
        title,
        scope,
        steps,
        sourcePlanPath: input.planPath,
        sourceSpecPath,
        sourceTaskId,
      }),
      priority: inferPriority(taskNumber),
    };
  });
}

async function ensureImporterActor(createPrismaClient: () => PrismaLike): Promise<void> {
  const prisma = createPrismaClient();

  await prisma.collaborator.upsert({
    where: { id: importerActorId },
    update: {
      displayName: "Plan Import",
      kind: "agent",
    },
    create: {
      id: importerActorId,
      displayName: "Plan Import",
      kind: "agent",
    },
  });

  await prisma.$disconnect();
}

async function ensureProject(
  app: InjectApp,
  createPrismaClient: () => PrismaLike
): Promise<string> {
  const prisma = createPrismaClient();
  const repoUrl = getRepoUrl();
  const existing = await prisma.project.findFirst({
    where: { repoUrl },
    select: { id: true },
  });

  await prisma.$disconnect();

  if (existing !== null) {
    return existing.id;
  }

  const response = await app.inject({
    method: "POST",
    url: "/projects",
    payload: {
      name: "agent-kanban",
      repoUrl,
      description: "Plan-import project",
    },
  });

  if (response.statusCode !== 201) {
    throw new Error(`failed to create project: ${response.statusCode} ${response.body}`);
  }

  return response.json().project.id as string;
}

function parseArgs(argv: string[]): {
  planPath: string;
  specPath: string | null;
} {
  const args = [...argv];
  let planPath = defaultPlanPath;
  let specPath: string | null = null;

  while (args.length > 0) {
    const current = args.shift();

    if (current === "--plan" && args[0] !== undefined) {
      planPath = args.shift() as string;
      continue;
    }

    if (current === "--spec" && args[0] !== undefined) {
      specPath = args.shift() as string;
    }
  }

  return { planPath, specPath };
}

export async function importPlanTasks(input?: {
  planPath?: string;
  specPath?: string | null;
}): Promise<{
  parsedCount: number;
  results: Array<{
    cardId: string;
    outcome: "created" | "updated" | "unchanged" | "protected";
    sourceTaskId: string;
    state: string;
  }>;
}> {
  const planPath = input?.planPath ?? defaultPlanPath;
  const specPath = input?.specPath ?? null;
  const { buildApp, createPrismaClient } = await loadApiRuntime();
  await ensureImporterActor(createPrismaClient);
  const app = await buildApp();
  const projectId = await ensureProject(app, createPrismaClient);
  const tasks = await parsePlanTasks({ planPath, specPath });

  const response = await app.inject({
    method: "POST",
    url: `/projects/${projectId}/import-plan`,
    payload: {
      actorId: importerActorId,
      tasks,
    },
  });

  await app.close();

  if (response.statusCode !== 200) {
    throw new Error(`failed to import plan tasks: ${response.statusCode} ${response.body}`);
  }

  return {
    parsedCount: tasks.length,
    results: response.json().results as Array<{
      cardId: string;
      outcome: "created" | "updated" | "unchanged" | "protected";
      sourceTaskId: string;
      state: string;
    }>,
  };
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  const result = await importPlanTasks(args);
  console.log(
    `plan import complete: imported ${result.results.length} tasks from ${args.planPath}`
  );
  for (const entry of result.results) {
    console.log(`${entry.outcome}: ${entry.sourceTaskId} -> ${entry.cardId} (${entry.state})`);
  }
}

if (process.argv[1] !== undefined && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await main();
}
