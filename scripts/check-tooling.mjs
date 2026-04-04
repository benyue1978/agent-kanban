#!/usr/bin/env node
import { spawnSync } from "node:child_process";

const nodeMajor = Number.parseInt(process.versions.node.split(".")[0] ?? "", 10);
const pnpmVersion = spawnSync("pnpm", ["-v"], { encoding: "utf8" });
const pnpmVersionText = (pnpmVersion.stdout || pnpmVersion.stderr || "").trim();
const pnpmMajor = Number.parseInt(pnpmVersionText.split(".")[0] ?? "", 10);
const composeMinMajor = 2;

let failed = false;

function fail(message) {
  failed = true;
  console.error(message);
}

if (nodeMajor !== 24) {
  fail(`unsupported:node:${process.versions.node}`);
} else {
  console.log(`node: ${process.versions.node}`);
}

if (pnpmVersion.status !== 0 || pnpmVersion.error) {
  fail("missing:pnpm");
} else if (pnpmMajor !== 10) {
  fail(`unsupported:pnpm:${pnpmVersionText}`);
} else {
  console.log(`pnpm: ${pnpmVersionText}`);
}

const checks = [
  ["docker", ["--version"]],
  ["psql", ["--version"]],
];

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

const composeResult = spawnSync("docker", ["compose", "version"], { encoding: "utf8" });
const composeText = (composeResult.stdout || composeResult.stderr || "").trim();

if (composeResult.status !== 0 || composeResult.error) {
  failed = true;
  console.error("missing:docker-compose");
} else {
  const composeMajorMatch = composeText.match(/v?(\d+)\./);
  const composeMajor = composeMajorMatch ? Number.parseInt(composeMajorMatch[1], 10) : Number.NaN;

  if (!Number.isFinite(composeMajor) || composeMajor < composeMinMajor) {
    failed = true;
    console.error(`unsupported:docker-compose:${composeText}`);
  } else {
    console.log(`docker compose: ${composeText}`);
  }
}

process.exit(failed ? 1 : 0);
