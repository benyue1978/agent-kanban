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

describe.sequential("workflow routes", () => {
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

  it("lists projects", async () => {
    const app = await buildApp({ prisma });

    const response = await app.inject({
      method: "GET",
      url: "/projects",
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().projects).toHaveLength(1);
    expect(response.json().projects[0]).toMatchObject({
      id: "project-1",
      name: "agent-kanban",
      repoUrl: "https://example.com/repo.git",
    });
  });

  it("returns a 409 when creating a project with a duplicate name", async () => {
    const app = await buildApp({ prisma });

    const response = await app.inject({
      method: "POST",
      url: "/projects",
      payload: {
        name: "agent-kanban",
        repoUrl: "https://example.com/another-repo.git",
      },
    });

    expect(response.statusCode).toBe(409);
    expect(response.json().error.code).toBe("duplicate_name");
  });

  it("returns a 409 when creating a card with a duplicate title in the same project", async () => {
    const app = await buildApp({ prisma });

    const response = await app.inject({
      method: "POST",
      url: "/cards",
      payload: {
        projectId: "project-1",
        title: "Backend skeleton",
        descriptionMd: `# Backend skeleton duplicate

## Goal
Ship it again

## Scope
Build it again

## Definition of Done
- [ ] tests`,
      },
    });

    expect(response.statusCode).toBe(409);
    expect(response.json().error.code).toBe("duplicate_name");
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

  it("updates priority with revision checks", async () => {
    const app = await buildApp({ prisma });

    const response = await app.inject({
      method: "POST",
      url: "/cards/card-2/set-priority",
      payload: {
        actorId: "agent-1",
        revision: 2,
        priority: 1,
      },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().card.priority).toBe(1);
    expect(response.json().card.revision).toBe(3);
  });

  it("returns revision_conflict when priority is updated twice with the same revision", async () => {
    const app = await buildApp({ prisma });

    const first = await app.inject({
      method: "POST",
      url: "/cards/card-2/set-priority",
      payload: {
        actorId: "agent-1",
        revision: 2,
        priority: 1,
      },
    });

    const second = await app.inject({
      method: "POST",
      url: "/cards/card-2/set-priority",
      payload: {
        actorId: "agent-1",
        revision: 2,
        priority: 2,
      },
    });

    expect(first.statusCode).toBe(200);
    expect(second.statusCode).toBe(409);
    expect(second.json().error.code).toBe("revision_conflict");
  });

  it("imports plan tasks idempotently and protects active cards", async () => {
    const app = await buildApp({ prisma });

    const first = await app.inject({
      method: "POST",
      url: "/projects/project-1/import-plan",
      payload: {
        actorId: "agent-1",
        tasks: [
          {
            sourceTaskId: "task-1",
            sourceTaskFingerprint: "fingerprint-1",
            sourcePlanPath: "docs/superpowers/plans/example.md",
            sourceSpecPath: "docs/superpowers/specs/example.md",
            title: "Imported task",
            descriptionMd: "# Imported task",
          },
        ],
      },
    });

    expect(first.statusCode).toBe(200);
    expect(first.json().results[0].outcome).toBe("created");

    const second = await app.inject({
      method: "POST",
      url: "/projects/project-1/import-plan",
      payload: {
        actorId: "agent-1",
        tasks: [
          {
            sourceTaskId: "task-1",
            sourceTaskFingerprint: "fingerprint-1",
            sourcePlanPath: "docs/superpowers/plans/example.md",
            sourceSpecPath: "docs/superpowers/specs/example.md",
            title: "Imported task",
            descriptionMd: "# Imported task",
          },
        ],
      },
    });

    expect(second.statusCode).toBe(200);
    expect(second.json().results[0].outcome).toBe("unchanged");

    const importedCardId = first.json().results[0].cardId as string;
    const importedCard = await prisma.card.findUniqueOrThrow({
      where: { id: importedCardId },
      select: { revision: true },
    });

    await app.inject({
      method: "POST",
      url: `/cards/${importedCardId}/assign-owner`,
      payload: {
        actorId: "agent-1",
        ownerId: "agent-1",
        revision: importedCard.revision,
      },
    });

    const moved = await app.inject({
      method: "POST",
      url: `/cards/${importedCardId}/set-state`,
      payload: {
        actorId: "agent-1",
        ownerId: "agent-1",
        to: "In Progress",
      },
    });
    expect(moved.statusCode).toBe(200);

    const protectedResponse = await app.inject({
      method: "POST",
      url: "/projects/project-1/import-plan",
      payload: {
        actorId: "agent-1",
        tasks: [
          {
            sourceTaskId: "task-1",
            sourceTaskFingerprint: "fingerprint-2",
            sourcePlanPath: "docs/superpowers/plans/example.md",
            sourceSpecPath: "docs/superpowers/specs/example.md",
            title: "Imported task updated",
            descriptionMd: "# Imported task updated",
          },
        ],
      },
    });

    expect(protectedResponse.statusCode).toBe(200);
    expect(protectedResponse.json().results[0].outcome).toBe("protected");
  });

  it("rejects New -> Ready transition if description contains placeholders", async () => {
    const app = await buildApp({ prisma });

    // Card 2 is New and has "# current" (incomplete)
    const response = await app.inject({
      method: "POST",
      url: "/cards/card-2/set-state",
      payload: {
        actorId: "agent-1", 
        to: "Ready",
        revision: 2,
      },
    });

    expect(response.statusCode).toBe(400);
    expect(response.json().error.code).toBe("missing_required_section");
    expect(response.json().error.message).toContain("required sections");
  });
});
