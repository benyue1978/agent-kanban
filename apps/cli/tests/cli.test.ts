import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createServer, type Server } from "node:http";
import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { execFile } from "node:child_process";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { runCli } from "./run-cli.js";

const execFileAsync = promisify(execFile);

describe("cli", () => {
  let server: Server;
  let serverUrl = "";
  let repoDir = "";

  beforeEach(async () => {
    server = createServer((request, response) => {
      if (request.url === "/projects" && request.method === "GET") {
        response.writeHead(200, { "content-type": "application/json" });
        response.end(
          JSON.stringify({
            projects: [
              {
                id: "project-1",
                name: "agent-kanban",
                repoUrl: "https://github.com/benyue1978/agent-kanban.git",
                countsByState: {
                  New: 0,
                  Ready: 1,
                  "In Progress": 0,
                  Done: 0,
                },
              },
            ],
          })
        );
        return;
      }

      if (request.url === "/projects/project-1/board" && request.method === "GET") {
        response.writeHead(200, { "content-type": "application/json" });
        response.end(
          JSON.stringify({
            columns: {
              New: { state: "New", cards: [] },
              Ready: {
                state: "Ready",
                cards: [
                  {
                    id: "card-1",
                    projectId: "project-1",
                    sourcePlanPath: null,
                    sourceSpecPath: null,
                    sourceTaskId: null,
                    title: "Backend skeleton",
                    state: "Ready",
                    owner: null,
                    priority: 1,
                    revision: 1,
                    updatedAt: "2026-04-04T00:00:00.000Z",
                    summaryMd: null,
                  },
                ],
              },
              "In Progress": { state: "In Progress", cards: [] },
              Done: { state: "Done", cards: [] },
            },
          })
        );
        return;
      }

      if (request.url === "/cards/card-1" && request.method === "GET") {
        response.writeHead(200, { "content-type": "application/json" });
        response.end(
          JSON.stringify({
            card: {
              id: "card-1",
              projectId: "project-1",
              sourcePlanPath: null,
              sourceSpecPath: null,
              sourceTaskId: null,
              title: "Backend skeleton",
              state: "Ready",
              owner: null,
              priority: 1,
              revision: 1,
              updatedAt: "2026-04-04T00:00:00.000Z",
              summaryMd: null,
              descriptionMd: "# Backend skeleton",
              comments: [],
            },
          })
        );
        return;
      }

      if (request.url === "/cards/missing/set-state" && request.method === "POST") {
        response.writeHead(404, { "content-type": "application/json" });
        response.end(
          JSON.stringify({
            error: {
              code: "invalid_transition",
              message: "card not found",
            },
          })
        );
        return;
      }

      response.writeHead(500, { "content-type": "application/json" });
      response.end(JSON.stringify({ error: { code: "unexpected", message: "unexpected" } }));
    });

    await new Promise<void>((resolve) => {
      server.listen(0, "127.0.0.1", () => {
        const address = server.address();

        if (address === null || typeof address === "string") {
          throw new Error("failed to bind test server");
        }

        serverUrl = `http://127.0.0.1:${address.port}`;
        resolve();
      });
    });

    repoDir = await mkdtemp(path.join(tmpdir(), "agent-kanban-cli-"));
    await execFileAsync("git", ["init"], { cwd: repoDir });
    await execFileAsync("git", ["remote", "add", "origin", "git@github.com:benyue1978/agent-kanban.git"], {
      cwd: repoDir,
    });
    await writeFile(path.join(repoDir, "card.md"), "# updated");
  });

  afterEach(async () => {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => {
        if (error) {
          reject(error);
          return;
        }

        resolve();
      });
    });
  });

  it("prints machine-usable JSON for projects list", async () => {
    const result = await runCli(["projects", "list", "--json"], {
      KANBAN_API_URL: serverUrl,
    });

    expect(result.exitCode).toBe(0);
    expect(JSON.parse(result.stdout)).toHaveProperty("projects");
  });

  it("uses --api-url without requiring KANBAN_API_URL and lets the flag override the env var", async () => {
    const result = await runCli(
      ["--api-url", serverUrl, "projects", "list", "--json"],
      {
        KANBAN_API_URL: "http://127.0.0.1:1",
      }
    );

    expect(result.exitCode).toBe(0);
    expect(JSON.parse(result.stdout)).toHaveProperty("projects");
  });

  it("infers repo url and default name when creating a project from a repo checkout", async () => {
    server.removeAllListeners("request");
    server.on("request", (request, response) => {
      if (request.url === "/projects" && request.method === "POST") {
        let body = "";
        request.on("data", (chunk) => {
          body += String(chunk);
        });
        request.on("end", () => {
          const payload = JSON.parse(body) as {
            description: string | null;
            name: string;
            repoUrl: string;
          };
          response.writeHead(201, { "content-type": "application/json" });
          response.end(
            JSON.stringify({
              project: {
                id: "project-1",
                name: payload.name,
                description: payload.description,
                repoUrl: payload.repoUrl,
                policy: {
                  allowAgentPickUnassignedReady: false,
                  defaultSelectionPolicy: "priority_then_ready_age_then_updated_at",
                },
              },
            })
          );
        });
        return;
      }

      response.writeHead(500, { "content-type": "application/json" });
      response.end(JSON.stringify({ error: { code: "unexpected", message: "unexpected" } }));
    });

    const result = await runCli(["projects", "create", "--json"], {
      KANBAN_API_URL: serverUrl,
    }, { cwd: repoDir });

    expect(result.exitCode).toBe(0);
    expect(JSON.parse(result.stdout).project).toMatchObject({
      name: "agent-kanban",
      repoUrl: "git@github.com:benyue1978/agent-kanban.git",
    });
  });

  it("prints machine-usable JSON for cards list with explicit project", async () => {
    const result = await runCli(["cards", "list", "--project", "project-1", "--json"], {
      KANBAN_API_URL: serverUrl,
    });

    expect(result.exitCode).toBe(0);
    expect(JSON.parse(result.stdout)).toHaveProperty("cards");
  });

  it("infers the current project from git origin for cards list", async () => {
    const result = await runCli(["cards", "list", "--json"], {
      KANBAN_API_URL: serverUrl,
    }, { cwd: repoDir });

    expect(result.exitCode).toBe(0);
    expect(JSON.parse(result.stdout).cards[0].projectId).toBe("project-1");
  });

  it("fails clearly when no project matches the current repo", async () => {
    server.removeAllListeners("request");
    server.on("request", (_request, response) => {
      response.writeHead(200, { "content-type": "application/json" });
      response.end(
        JSON.stringify({
          projects: [
            {
              id: "project-2",
              name: "other-repo",
              repoUrl: "https://github.com/example/other-repo.git",
              countsByState: {
                New: 0,
                Ready: 0,
                "In Progress": 0,
                Done: 0,
              },
            },
          ],
        })
      );
    });

    const result = await runCli(["cards", "list", "--json"], {
      KANBAN_API_URL: serverUrl,
    }, { cwd: repoDir });

    expect(result.exitCode).toBe(1);
    expect(JSON.parse(result.stderr).error.message).toContain("run `kanban projects list`");
  });

  it("fails clearly when multiple projects match the current repo", async () => {
    server.removeAllListeners("request");
    server.on("request", (_request, response) => {
      response.writeHead(200, { "content-type": "application/json" });
      response.end(
        JSON.stringify({
          projects: [
            {
              id: "project-1",
              name: "agent-kanban-a",
              repoUrl: "git@github.com:benyue1978/agent-kanban.git",
              countsByState: {
                New: 0,
                Ready: 0,
                "In Progress": 0,
                Done: 0,
              },
            },
            {
              id: "project-2",
              name: "agent-kanban-b",
              repoUrl: "https://github.com/benyue1978/agent-kanban.git",
              countsByState: {
                New: 0,
                Ready: 0,
                "In Progress": 0,
                Done: 0,
              },
            },
          ],
        })
      );
    });

    const result = await runCli(["cards", "list", "--json"], {
      KANBAN_API_URL: serverUrl,
    }, { cwd: repoDir });

    expect(result.exitCode).toBe(1);
    expect(JSON.parse(result.stderr).error.message).toContain("multiple projects");
  });

  it("surfaces stable error codes on failure", async () => {
    const result = await runCli(
      ["cards", "set-state", "--id", "missing", "--to", "done", "--json"],
      {
        KANBAN_API_URL: serverUrl,
      }
    );

    expect(result.exitCode).toBe(1);
    expect(JSON.parse(result.stderr).error.code).toBeDefined();
  });

  it("maps in-progress state slug to the API contract value", async () => {
    server.removeAllListeners("request");
    server.on("request", (request, response) => {
      if (request.url === "/cards/card-1" && request.method === "GET") {
        response.writeHead(200, { "content-type": "application/json" });
        response.end(
          JSON.stringify({
            card: {
              id: "card-1",
              projectId: "project-1",
              sourcePlanPath: null,
              sourceSpecPath: null,
              sourceTaskId: null,
              title: "Backend skeleton",
              state: "Ready",
              owner: null,
              priority: 1,
              revision: 1,
              updatedAt: "2026-04-04T00:00:00.000Z",
              summaryMd: null,
              descriptionMd: "# Backend skeleton",
              comments: [],
            },
          })
        );
        return;
      }

      if (request.url === "/cards/card-1/set-state" && request.method === "POST") {
        let body = "";
        request.on("data", (chunk) => {
          body += String(chunk);
        });
        request.on("end", () => {
          const payload = JSON.parse(body) as { to: string };
          response.writeHead(200, { "content-type": "application/json" });
          response.end(
            JSON.stringify({
              card: {
                id: "card-1",
                projectId: "project-1",
                sourcePlanPath: null,
                sourceSpecPath: null,
                sourceTaskId: null,
                title: "Backend skeleton",
                state: payload.to,
                owner: null,
                priority: 1,
                revision: 2,
                updatedAt: "2026-04-04T00:00:00.000Z",
                summaryMd: null,
                descriptionMd: "# Backend skeleton",
                comments: [],
              },
            })
          );
        });
        return;
      }

      response.writeHead(500, { "content-type": "application/json" });
      response.end(JSON.stringify({ error: { code: "unexpected", message: "unexpected" } }));
    });

    const result = await runCli(
      ["cards", "set-state", "--id", "card-1", "--to", "in-progress", "--owner", "agent-1", "--json"],
      {
        KANBAN_API_URL: serverUrl,
      },
      {
        cwd: path.dirname(fileURLToPath(import.meta.url)),
      }
    );

    expect(result.exitCode).toBe(0);
    expect(JSON.parse(result.stdout).card.state).toBe("In Progress");
  });

  it("prints help for top-level and resource commands", async () => {
    const topLevel = await runCli(["--help"], {
      KANBAN_API_URL: serverUrl,
    });
    const projects = await runCli(["projects", "--help"], {
      KANBAN_API_URL: serverUrl,
    });
    const cards = await runCli(["cards", "--help"], {
      KANBAN_API_URL: serverUrl,
    });

    expect(topLevel.exitCode).toBe(0);
    expect(topLevel.stdout).toContain("Usage: kanban");
    expect(projects.exitCode).toBe(0);
    expect(projects.stdout).toContain("Usage: kanban projects");
    expect(cards.exitCode).toBe(0);
    expect(cards.stdout).toContain("Usage: kanban cards");
  });

  it("reads card description from stdin when file is '-'", async () => {
    server.removeAllListeners("request");
    server.on("request", (request, response) => {
      if (request.url === "/cards" && request.method === "POST") {
        let body = "";
        request.on("data", (chunk) => {
          body += String(chunk);
        });
        request.on("end", () => {
          const payload = JSON.parse(body) as { descriptionMd: string; title: string };
          response.writeHead(201, { "content-type": "application/json" });
          response.end(
            JSON.stringify({
              card: {
                id: "card-new",
                projectId: "project-1",
                title: payload.title,
                descriptionMd: payload.descriptionMd,
                state: "New",
                revision: 1,
              },
            })
          );
        });
        return;
      }

      response.writeHead(500, { "content-type": "application/json" });
      response.end(JSON.stringify({ error: { code: "unexpected", message: "unexpected" } }));
    });

    const result = await runCli(
      ["cards", "create", "--project", "project-1", "--title", "Stdin Card", "--description-file", "-", "--json"],
      {
        KANBAN_API_URL: serverUrl,
      },
      {
        stdin: "# Stdin Description\n\n## Goal\nTest stdin",
      }
    );

    expect(result.exitCode).toBe(0);
    expect(JSON.parse(result.stdout).card.descriptionMd).toContain("# Stdin Description");
  });
});
