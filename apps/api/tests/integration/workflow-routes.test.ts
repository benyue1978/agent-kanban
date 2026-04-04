import { PrismaClient } from "@prisma/client";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { buildApp } from "../../src/app.js";
import { createTestPrisma, resetDatabase } from "./test-db.js";

const prisma = createTestPrisma();

async function seedWorkflowFixture(client: PrismaClient): Promise<void> {
  await client.project.create({
    data: {
      id: "project-1",
      name: "agent-kanban",
      repoUrl: "https://example.com/repo.git",
      policyJson: {
        allowAgentReview: false,
        allowSelfReview: false,
        allowAgentPickUnassignedReady: true,
        defaultSelectionPolicy: "priority_then_ready_age_then_updated_at",
      },
    },
  });

  await client.collaborator.create({
    data: {
      id: "agent-1",
      kind: "agent",
      displayName: "Agent One",
    },
  });

  await client.collaborator.create({
    data: {
      id: "agent-2",
      kind: "agent",
      displayName: "Agent Two",
    },
  });

  await client.card.create({
    data: {
      id: "card-1",
      projectId: "project-1",
      title: "Backend skeleton",
      descriptionMd: `# Backend skeleton

## Goal
Ship it

## Scope
Build it

## Definition of Done
- [ ] tests`,
      revision: 1,
      state: "Ready",
    },
  });

  await client.card.create({
    data: {
      id: "card-2",
      projectId: "project-1",
      title: "Stale update target",
      descriptionMd: "# current",
      revision: 2,
      state: "New",
    },
  });
}

describe("workflow routes", () => {
  beforeEach(async () => {
    await resetDatabase(prisma);
    await seedWorkflowFixture(prisma);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("returns claim_conflict when a Ready card is claimed twice", async () => {
    const app = await buildApp({ prisma });

    const first = await app.inject({
      method: "POST",
      url: "/cards/card-1/set-state",
      payload: { to: "In Progress", ownerId: "agent-1" },
    });
    const second = await app.inject({
      method: "POST",
      url: "/cards/card-1/set-state",
      payload: { to: "In Progress", ownerId: "agent-2" },
    });

    expect(first.statusCode).toBe(200);
    expect(second.statusCode).toBe(409);
    expect(second.json().error.code).toBe("claim_conflict");
  });

  it("returns revision_conflict on stale markdown update", async () => {
    const app = await buildApp({ prisma });

    const response = await app.inject({
      method: "POST",
      url: "/cards/card-2/update-markdown",
      payload: { revision: 1, descriptionMd: "# stale" },
    });

    expect(response.statusCode).toBe(409);
    expect(response.json().error.code).toBe("revision_conflict");
  });
});
