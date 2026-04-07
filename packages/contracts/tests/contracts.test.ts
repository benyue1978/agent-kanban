import { describe, expect, expectTypeOf, it } from "vitest";
import {
  CardState,
  CommentKind,
  InboxItemStatus,
  defaultProjectPolicy,
  errorCodes,
} from "@agent-kanban/contracts";
import type {
  AddCommentRequest,
  AddCommentResponse,
  AssignCardOwnerRequest,
  AssignCardOwnerResponse,
  AppendCardSummaryRequest,
  AppendCardSummaryResponse,
  BoardResponse,
  CardDetail,
  CardListItem,
  CreateCardRequest,
  CreateCardResponse,
  ImportPlanTasksRequest,
  ImportPlanTasksResponse,
  ListCardsRequest,
  ListCardsResponse,
  ListInboxRequest,
  ListInboxResponse,
  ProjectCreateRequest,
  ProjectCreateResponse,
  ProjectListResponse,
  InboxItemStatusUpdateRequest,
  InboxItemStatusUpdateResponse,
  SetCardStateRequest,
  SetCardStateResponse,
  ShowCardRequest,
  ShowCardResponse,
  UpdateCardMarkdownRequest,
  UpdateCardMarkdownResponse,
} from "@agent-kanban/contracts";

