import { PrismaClient } from "@prisma/client";
import { createPrismaClient } from "../../src/lib/prisma.js";

export function createTestPrisma(): PrismaClient {
  return createPrismaClient();
}

export async function resetDatabase(prisma: PrismaClient): Promise<void> {
  // --- SAFETY GUARD ---
  // Ensure we are not connected to the production database.
  // Production URL usually contains port 5433 or database name 'agent_kanban' (without _dev).
  const databaseUrl = process.env.DATABASE_URL ?? "";
  const isProdPort = databaseUrl.includes(":5433");
  const isProdDb = databaseUrl.includes("/agent_kanban") && !databaseUrl.includes("/agent_kanban_dev");

  if (isProdPort || isProdDb) {
    throw new Error(
      `CRITICAL SAFETY VIOLATION: Attempted to run resetDatabase on production-like database URL: ${databaseUrl}. ` +
      `Tests must only run against the development/test database (port 5434, name agent_kanban_dev).`
    );
  }
  // --------------------

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
