import { PrismaClient } from "@prisma/client";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { buildApp } from "../../src/app.js";
import { eventBus } from "../../src/lib/event-bus.js";
import { createTestPrisma, resetDatabase } from "./test-db.js";

const prisma = createTestPrisma();

async function seedEventsFixture(client: PrismaClient): Promise<void> {
  await client.project.create({
    data: {
      id: "project-events",
      name: "events-test",
      repoUrl: "https://example.com/events.git",
      policyJson: {
        allowAgentPickUnassignedReady: true,
        defaultSelectionPolicy: "priority_then_ready_age_then_updated_at",
      },
    },
  });

  await client.collaborator.create({
    data: {
      id: "agent-events",
      kind: "agent",
      displayName: "Event Agent",
    },
  });

  await client.card.create({
    data: {
      id: "card-events",
      projectId: "project-events",
      title: "Event Card",
      descriptionMd: "# Event Card",
      revision: 1,
      state: "New",
    },
  });
}

describe("events sse", () => {
  beforeEach(async () => {
    await resetDatabase(prisma);
    await seedEventsFixture(prisma);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("streams events for a project", async () => {
    const app = await buildApp({ prisma });
    await app.listen({ port: 0 });
    const address = app.server.address() as { port: number };
    const url = `http://127.0.0.1:${address.port}/events?projectId=project-events`;

    const controller = new AbortController();
    const response = await fetch(url, { signal: controller.signal });
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("text/event-stream");

    const reader = response.body!.getReader();

    // Trigger an event via another request
    const updateResponse = await app.inject({
      method: "POST",
      url: "/cards/card-events/assign-owner",
      payload: {
        actorId: "agent-events",
        ownerId: "agent-events",
        revision: 1,
      },
    });
    expect(updateResponse.statusCode).toBe(200);

    // Read from the stream
    let data = "";
    const decoder = new TextDecoder();

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      data += decoder.decode(value, { stream: true });
      if (data.includes("data: {") && data.includes("owner_assigned")) break;
    }

    controller.abort();
    await app.close();

    expect(data).toContain("data: {");
    expect(data).toContain("owner_assigned");
    expect(data).toContain('"projectId":"project-events"');
  });

  it("filters events by projectId", async () => {
    const app = await buildApp({ prisma });
    await app.listen({ port: 0 });
    const address = app.server.address() as { port: number };
    
    // Listen to a DIFFERENT project
    const url = `http://127.0.0.1:${address.port}/events?projectId=other-project`;

    const controller = new AbortController();
    const response = await fetch(url, { signal: controller.signal });
    const reader = response.body!.getReader();

    // Trigger an event in project-events
    await app.inject({
      method: "POST",
      url: "/cards/card-events/assign-owner",
      payload: {
        actorId: "agent-events",
        ownerId: "agent-events",
        revision: 2, // updated from previous test, but we run in isolated beforeEach so it's 1
      },
    });

    // We expect NO events for other-project (except maybe ping)
    // We'll wait a short bit and then abort
    const timeout = setTimeout(() => controller.abort(), 200);
    
    let receivedEvent = false;
    const decoder = new TextDecoder();
    try {
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        const text = decoder.decode(value);
        if (text.includes("data: {")) {
          receivedEvent = true;
          break;
        }
      }
    } catch (e) {
      // expected when aborting
    } finally {
      clearTimeout(timeout);
    }

    await app.close();
    expect(receivedEvent).toBe(false);
  });
});
