import { describe, expect, it } from "vitest";

import { resolveComposeStack } from "../compose-stack.mjs";

describe("compose stack selection", () => {
  it("uses the production env file for the default stack", () => {
    const config = resolveComposeStack("prod");

    expect(config.envFile).toBe(".env");
    expect(config.composeProjectName).toBe("agent-kanban-prod");
  });

  it("uses the development env file for the dev stack", () => {
    const config = resolveComposeStack("dev");

    expect(config.envFile).toBe(".env.dev");
    expect(config.composeProjectName).toBe("agent-kanban-dev");
  });

  it("builds docker compose args with the selected env file and project", () => {
    const config = resolveComposeStack("dev");

    expect(config.composeArgs("up", "-d", "postgres")).toEqual([
      "--env-file",
      ".env.dev",
      "--project-name",
      "agent-kanban-dev",
      "up",
      "-d",
      "postgres",
    ]);
  });
});
