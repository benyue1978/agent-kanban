#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import process from "node:process";

const defaultDatabaseUrl =
  process.env.DATABASE_URL ??
  "postgresql://agent_kanban:agent_kanban@localhost:5433/agent_kanban";

function runStep(label, command, args, options = {}) {
  console.log(`\n[verify] ${label}`);
  const result = spawnSync(command, args, {
    stdio: "inherit",
    shell: false,
    ...options,
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

function getComposePsOutput() {
  const result = spawnSync("docker", ["compose", "ps", "postgres", "--format", "json"], {
    encoding: "utf8",
    shell: false,
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }

  return result.stdout.trim();
}

runStep("tooling", "node", ["scripts/check-tooling.mjs"]);
const composePs = getComposePsOutput();

if (composePs.length === 0 || !composePs.toLowerCase().includes("\"state\":\"running\"")) {
  console.error("\n[verify] postgres container is not running");
  process.exit(1);
}

console.log("\n[verify] postgres container");
console.log(composePs);
runStep("postgres connection", "psql", [defaultDatabaseUrl, "-c", "select 1"]);
runStep("prisma migrations", "pnpm", ["--filter", "@agent-kanban/api", "prisma", "migrate", "deploy"]);
runStep("shared package tests", "pnpm", ["--filter", "@agent-kanban/card-markdown", "test"]);
runStep("shared package tests", "pnpm", ["--filter", "@agent-kanban/contracts", "test"]);
runStep("shared package tests", "pnpm", ["--filter", "@agent-kanban/domain", "test"]);
runStep("api integration tests", "pnpm", ["--filter", "@agent-kanban/api", "test"]);
runStep("cli tests", "pnpm", ["--filter", "@agent-kanban/cli", "test"]);
runStep("web smoke tests", "pnpm", [
  "--filter",
  "@agent-kanban/web",
  "exec",
  "playwright",
  "test",
  "--grep",
  "board and card detail|human can review",
]);

console.log("\n[verify] vertical slice verification passed");
