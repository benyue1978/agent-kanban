import { describe, expect, it } from "vitest";

import { resolveCliGlobalCommands } from "../cli-global.mjs";

describe("cli global install wrapper", () => {
  it("builds and links the CLI globally for install", () => {
    const commands = resolveCliGlobalCommands("install");

    expect(commands).toEqual([
      {
        command: "pnpm",
        args: ["--filter", "@agent-kanban/cli", "build"],
      },
      {
        command: "pnpm",
        args: ["link", "--global", "./apps/cli"],
      },
    ]);
  });

  it("unlinks the CLI globally for uninstall", () => {
    const commands = resolveCliGlobalCommands("uninstall");

    expect(commands).toEqual([
      {
        command: "pnpm",
        args: ["remove", "-g", "@agent-kanban/cli"],
      },
      {
        command: "pnpm",
        args: ["remove", "-g", "agent-kanban"],
        allowFailure: true,
      },
    ]);
  });
});
