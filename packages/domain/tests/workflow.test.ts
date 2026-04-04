import { defaultProjectPolicy } from "@agent-kanban/contracts";
import { describe, expect, it } from "vitest";
import { canTransition, sortReadyCards } from "../src/index.js";

function getErrorCode(thunk: () => void): string {
  try {
    thunk();
  } catch (error) {
    if (error && typeof error === "object" && "code" in error) {
      return String((error as { code: unknown }).code);
    }
    throw error;
  }

  throw new Error("expected function to throw");
}

describe("workflow", () => {
  it("rejects Ready to Done", () => {
    expect(
      getErrorCode(() =>
        canTransition({
          from: "Ready",
          to: "Done",
          actorKind: "human",
        })
      )
    ).toBe("invalid_transition");
  });

  it("requires a summary before In Review to Done", () => {
    expect(
      getErrorCode(() =>
        canTransition({
          from: "In Review",
          to: "Done",
          actorKind: "human",
          reviewGatePassed: true,
          summaryPresent: false,
          ownerId: "collaborator-1",
        })
      )
    ).toBe("summary_required");
  });

  it("requires the review gate before In Review to Done", () => {
    expect(
      getErrorCode(() =>
        canTransition({
          from: "In Review",
          to: "Done",
          actorKind: "human",
          reviewGatePassed: false,
          summaryPresent: true,
          ownerId: "collaborator-1",
        })
      )
    ).toBe("review_gate_not_passed");
  });

  it("rejects agent pickup of an unassigned Ready card when policy forbids it", () => {
    expect(
      getErrorCode(() =>
        canTransition({
          from: "Ready",
          to: "In Progress",
          actorKind: "agent",
          actorId: "agent-1",
          ownerId: null,
          policy: defaultProjectPolicy,
        })
      )
    ).toBe("forbidden_action");
  });

  it("rejects self-review when policy forbids it", () => {
    expect(
      getErrorCode(() =>
        canTransition({
          from: "In Review",
          to: "Done",
          actorKind: "agent",
          actorId: "agent-1",
          ownerId: "agent-1",
          reviewGatePassed: true,
          summaryPresent: true,
          policy: defaultProjectPolicy,
        })
      )
    ).toBe("forbidden_action");
  });

  it("sorts Ready cards by priority then age then updated time", () => {
    const result = sortReadyCards([
      { id: "b", priority: 2, readyAt: 2, updatedAt: 20 },
      { id: "a", priority: 1, readyAt: 1, updatedAt: 10 },
    ]);

    expect(result[0]?.id).toBe("b");
  });
});
