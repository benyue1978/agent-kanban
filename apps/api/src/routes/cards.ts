import type { FastifyPluginAsync } from "fastify";
import type {
  AddCommentRequest,
  AppendCardSummaryRequest,
  AssignCardOwnerRequest,
  SetCardPriorityRequest,
  SetCardStateRequest,
  UpdateCardMarkdownRequest,
} from "@agent-kanban/contracts";
import { CardService } from "../services/card-service.js";
import { CommentService } from "../services/comment-service.js";

export const cardRoutes: FastifyPluginAsync = async (app) => {
  const service = new CardService(app.prisma);
  const comments = new CommentService(app.prisma);

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
    const body = request.body as Omit<AssignCardOwnerRequest, "cardId">;
    return {
      card: await service.assignOwner(params.id, body.revision, body.ownerId, body.actorId),
    };
  });

  app.post("/cards/:id/set-state", async (request) => {
    const params = request.params as { id: string };
    const body = request.body as Omit<SetCardStateRequest, "cardId"> & { ownerId?: string };
    return { card: await service.setState(params.id, body) };
  });

  app.post("/cards/:id/set-priority", async (request) => {
    const params = request.params as { id: string };
    const body = request.body as Omit<SetCardPriorityRequest, "cardId">;
    return {
      card: await service.setPriority(params.id, body.revision, body.priority, body.actorId),
    };
  });

  app.post("/cards/:id/update-markdown", async (request) => {
    const params = request.params as { id: string };
    const body = request.body as Omit<UpdateCardMarkdownRequest, "cardId">;
    return {
      card: await service.updateMarkdown(params.id, body.revision, body.descriptionMd, body.actorId),
    };
  });

  app.post("/cards/:id/append-summary", async (request) => {
    const params = request.params as { id: string };
    const body = request.body as Omit<AppendCardSummaryRequest, "cardId">;
    return {
      card: await service.appendSummary(params.id, body.revision, body.summaryMd, body.actorId, body.replace),
    };
  });

  app.post("/cards/:id/comments", async (request, reply) => {
    const params = request.params as { id: string };
    const body = request.body as Omit<AddCommentRequest, "cardId">;
    return reply.code(201).send({
      comment: await comments.addComment(params.id, body),
    });
  });
};
