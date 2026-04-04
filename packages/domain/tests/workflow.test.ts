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
          actorId: "human-1",
          reviewGatePassed: true,
          summaryPresent: false,
          ownerId: "collaborator-1",
        })
      )
    ).toBe("summary_required");
  });

  it("rejects omitted summary presence before In Review to Done", () => {
    expect(
      getErrorCode(() =>
        canTransition({
          from: "In Review",
          to: "Done",
          actorKind: "human",
          actorId: "human-1",
          reviewGatePassed: true,
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
          actorId: "human-1",
          reviewGatePassed: false,
          summaryPresent: true,
          ownerId: "collaborator-1",
        })
      )
    ).toBe("review_gate_not_passed");
  });

  it("rejects omitted review gate presence before In Review to Done", () => {
    expect(
      getErrorCode(() =>
        canTransition({
          from: "In Review",
          to: "Done",
          actorKind: "human",
          actorId: "human-1",
          summaryPresent: true,
          ownerId: "collaborator-1",
        })
      )
    ).toBe("review_gate_not_passed");
  });

  it("rejects agent reopen when policy forbids agent review", () => {
    expect(
      getErrorCode(() =>
        canTransition({
          from: "In Review",
          to: "In Progress",
          actorKind: "agent",
          actorId: "agent-1",
          ownerId: "collaborator-1",
          reviewRationalePresent: true,
          policy: {
            ...defaultProjectPolicy,
            allowAgentReview: false,
          },
        })
      )
    ).toBe("forbidden_action");
  });

  it("rejects forbidden review completion before missing summary", () => {
    expect(
      getErrorCode(() =>
        canTransition({
          from: "In Review",
          to: "Done",
          actorKind: "agent",
          actorId: "agent-1",
          ownerId: "collaborator-1",
          policy: {
            ...defaultProjectPolicy,
            allowAgentReview: false,
          },
        })
      )
    ).toBe("forbidden_action");
  });

  it("rejects forbidden reopen before missing rationale", () => {
    expect(
      getErrorCode(() =>
        canTransition({
          from: "In Review",
          to: "In Progress",
          actorKind: "agent",
          actorId: "agent-1",
          ownerId: "collaborator-1",
          policy: {
            ...defaultProjectPolicy,
            allowAgentReview: false,
          },
        })
      )
    ).toBe("forbidden_action");
  });

  it("rejects missing actor identity on review to done transitions", () => {
    expect(
      getErrorCode(() =>
        canTransition({
          from: "In Review",
          to: "Done",
          actorKind: "agent",
          ownerId: "collaborator-1",
          reviewGatePassed: true,
          summaryPresent: true,
        })
      )
    ).toBe("forbidden_action");
  });

  it("rejects missing actor identity on review reopen transitions", () => {
    expect(
      getErrorCode(() =>
        canTransition({
          from: "In Review",
          to: "In Progress",
          actorKind: "agent",
          ownerId: "collaborator-1",
          reviewRationalePresent: true,
        })
      )
    ).toBe("forbidden_action");
  });

  it("rejects omitted review rationale after authorization passes", () => {
    expect(
      getErrorCode(() =>
        canTransition({
          from: "In Review",
          to: "In Progress",
          actorKind: "human",
          actorId: "human-1",
          ownerId: "collaborator-1",
        })
      )
    ).toBe("missing_required_section");
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

  it("rejects an agent starting a card already assigned to someone else", () => {
    expect(
      getErrorCode(() =>
        canTransition({
          from: "Ready",
          to: "In Progress",
          actorKind: "agent",
          actorId: "agent-1",
          ownerId: "human-1",
          policy: {
            ...defaultProjectPolicy,
            allowAgentPickUnassignedReady: true,
          },
        })
      )
    ).toBe("forbidden_action");
  });

  it("rejects omitted required sections before Ready", () => {
    expect(
      getErrorCode(() =>
        canTransition({
          from: "New",
          to: "Ready",
          actorKind: "human",
        })
      )
    ).toBe("missing_required_section");
  });

  it("allows a valid claim from Ready to In Progress", () => {
    expect(() =>
      canTransition({
        from: "Ready",
        to: "In Progress",
        actorKind: "agent",
        actorId: "agent-1",
        ownerId: null,
        policy: {
          ...defaultProjectPolicy,
          allowAgentPickUnassignedReady: true,
        },
      })
    ).not.toThrow();
  });

  it("allows a valid review completion", () => {
    expect(() =>
      canTransition({
        from: "In Review",
        to: "Done",
        actorKind: "human",
        actorId: "human-1",
        ownerId: "collaborator-1",
        reviewGatePassed: true,
        summaryPresent: true,
      })
    ).not.toThrow();
  });

  it("allows a valid reopen from In Review to In Progress", () => {
    expect(() =>
      canTransition({
        from: "In Review",
        to: "In Progress",
        actorKind: "human",
        actorId: "human-1",
        ownerId: "collaborator-1",
        reviewRationalePresent: true,
      })
    ).not.toThrow();
  });

  it("rejects self-review when allowSelfReview is false", () => {
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
          policy: {
            ...defaultProjectPolicy,
            allowAgentReview: true,
            allowSelfReview: false,
          },
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
