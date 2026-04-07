import { PrismaClient } from "@prisma/client";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { buildApp } from "../../src/app.js";
import { createTestPrisma, resetDatabase } from "./test-db.js";

const prisma = createTestPrisma();

async function seedCommentFixture(client: PrismaClient): Promise<void> {
  await client.project.create({
    data: {
      id: "project-comment-inbox",
      name: "comment-inbox-test",
      repoUrl: "https://example.com/repo.git",
      policyJson: {
        allowAgentPickUnassignedReady: true,
        defaultSelectionPolicy: "priority_then_ready_age_then_updated_at",
      },
    },
  });

  await client.collaborator.createMany({
    data: [
      {
        id: "agent-main",
        kind: "agent",
        displayName: "Codex Main",
      },
      {
        id: "agent-peer",
        kind: "agent",
        displayName: "Codex Peer",
      },
      {
        id: "human-song",
        kind: "human",
        displayName: "Song",
      },
      {
        id: "human",
        kind: "human",
        displayName: "Reviewer",
      },
    ],
  });

  await client.card.create({
    data: {
      id: "card-comment-inbox-1",
      projectId: "project-comment-inbox",
      title: "Review-ready API task",
      descriptionMd: `# Review-ready API task

## Goal
Ship comments and inbox

## Context
Testing vertical slice

## Scope
Implement Task 7

## Definition of Done
- [x] comments
- [x] inbox`,
      revision: 3,
      state: "In Progress",
      ownerId: "agent-main",
    },
  });
}

describe.sequential("comment and inbox routes", () => {
  beforeEach(async () => {
    await resetDatabase(prisma);
    await seedCommentFixture(prisma);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("creates mention-driven inbox items and allows status updates", async () => {
    const app = await buildApp({ prisma });

    const commentResponse = await app.inject({
      method: "POST",
      url: "/cards/card-comment-inbox-1/comments",
      payload: {
        authorId: "agent-main",
        kind: "question",
        body: "@human-song can you review this?",
      },
    });

    expect(commentResponse.statusCode).toBe(201);
    expect(commentResponse.json().comment.mentions).toEqual(["human-song"]);

    const inboxResponse = await app.inject({
      method: "GET",
      url: "/inbox?collaboratorId=human-song",
    });

    expect(inboxResponse.statusCode).toBe(200);
    expect(inboxResponse.json().items).toHaveLength(1);
    expect(inboxResponse.json().items[0].status).toBe("open");

    const statusResponse = await app.inject({
      method: "POST",
      url: `/inbox/items/${inboxResponse.json().items[0].id}/set-status`,
      payload: {
        status: "acknowledged",
      },
    });

    expect(statusResponse.statusCode).toBe(200);
    expect(statusResponse.json().item.status).toBe("acknowledged");

    const cardResponse = await app.inject({
      method: "GET",
      url: "/cards/card-comment-inbox-1",
    });

    expect(cardResponse.statusCode).toBe(200);
    expect(cardResponse.json().card.comments).toHaveLength(1);
    expect(cardResponse.json().card.comments[0].mentions).toEqual(["human-song"]);
  });

  it("logs comment, owner, state, markdown, and summary events", async () => {
    const app = await buildApp({ prisma });

    const assignResponse = await app.inject({
      method: "POST",
      url: "/cards/card-comment-inbox-1/assign-owner",
      payload: {
        revision: 3,
        actorId: "human-song",
        ownerId: "agent-peer",
      },
    });
    expect(assignResponse.statusCode).toBe(200);

    const stateResponse = await app.inject({
      method: "POST",
      url: "/cards/card-comment-inbox-1/set-state",
      payload: {
        actorId: "human-song",
        revision: assignResponse.json().card.revision,
        to: "Done",
      },
    });
    expect(stateResponse.statusCode).toBe(400);
    expect(stateResponse.json().error.code).toBe("summary_required");

    const markdownResponse = await app.inject({
      method: "POST",
      url: "/cards/card-comment-inbox-1/update-markdown",
      payload: {
        actorId: "agent-peer",
        revision: assignResponse.json().card.revision,
        descriptionMd: `# Review-ready API task

## Goal
Ship comments and inbox

## Context
Testing vertical slice

## Scope
Implement Task 7 completely

## Definition of Done
- [x] comments
- [x] inbox`,
      },
    });
    expect(markdownResponse.statusCode).toBe(200);

    const summaryResponse = await app.inject({
      method: "POST",
      url: "/cards/card-comment-inbox-1/append-summary",
      payload: {
        actorId: "agent-peer",
        revision: markdownResponse.json().card.revision,
        summaryMd: `### What was done
- Implemented comments and inbox

### Result / Links
Commit: abc1234

### DoD Check
- [x] comments
- [x] inbox`,
      },
    });
    expect(summaryResponse.statusCode).toBe(200);

    const verificationComment = await app.inject({
      method: "POST",
      url: "/cards/card-comment-inbox-1/comments",
      payload: {
        authorId: "human",
        kind: "verification",
        body: "Verified summary and inbox behavior.",
      },
    });
    expect(verificationComment.statusCode).toBe(201);

    const commentResponse = await app.inject({
      method: "POST",
      url: "/cards/card-comment-inbox-1/comments",
      payload: {
        authorId: "human",
        kind: "decision",
        body: "Looks good to me.",
      },
    });
    expect(commentResponse.statusCode).toBe(201);

    const completeResponse = await app.inject({
      method: "POST",
      url: "/cards/card-comment-inbox-1/set-state",
      payload: {
        actorId: "human",
        revision: summaryResponse.json().card.revision,
        to: "Done",
      },
    });
    expect(completeResponse.statusCode).toBe(200);

    const events = await prisma.event.findMany({
      where: {
        cardId: "card-comment-inbox-1",
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    expect(events.map((event) => event.type)).toEqual([
      "owner_assigned",
      "markdown_updated",
      "summary_updated",
      "comment_added",
      "comment_added",
      "state_changed",
    ]);
  });
});
