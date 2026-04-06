import type { FastifyPluginAsync } from "fastify";
import { eventBus } from "../lib/event-bus.js";

export const eventRoutes: FastifyPluginAsync = async (app) => {
  app.get("/events", async (request, reply) => {
    const projectId = (request.query as { projectId?: string }).projectId;

    reply.raw.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "Access-Control-Allow-Origin": "*", // Support cross-origin if needed
    });

    const onEvent = (payload: any) => {
      if (projectId && payload.projectId !== projectId) {
        return;
      }

      reply.raw.write(`data: ${JSON.stringify(payload)}\n\n`);
    };

    const cleanup = eventBus.onEvent(onEvent);

    request.raw.on("close", () => {
      cleanup();
    });

    // Send initial ping to keep connection open
    reply.raw.write(": ping\n\n");
  });
};
