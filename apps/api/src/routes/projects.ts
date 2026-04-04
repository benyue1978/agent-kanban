import type { FastifyPluginAsync } from "fastify";
import { CardService } from "../services/card-service.js";

export const projectRoutes: FastifyPluginAsync = async (app) => {
  const service = new CardService(app.prisma);

  app.post("/projects", async (request, reply) => {
    const project = await service.createProject(request.body as Record<string, unknown>);
    return reply.code(201).send({ project });
  });

  app.get("/projects/:id/board", async (request) => {
    const params = request.params as { id: string };
    return service.getBoard(params.id);
  });
};
