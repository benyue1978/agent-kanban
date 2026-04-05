#!/usr/bin/env node
import { spawnSync } from "node:child_process";

const STACKS = {
  prod: {
    envFile: ".env",
    composeProjectName: "agent-kanban-prod",
  },
  dev: {
    envFile: ".env.dev",
    composeProjectName: "agent-kanban-dev",
  },
};

export function resolveComposeStack(name) {
  const stack = STACKS[name];

  if (stack === undefined) {
    throw new Error(`unknown compose stack: ${name}`);
  }

  return {
    ...stack,
    composeArgs: (...args) => [
      "--env-file",
      stack.envFile,
      "--project-name",
      stack.composeProjectName,
      ...args,
    ],
  };
}

function main() {
  const [stackName, ...args] = process.argv.slice(2);

  if (stackName === undefined || args.length === 0) {
    process.stderr.write(
      "usage: node scripts/compose-stack.mjs <prod|dev> <docker-compose-args...>\n"
    );
    process.exit(1);
  }

  const stack = resolveComposeStack(stackName);
  const result = spawnSync("docker", ["compose", ...stack.composeArgs(...args)], {
    stdio: "inherit",
    shell: false,
  });

  process.exit(result.status ?? 1);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
