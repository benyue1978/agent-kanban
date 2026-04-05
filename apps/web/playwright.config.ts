import { defineConfig } from "@playwright/test";

const apiPort = process.env.PLAYWRIGHT_API_PORT ?? "3101";
const webPort = process.env.PLAYWRIGHT_WEB_PORT ?? "3100";

export default defineConfig({
  workers: 1,
  testDir: "./tests",
  use: {
    baseURL: `http://127.0.0.1:${webPort}`,
  },
  webServer: [
    {
      command: "pnpm --filter @agent-kanban/api dev",
      cwd: "/Users/song.yue/git/agent-kanban/.worktrees/codex-local-first-mvp-execution",
      env: {
        DATABASE_URL:
          "postgresql://agent_kanban:agent_kanban@localhost:5433/agent_kanban?schema=public",
        PORT: apiPort,
      },
      port: Number(apiPort),
      reuseExistingServer: false,
      timeout: 120000,
    },
    {
      command: "pnpm dev",
      cwd: "/Users/song.yue/git/agent-kanban/.worktrees/codex-local-first-mvp-execution/apps/web",
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
