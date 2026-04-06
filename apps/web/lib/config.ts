export const humanActorConfigurationMessage =
  "Set KANBAN_HUMAN_ACTOR_ID to enable browser review actions.";

export function getHumanActorId(): string | null {
  const actorId = process.env.KANBAN_HUMAN_ACTOR_ID?.trim();
  return actorId === undefined || actorId.length === 0 ? null : actorId;
}

export function getApiBaseUrl(): string {
  return process.env.KANBAN_API_URL ?? "http://127.0.0.1:3101";
}
