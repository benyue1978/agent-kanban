import Fastify, { type FastifyInstance } from "fastify";
import type { PrismaClient } from "@prisma/client";
import { prisma as defaultPrisma } from "./lib/prisma.js";
import { cardRoutes } from "./routes/cards.js";
import { collaboratorRoutes } from "./routes/collaborators.js";
import { inboxRoutes } from "./routes/inbox.js";
import { projectRoutes } from "./routes/projects.js";
import { ApiError } from "./services/card-service.js";
import { SummaryValidationError } from "@agent-kanban/card-markdown";

declare module "fastify" {
  interface FastifyInstance {
    prisma: PrismaClient;
  }
}

export interface BuildAppOptions {
  prisma?: PrismaClient;
}

export async function buildApp(options: BuildAppOptions = {}): Promise<FastifyInstance> {
  const app = Fastify();
  app.decorate("prisma", options.prisma ?? defaultPrisma);

  app.setErrorHandler((error, _request, reply) => {
    if (error instanceof ApiError) {
      return reply.code(error.statusCode).send({
        error: {
          code: error.code,
          message: error.message,
          ...(error.details === undefined ? {} : { details: error.details }),
        },
      });
    }

    if (error instanceof SummaryValidationError) {
      return reply.code(400).send({
        error: {
          code: "summary_required",
          message: error.message,
        },
      });
    }

    app.log.error(error);
    return reply.code(500).send({
      error: {
        code: "invalid_transition",
        message: "internal server error",
      },
    });
  });

  app.get("/health", async () => ({ ok: true }));
  await app.register(projectRoutes);
  await app.register(cardRoutes);
  await app.register(collaboratorRoutes);
  await app.register(inboxRoutes);

  return app;
}
