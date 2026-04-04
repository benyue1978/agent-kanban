import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { CardRepository } from "../../src/repositories/card-repository.js";
import { ProjectRepository } from "../../src/repositories/project-repository.js";
import { createTestPrisma, resetDatabase } from "./test-db.js";

const prisma = createTestPrisma();

describe("project and card repositories", () => {
  beforeAll(async () => {
    await resetDatabase(prisma);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("creates a project and an initial New card with revision 1", async () => {
    const project = await new ProjectRepository(prisma).create({
      name: "agent-kanban",
      repoUrl: "https://example.com/repo.git",
    });

    const card = await new CardRepository(prisma).create({
      projectId: project.id,
      title: "Backend skeleton",
      descriptionMd: "# Backend skeleton",
    });

    expect(card.state).toBe("New");
    expect(card.revision).toBe(1);
  });

  it("lists board-ready card summaries for a project", async () => {
    const project = await new ProjectRepository(prisma).create({
      name: "board-test",
      repoUrl: "https://example.com/board.git",
    });

    await new CardRepository(prisma).create({
      projectId: project.id,
      title: "First card",
      descriptionMd: "# First card",
    });

    const board = await new CardRepository(prisma).listBoard(project.id);

    expect(board.columns.New.cards).toHaveLength(1);
    expect(board.columns.New.cards[0]?.title).toBe("First card");
  });
});
