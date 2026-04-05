import { defaultProjectPolicy } from "@agent-kanban/contracts";
import { describe, expect, it } from "vitest";
import { assertReadyPickupAllowed, canTransition, sortReadyCards } from "../src/index.js";

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

  it("requires required sections before Ready", () => {
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

  it("rejects agent readying a card without explicit human instruction", () => {
    expect(
      getErrorCode(() =>
        canTransition({
          from: "New",
          to: "Ready",
          actorKind: "agent",
          titlePresent: true,
          requiredSectionsPresent: true,
        })
      )
    ).toBe("forbidden_action");
  });

  it("allows agent readying a card with explicit human instruction", () => {
    expect(() =>
      canTransition({
        from: "New",
        to: "Ready",
        actorKind: "agent",
        titlePresent: true,
        requiredSectionsPresent: true,
        humanInstructionGranted: true,
      })
    ).not.toThrow();
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
          targetOwnerId: "agent-1",
          policy: defaultProjectPolicy,
        })
      )
    ).toBe("forbidden_action");
  });

  it("allows a valid claim from Ready to In Progress", () => {
    expect(() =>
      canTransition({
        from: "Ready",
        to: "In Progress",
        actorKind: "human",
        ownerId: null,
        targetOwnerId: "human-1",
      })
    ).not.toThrow();
  });

  it("requires summary before In Progress to Done", () => {
    expect(
      getErrorCode(() =>
        canTransition({
          from: "In Progress",
          to: "Done",
          actorKind: "human",
          actorId: "human-1",
          ownerId: "human-1",
          verificationPresent: true,
          summaryPresent: false,
        })
      )
    ).toBe("summary_required");
  });

  it("requires verification evidence before completion", () => {
    expect(
      getErrorCode(() =>
        canTransition({
          from: "In Progress",
          to: "Done",
          actorKind: "human",
          actorId: "human-1",
          ownerId: "human-1",
          summaryPresent: true,
          dodCheckPresent: true,
          verificationEvidencePresent: false,
        })
      )
    ).toBe("missing_required_section");
  });

  it("rejects completion without an owner", () => {
    expect(
      getErrorCode(() =>
        canTransition({
          from: "In Progress",
          to: "Done",
          actorKind: "human",
          ownerId: null,
          summaryPresent: true,
          dodCheckPresent: true,
          verificationEvidencePresent: true,
        })
      )
    ).toBe("missing_owner");
  });

  it("allows valid completion from In Progress to Done", () => {
    expect(() =>
      canTransition({
        from: "In Progress",
        to: "Done",
        actorKind: "agent",
        actorId: "agent-1",
        ownerId: "agent-1",
        summaryPresent: true,
        dodCheckPresent: true,
        verificationEvidencePresent: true,
      })
    ).not.toThrow();
  });

  it("policy helper rejects agent claim of another owner's card", () => {
    expect(
      getErrorCode(() =>
        assertReadyPickupAllowed({
          actorKind: "agent",
          actorId: "agent-1",
          currentOwnerId: "human-1",
          targetOwnerId: "human-1",
          policy: {
            ...defaultProjectPolicy,
            allowAgentPickUnassignedReady: true,
          },
        })
      )
    ).toBe("forbidden_action");
  });

  it("sorts Ready cards by priority then age then updated time", () => {
    const cards = sortReadyCards([
      {
        id: "card-3",
        projectId: "project-1",
        sourcePlanPath: null,
        sourceSpecPath: null,
        sourceTaskId: null,
        title: "Third",
        state: "Ready",
        owner: null,
        priority: 2,
        revision: 1,
        readyAt: "2026-04-05T00:00:03.000Z",
        updatedAt: "2026-04-05T00:00:03.000Z",
        summaryMd: null,
      },
      {
        id: "card-1",
        projectId: "project-1",
        sourcePlanPath: null,
        sourceSpecPath: null,
        sourceTaskId: null,
        title: "First",
        state: "Ready",
        owner: null,
        priority: 1,
        revision: 1,
        readyAt: "2026-04-05T00:00:01.000Z",
        updatedAt: "2026-04-05T00:00:05.000Z",
        summaryMd: null,
      },
      {
        id: "card-2",
        projectId: "project-1",
        sourcePlanPath: null,
        sourceSpecPath: null,
        sourceTaskId: null,
        title: "Second",
        state: "Ready",
        owner: null,
        priority: 1,
        revision: 1,
        readyAt: "2026-04-05T00:00:02.000Z",
        updatedAt: "2026-04-05T00:00:02.000Z",
        summaryMd: null,
      },
    ]);

    expect(cards.map((card) => card.id)).toEqual(["card-1", "card-2", "card-3"]);
  });
});
