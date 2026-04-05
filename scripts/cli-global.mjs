#!/usr/bin/env node
import { spawnSync } from "node:child_process";

export function resolveCliGlobalCommands(action) {
  if (action === "install") {
    return [
      {
        command: "pnpm",
        args: ["--filter", "@agent-kanban/cli", "build"],
      },
      {
        command: "pnpm",
        args: ["link", "--global", "./apps/cli"],
      },
    ];
  }

  if (action === "uninstall") {
    return [
      {
        command: "pnpm",
        args: ["remove", "-g", "@agent-kanban/cli"],
      },
      {
        command: "pnpm",
        args: ["remove", "-g", "agent-kanban"],
        allowFailure: true,
      },
    ];
  }

  throw new Error(`unknown cli global action: ${action}`);
}

function main() {
  const action = process.argv[2];

  if (action !== "install" && action !== "uninstall") {
    process.stderr.write("usage: node scripts/cli-global.mjs <install|uninstall>\n");
    process.exit(1);
  }

  for (const step of resolveCliGlobalCommands(action)) {
    const result = spawnSync(step.command, step.args, {
      stdio: "inherit",
      shell: false,
    });

    if (result.status !== 0 && step.allowFailure !== true) {
      process.exit(result.status ?? 1);
    }
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
