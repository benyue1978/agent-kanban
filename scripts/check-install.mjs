#!/usr/bin/env node
import { access } from "node:fs/promises";
import { constants } from "node:fs";

const requiredPaths = [
  new URL("../node_modules/.pnpm/", import.meta.url),
  new URL("../apps/cli/node_modules/", import.meta.url),
];

try {
  await Promise.all(requiredPaths.map((path) => access(path, constants.F_OK)));
} catch {
  console.error("missing:install");
  console.error("run: pnpm install");
  process.exit(1);
}