describe("contracts", () => {
  it("exports the canonical workflow states", () => {
    expect(CardState.Done).toBe("Done");
    expect(CommentKind.Decision).toBe("decision");
    expect(CommentKind.Verification).toBe("verification");
    expect(InboxItemStatus.Resolved).toBe("resolved");
  });

  it("exports stable error codes", () => {
    expect(errorCodes).toContain("revision_conflict");
    expect(errorCodes).toContain("claim_conflict");
  });

  it("exports the documented default project policy", () => {
    expect(defaultProjectPolicy.allowAgentPickUnassignedReady).toBe(false);
  });

  it("exports project create and inbox status update contracts", () => {
    const projectCreateRequest: ProjectCreateRequest = {
      name: "agent-kanban",
      description: "AI-native Kanban for humans and agents",
      repoUrl: "https://example.com/repo.git",
      policy: {
        allowAgentPickUnassignedReady: false,
        defaultSelectionPolicy: "priority_then_ready_age_then_updated_at",
      },
    };
    const projectCreateResponse: ProjectCreateResponse = {
      project: {
        id: "project-1",
        name: "agent-kanban",
        description: "AI-native Kanban for humans and agents",
        repoUrl: "https://example.com/repo.git",
        policy: projectCreateRequest.policy,
      },
    };
    const inboxStatusUpdateRequest: InboxItemStatusUpdateRequest = {
      itemId: "inbox-item-1",
      status: InboxItemStatus.Acknowledged,
    };
    const inboxStatusUpdateResponse: InboxItemStatusUpdateResponse = {
      item: {
        id: "inbox-item-1",
        cardId: "card-1",
        commentId: "comment-1",
        status: InboxItemStatus.Acknowledged,
        createdAt: "2026-04-04T00:00:00.000Z",
      },
    };

    expect(projectCreateRequest.repoUrl).toBe("https://example.com/repo.git");
    expect(projectCreateResponse.project.name).toBe("agent-kanban");
    expect(inboxStatusUpdateRequest.status).toBe(InboxItemStatus.Acknowledged);
    expect(inboxStatusUpdateResponse.item.status).toBe(InboxItemStatus.Acknowledged);
  });

  it("exports shared request and response interfaces", () => {
    const listCardsRequest: ListCardsRequest = {
      projectId: "project-1",
      state: CardState.Ready,
    };
    const listCardsResponse: ListCardsResponse = {
      cards: [] as CardListItem[],
    };
    const showCardRequest: ShowCardRequest = { cardId: "card-1" };
    const showCardResponse: ShowCardResponse = {
      card: {
        id: "card-1",
        projectId: "project-1",
        sourcePlanPath: null,
        sourceSpecPath: null,
        sourceTaskId: null,
        title: "Example",
        state: CardState.New,
        owner: null,
        priority: null,
        revision: 1,
        updatedAt: "2026-04-04T00:00:00.000Z",
        descriptionMd: "# Example",
        summaryMd: null,
        comments: [],
      } satisfies CardDetail,
    };
    const createCardRequest: CreateCardRequest = {
      projectId: "project-1",
      title: "Example",
      descriptionMd: "# Example",
      actorId: "collaborator-1",
      sourceTaskId: "task-1",
    };
    const createCardResponse: CreateCardResponse = showCardResponse;
    const updateCardMarkdownRequest: UpdateCardMarkdownRequest = {
      cardId: "card-1",
      revision: 1,
      descriptionMd: "# Updated",
      actorId: "collaborator-1",
    };
    const updateCardMarkdownResponse: UpdateCardMarkdownResponse = showCardResponse;
    const setCardStateRequest: SetCardStateRequest = {
      cardId: "card-1",
      revision: 1,
      to: CardState.Ready,
      actorId: "collaborator-1",
    };
    const inProgressStateRequest: SetCardStateRequest = {
      cardId: "card-1",
      revision: 1,
      to: CardState.InProgress,
      ownerId: "collaborator-1",
      actorId: "collaborator-1",
    };
    const setCardStateResponse: SetCardStateResponse = showCardResponse;
    const assignCardOwnerRequest: AssignCardOwnerRequest = {
      cardId: "card-1",
      revision: 1,
      ownerId: "collaborator-1",
      actorId: "collaborator-1",
    };
    const assignCardOwnerResponse: AssignCardOwnerResponse = showCardResponse;
    const appendCardSummaryRequest: AppendCardSummaryRequest = {
      cardId: "card-1",
      revision: 1,
      summaryMd: "Done",
      actorId: "collaborator-1",
    };
    const appendCardSummaryResponse: AppendCardSummaryResponse = {
      card: {
        ...showCardResponse.card,
        state: CardState.InProgress,
        owner: {
          id: "collaborator-1",
          kind: "human",
          displayName: "Song",
        },
        summaryMd: "Done",
      },
    };
    const addCommentRequest: AddCommentRequest = {
      cardId: "card-1",
      authorId: "collaborator-1",
      body: "Working on it",
      kind: CommentKind.Verification,
    };
    const addCommentResponse: AddCommentResponse = {
      comment: {
        id: "comment-1",
        cardId: "card-1",
        authorId: "collaborator-1",
        body: "Working on it",
        kind: CommentKind.Progress,
        mentions: [],
        createdAt: "2026-04-04T00:00:00.000Z",
      },
    };
    const listInboxRequest: ListInboxRequest = {
      collaboratorId: "collaborator-1",
      status: InboxItemStatus.Open,
    };
    const listInboxResponse: ListInboxResponse = {
      items: [
        {
          id: "inbox-1",
          cardId: "card-1",
          commentId: "comment-1",
          status: InboxItemStatus.Open,
          createdAt: "2026-04-04T00:00:00.000Z",
        },
      ],
    };
    const boardResponse: BoardResponse = {
      columns: {
        [CardState.New]: {
          state: CardState.New,
          cards: [showCardResponse.card],
        },
        [CardState.Ready]: {
          state: CardState.Ready,
          cards: [],
        },
        [CardState.InProgress]: {
          state: CardState.InProgress,
          cards: [],
        },
        [CardState.InReview]: {
          state: CardState.InReview,
          cards: [],
        },
        [CardState.Done]: {
          state: CardState.Done,
          cards: [],
        },
      },
    };
    const importPlanRequest: ImportPlanTasksRequest = {
      actorId: "collaborator-1",
      tasks: [
        {
          sourcePlanPath: "docs/superpowers/plans/example.md",
          sourceSpecPath: "docs/superpowers/specs/example.md",
          sourceTaskFingerprint: "abc123",
          sourceTaskId: "task-1",
          title: "Implement importer",
          descriptionMd: "# Implement importer",
        },
      ],
    };
    const importPlanResponse: ImportPlanTasksResponse = {
      results: [
        {
          cardId: "card-1",
          sourceTaskId: "task-1",
          outcome: "created",
          state: CardState.New,
        },
      ],
    };
    const projectListResponse: ProjectListResponse = {
      projects: [
        {
          id: "project-1",
          name: "agent-kanban",
          repoUrl: "https://example.com/repo.git",
          countsByState: {
            [CardState.New]: 1,
            [CardState.Ready]: 0,
            [CardState.InProgress]: 0,
            [CardState.InReview]: 0,
            [CardState.Done]: 0,
          },
        },
      ],
    };

    expect(listCardsRequest.projectId).toBe("project-1");
    expect(listCardsResponse.cards).toHaveLength(0);
    expect(showCardRequest.cardId).toBe("card-1");
    expect(showCardResponse.card.title).toBe("Example");
    expect(createCardRequest.title).toBe("Example");
    expect(createCardResponse.card.id).toBe("card-1");
    expect(updateCardMarkdownRequest.revision).toBe(1);
    expect(updateCardMarkdownResponse.card.descriptionMd).toBe("# Example");
    expect(setCardStateRequest.to).toBe(CardState.Ready);
    expect(inProgressStateRequest.ownerId).toBe("collaborator-1");
    expect(setCardStateResponse.card.state).toBe(CardState.New);
    expect(assignCardOwnerRequest.ownerId).toBe("collaborator-1");
    expect(assignCardOwnerResponse.card.owner).toBeNull();
    expect(appendCardSummaryRequest.summaryMd).toBe("Done");
    expect(appendCardSummaryResponse.card.summaryMd).toBe("Done");
    expect(appendCardSummaryResponse.card.state).toBe(CardState.InProgress);
    expect(addCommentRequest.kind).toBe(CommentKind.Verification);
    expect(addCommentResponse.comment.body).toBe("Working on it");
    expect(listInboxRequest.status).toBe(InboxItemStatus.Open);
    expect(listInboxResponse.items).toHaveLength(1);
    expect(boardResponse.columns[CardState.New].cards).toHaveLength(1);
    expect(projectListResponse.projects[0]?.countsByState[CardState.New]).toBe(1);
    expect(importPlanRequest.tasks).toHaveLength(1);
    expect(importPlanResponse.results[0]?.outcome).toBe("created");

    expectTypeOf(listCardsResponse).toMatchTypeOf<ListCardsResponse>();
    expectTypeOf<AddCommentRequest>().not.toHaveProperty("mentions");
  });

  it("resolves package and subpath exports at runtime", async () => {
    const root = await import("@agent-kanban/contracts");
    const card = await import("@agent-kanban/contracts/card");

    expect(root.CardState.Done).toBe("Done");
    expect(card.CommentKind.Note).toBe("note");
  });
});
