import { defaultProjectPolicy, type DefaultSelectionPolicy } from "@agent-kanban/contracts";

export interface ReadyCardCandidate {
  id: string;
  priority: number | null;
  readyAt: string | number | Date;
  updatedAt: string | number | Date;
}

function toMillis(value: string | number | Date): number {
  if (value instanceof Date) {
    return value.getTime();
  }

  if (typeof value === "number") {
    return value;
  }

  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? Number.POSITIVE_INFINITY : parsed;
}

function comparePriority(left: number | null, right: number | null): number {
  if (left === right) {
    return 0;
  }

  if (left === null) {
    return 1;
  }

  if (right === null) {
    return -1;
  }

  return left - right;
}

export function sortReadyCards<T extends ReadyCardCandidate>(
  cards: readonly T[],
  policy: DefaultSelectionPolicy = defaultProjectPolicy.defaultSelectionPolicy
): T[] {
  if (policy !== "priority_then_ready_age_then_updated_at") {
    return [...cards];
  }

  return [...cards].sort((left, right) => {
    const byPriority = comparePriority(left.priority, right.priority);
    if (byPriority !== 0) {
      return byPriority;
    }

    const byReadyAt = toMillis(left.readyAt) - toMillis(right.readyAt);
    if (byReadyAt !== 0) {
      return byReadyAt;
    }

    const byUpdatedAt = toMillis(left.updatedAt) - toMillis(right.updatedAt);
    if (byUpdatedAt !== 0) {
      return byUpdatedAt;
    }

    return left.id.localeCompare(right.id);
  });
}
