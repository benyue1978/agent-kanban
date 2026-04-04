import { execSync, spawnSync } from "node:child_process";
import { promises as fs } from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath, pathToFileURL } from "node:url";

const historicalMarkerPrefix = "> Historical note:";
const bootstrapActorId = "bootstrap-import";
const bootstrapMarkdownPath = "bootstrap/initial-cards.md";

interface PrismaLike {
  collaborator: {
    upsert(args: Record<string, unknown>): Promise<unknown>;
  };
  project: {
    findFirst(args: Record<string, unknown>): Promise<{ id: string } | null>;
  };
  card: {
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

export interface SeedCard {
  index: number;
  source: string;
  title: string;
  descriptionMd: string;
}

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

function formatLocalDate(value: Date): string {
  const year = value.getFullYear();
  const month = `${value.getMonth() + 1}`.padStart(2, "0");
  const day = `${value.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function slugToHeadingBlock(body: string, label: string): string {
  return body
    .trim()
    .split(/\n+/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .join("\n");
}

function toDescriptionMarkdown(input: {
  cardNumber: number;
  goal: string;
  title: string;
  definitionOfDone: string[];
  source: string;
}): string {
  const dodLines = input.definitionOfDone.map((item) => `- [ ] ${item}`);

  return [
    `# ${input.title}`,
    "",
    "## Goal",
    slugToHeadingBlock(input.goal, "Goal"),
    "",
    "## Scope",
    `Historical bootstrap seed imported from ${input.source}. The original seed doc did not define a separate Scope section, so this card preserves that source context here.`,
    "",
    "## Definition of Done",
    ...dodLines,
    "",
    "## Historical Context",
    `- Imported from ${input.source}`,
    `- Seed card number: ${input.cardNumber}`,
    "- Source document retained as historical reference only",
  ].join("\n");
}

export async function parseSeedCards(markdownPath: string): Promise<SeedCard[]> {
  const markdown = (await fs.readFile(toAbsolutePath(markdownPath), "utf8")).replaceAll(
    "\r\n",
    "\n"
  );
  const normalized = `${markdown}\n## Card END: Sentinel\n`;
  const matches = Array.from(
    normalized.matchAll(/^## Card (\d+): (.+)\n([\s\S]*?)(?=^## Card (?:\d+|END): )/gm)
  );

  return matches.map((match) => {
    const index = Number.parseInt(match[1] ?? "", 10);
    const title = (match[2] ?? "").trim();
    const body = match[3] ?? "";
    const goalMatch = body.match(/^### Goal\n([\s\S]*?)(?=^### |\s*$)/m);
    const dodMatch = body.match(/^### Definition of Done\n([\s\S]*?)(?=^### |\s*$)/m);
    const definitionOfDone = (dodMatch?.[1] ?? "")
      .split("\n")
      .map((line) => line.replace(/^- /, "").trim())
      .filter((line) => line.length > 0);

    return {
      index,
      source: `${markdownPath}#card-${index}`,
      title,
      descriptionMd: toDescriptionMarkdown({
        cardNumber: index,
        goal: goalMatch?.[1]?.trim() ?? title,
        title,
        definitionOfDone,
        source: `${markdownPath}#card-${index}`,
      }),
    };
  });
}

async function ensureBootstrapActor(createPrismaClient: () => PrismaLike): Promise<void> {
  const prisma = createPrismaClient();

  await prisma.collaborator.upsert({
    where: { id: bootstrapActorId },
    update: {
      displayName: "Bootstrap Import",
      kind: "agent",
    },
    create: {
      id: bootstrapActorId,
      displayName: "Bootstrap Import",
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
    where: {
      repoUrl,
    },
    select: {
      id: true,
    },
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
      description: "Bootstrap backfill project",
    },
  });

  if (response.statusCode !== 201) {
    throw new Error(`failed to create project: ${response.statusCode} ${response.body}`);
  }

  return response.json().project.id as string;
}

async function importCards(
  app: InjectApp,
  cards: SeedCard[],
  createPrismaClient: () => PrismaLike
): Promise<number> {
  const prisma = createPrismaClient();
  const projectId = await ensureProject(app, createPrismaClient);
  let importedCount = 0;

  for (const card of cards) {
    const existing = await prisma.card.findFirst({
      where: {
        projectId,
        descriptionMd: {
          contains: `- Imported from ${card.source}`,
        },
      },
      select: { id: true },
    });

    if (existing !== null) {
      continue;
    }

    const response = await app.inject({
      method: "POST",
      url: "/cards",
      payload: {
        actorId: bootstrapActorId,
        projectId,
        title: card.title,
        descriptionMd: card.descriptionMd,
      },
    });

    if (response.statusCode !== 201) {
      await prisma.$disconnect();
      throw new Error(`failed to import "${card.title}": ${response.statusCode} ${response.body}`);
    }

    importedCount += 1;
  }

  await prisma.$disconnect();
  return importedCount;
}

async function markBootstrapSourceHistorical(markdownPath: string): Promise<void> {
  const absolutePath = toAbsolutePath(markdownPath);
  const current = await fs.readFile(absolutePath, "utf8");

  if (current.includes(historicalMarkerPrefix)) {
    return;
  }

  const today = formatLocalDate(new Date());
  const updated = current.replace(
    "# Initial Cards for MVP Backfill",
    `# Initial Cards for MVP Backfill\n\n${historicalMarkerPrefix} Backfilled into the running system on ${today}. This file remains historical seed input only.`
  );

  await fs.writeFile(absolutePath, updated, "utf8");
}

export async function backfillInitialCards(markdownPath = bootstrapMarkdownPath): Promise<{
  importedCount: number;
  parsedCount: number;
}> {
  const { buildApp, createPrismaClient } = await loadApiRuntime();
  await ensureBootstrapActor(createPrismaClient);
  const app = await buildApp();
  const cards = await parseSeedCards(markdownPath);
  const importedCount = await importCards(app, cards, createPrismaClient);

  await app.close();
  await markBootstrapSourceHistorical(markdownPath);

  return {
    importedCount,
    parsedCount: cards.length,
  };
}

async function main(): Promise<void> {
  const result = await backfillInitialCards();
  console.log(
    `bootstrap import complete: imported ${result.importedCount} of ${result.parsedCount} seed cards`
  );
}

if (process.argv[1] !== undefined && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await main();
}
