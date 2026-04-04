export interface AuthActor {
  id: string;
  kind: "human" | "agent";
}

export function getRequestActor(headers: Record<string, string | string[] | undefined>): AuthActor | null {
  const actorId = headers["x-actor-id"];
  const actorKind = headers["x-actor-kind"];

  if (typeof actorId !== "string" || typeof actorKind !== "string") {
    return null;
  }

  if (actorKind !== "human" && actorKind !== "agent") {
    return null;
  }

  return {
    id: actorId,
    kind: actorKind,
  };
}
