#!/usr/bin/env node
import { spawnSync } from "node:child_process";

const checks = [
  ["node", ["-v"]],
  ["pnpm", ["-v"]],
  ["docker", ["--version"]],
  ["psql", ["--version"]],
];

let failed = false;

for (const [command, args] of checks) {
  const result = spawnSync(command, args, { encoding: "utf8" });

  if (result.status !== 0 || result.error) {
    failed = true;
    console.error(`missing:${command}`);
    continue;
  }

  const output = (result.stdout || result.stderr || "").trim();
  console.log(`${command}: ${output}`);
}

process.exit(failed ? 1 : 0);
