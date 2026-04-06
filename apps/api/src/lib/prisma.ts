import { PrismaClient } from "@prisma/client";
import { eventBus } from "./event-bus.js";

declare global {
  var __agentKanbanPrisma__: PrismaClient | undefined;
}

export function createPrismaClient(): PrismaClient {
  const client = new PrismaClient();

  return client.$extends({
    query: {
      event: {
        async create({ args, query }) {
          const result = await query(args);
          eventBus.emitEvent({
            type: (result as any).type,
            projectId: (result as any).projectId,
            cardId: (result as any).cardId ?? undefined,
            payload: (result as any).payloadJson,
          });
          return result;
        },
      },
    },
  }) as unknown as PrismaClient;
}

export const prisma = globalThis.__agentKanbanPrisma__ ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalThis.__agentKanbanPrisma__ = prisma;
}
