#!/usr/bin/env node
import { spawnSync } from "node:child_process";

const rawArgs = process.argv.slice(2);
const args = rawArgs[0] === "--" ? rawArgs.slice(1) : rawArgs;

// --- SAFETY GUARD ---
const databaseUrl = process.env.DATABASE_URL ?? "";
if (databaseUrl.includes(":5433") || (databaseUrl.includes("/agent_kanban") && !databaseUrl.includes("/agent_kanban_dev"))) {
  process.stderr.write(
    `CRITICAL SAFETY VIOLATION: DATABASE_URL points to a production-like environment: ${databaseUrl}\n` +
    `Aborting test run to protect production data.\n`
  );
  process.exit(1);
}
// --------------------

function run(command, commandArgs) {
  const result = spawnSync(command, commandArgs, {
    stdio: "inherit",
    shell: false,
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

if (args.length > 0) {
  if (args[0] === "--run" && args[1] === "bootstrap-importer") {
    run("pnpm", ["exec", "vitest", "run", "scripts/tests/bootstrap-importer.test.ts"]);
  } else if (args[0] === "--run" && args[1] === "plan-importer") {
    run("pnpm", ["exec", "vitest", "run", "scripts/tests/plan-importer.test.ts"]);
  } else {
    run("pnpm", ["exec", "vitest", "run", ...args, "scripts/tests"]);
  }
} else {
  run("pnpm", ["-r", "test"]);
  run("pnpm", ["exec", "vitest", "run", "scripts/tests"]);
}
