import type { FastifyPluginAsync } from "fastify";
import { CardService } from "../services/card-service.js";

export const cardRoutes: FastifyPluginAsync = async (app) => {
  const service = new CardService(app.prisma);

  app.get("/cards/:id", async (request) => {
    const params = request.params as { id: string };
    return { card: await service.getCard(params.id) };
  });

  app.post("/cards", async (request, reply) => {
    const card = await service.createCard(request.body as never);
    return reply.code(201).send({ card });
  });

  app.post("/cards/:id/assign-owner", async (request) => {
    const params = request.params as { id: string };
    const body = request.body as { ownerId: string | null; revision: number };
    return { card: await service.assignOwner(params.id, body.revision, body.ownerId) };
  });

  app.post("/cards/:id/set-state", async (request) => {
    const params = request.params as { id: string };
    const body = request.body as { ownerId?: string; revision?: number; to: string };
    return { card: await service.setState(params.id, body) };
  });

  app.post("/cards/:id/update-markdown", async (request) => {
    const params = request.params as { id: string };
    const body = request.body as { descriptionMd: string; revision: number };
    return {
      card: await service.updateMarkdown(params.id, body.revision, body.descriptionMd),
    };
  });

  app.post("/cards/:id/append-summary", async (request) => {
    const params = request.params as { id: string };
    const body = request.body as { revision: number; summaryMd: string };
    return {
      card: await service.appendSummary(params.id, body.revision, body.summaryMd),
    };
  });
};
