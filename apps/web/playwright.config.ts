import { defineConfig } from "@playwright/test";
import path from "node:path";
import { fileURLToPath } from "node:url";

const apiPort = process.env.PLAYWRIGHT_API_PORT ?? "3101";
const webPort = process.env.PLAYWRIGHT_WEB_PORT ?? "3100";
const configDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(configDir, "../..");
const apiCwd = path.join(repoRoot, "apps/api");
const webCwd = path.join(repoRoot, "apps/web");

export default defineConfig({
  workers: 1,
  testDir: "./tests",
  use: {
    baseURL: `http://127.0.0.1:${webPort}`,
  },
  webServer: [
    {
      command: "pnpm --filter @agent-kanban/api prisma migrate deploy && pnpm --filter @agent-kanban/api dev",
      cwd: repoRoot,
      env: {
        DATABASE_URL:
          "postgresql://agent_kanban:agent_kanban@localhost:5434/agent_kanban_dev?schema=public",
        PORT: apiPort,
      },
      port: Number(apiPort),
      reuseExistingServer: false,
      timeout: 120000,
    },
    {
      command: "pnpm dev",
      cwd: webCwd,
      env: {
        KANBAN_API_URL: `http://127.0.0.1:${apiPort}`,
        KANBAN_HUMAN_ACTOR_ID: "human-reviewer",
        PORT: webPort,
      },
      port: Number(webPort),
      reuseExistingServer: false,
      timeout: 120000,
    },
  ],
});
