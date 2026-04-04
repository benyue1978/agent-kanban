import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createServer, type Server } from "node:http";
import { runCli } from "./run-cli.js";

describe("cli", () => {
  let server: Server;
  let serverUrl = "";

  beforeEach(async () => {
    server = createServer((request, response) => {
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
              "In Review": { state: "In Review", cards: [] },
              Done: { state: "Done", cards: [] },
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

  it("prints machine-usable JSON for list", async () => {
    const result = await runCli(["list", "--json"], {
      KANBAN_API_URL: serverUrl,
      KANBAN_PROJECT_ID: "project-1",
    });

    expect(result.exitCode).toBe(0);
    expect(JSON.parse(result.stdout)).toHaveProperty("cards");
  });

  it("surfaces stable error codes on failure", async () => {
    const result = await runCli(["set-state", "--id", "missing", "--to", "Done", "--json"], {
      KANBAN_API_URL: serverUrl,
    });

    expect(result.exitCode).toBe(1);
    expect(JSON.parse(result.stderr).error.code).toBeDefined();
  });
});
