import Fastify, { type FastifyInstance } from "fastify";

export async function buildApp(): Promise<FastifyInstance> {
  const app = Fastify();

  app.get("/health", async () => ({ ok: true }));

  return app;
}
