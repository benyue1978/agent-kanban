import type { FastifyPluginAsync } from "fastify";
import type {
  InboxItemStatusUpdateRequest,
  ListInboxRequest,
} from "@agent-kanban/contracts";
import { InboxService } from "../services/inbox-service.js";

export const inboxRoutes: FastifyPluginAsync = async (app) => {
  const service = new InboxService(app.prisma);

  app.get("/inbox", async (request) => {
    const query = request.query as ListInboxRequest;
    return {
      items: await service.listInbox(query.collaboratorId, query.status),
    };
  });

  app.post("/inbox/items/:id/set-status", async (request) => {
    const params = request.params as { id: string };
    const body = request.body as Omit<InboxItemStatusUpdateRequest, "itemId">;
    return {
      item: await service.updateStatus(params.id, body.status),
    };
  });
};
