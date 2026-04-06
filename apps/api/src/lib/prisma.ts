import { PrismaClient } from "@prisma/client";

declare global {
  var __agentKanbanPrisma__: PrismaClient | undefined;
}

export function createPrismaClient(): PrismaClient {
  return new PrismaClient();
}

export const prisma = globalThis.__agentKanbanPrisma__ ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalThis.__agentKanbanPrisma__ = prisma;
}
