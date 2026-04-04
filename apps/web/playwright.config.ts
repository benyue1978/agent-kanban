import { defineConfig } from "@playwright/test";

export default defineConfig({
  workers: 1,
  testDir: "./tests",
  use: {
    baseURL: "http://127.0.0.1:3000",
  },
  webServer: [
    {
      command: "pnpm --filter @agent-kanban/api dev",
      cwd: "/Users/song.yue/git/agent-kanban/.worktrees/codex-local-first-mvp-execution",
      env: {
        DATABASE_URL:
          "postgresql://agent_kanban:agent_kanban@localhost:5433/agent_kanban?schema=public",
        PORT: "3001",
      },
      port: 3001,
      reuseExistingServer: true,
      timeout: 120000,
    },
    {
      command: "pnpm dev",
      cwd: "/Users/song.yue/git/agent-kanban/.worktrees/codex-local-first-mvp-execution/apps/web",
      env: {
        KANBAN_API_URL: "http://127.0.0.1:3001",
        KANBAN_HUMAN_ACTOR_ID: "human-reviewer",
      },
      port: 3000,
      reuseExistingServer: true,
      timeout: 120000,
    },
  ],
});
