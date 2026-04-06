import type { FastifyPluginAsync } from "fastify";
import type { CollaboratorListResponse } from "@agent-kanban/contracts";

export const collaboratorRoutes: FastifyPluginAsync = async (app) => {
  app.get("/collaborators", async (): Promise<CollaboratorListResponse> => {
    const collaborators = await app.prisma.collaborator.findMany({
      orderBy: { id: "asc" },
    });

    return {
      collaborators: collaborators.map((c) => ({
        id: c.id,
        kind: c.kind === "agent" ? "agent" : "human",
        displayName: c.displayName,
      })),
    };
  });
};
