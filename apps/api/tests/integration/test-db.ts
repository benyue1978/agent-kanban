import { PrismaClient } from "@prisma/client";

export function createTestPrisma(): PrismaClient {
  return new PrismaClient();
}

export async function resetDatabase(prisma: PrismaClient): Promise<void> {
  await prisma.$executeRawUnsafe(
    `TRUNCATE TABLE
      "events",
      "comment_mentions",
      "comments",
      "cards",
      "collaborators",
      "projects"
    RESTART IDENTITY CASCADE`
  );
}
