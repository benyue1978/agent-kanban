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
  ClaimReadyCardRequest,
  ClaimReadyCardResponse,
  CreateCardRequest,
  CreateCardResponse,
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
    expect(InboxItemStatus.Resolved).toBe("resolved");
  });

  it("exports stable error codes", () => {
    expect(errorCodes).toContain("revision_conflict");
    expect(errorCodes).toContain("claim_conflict");
  });

  it("exports the documented default project policy", () => {
    expect(defaultProjectPolicy.allowAgentReview).toBe(false);
  });

  it("exports project create and inbox status update contracts", () => {
    const projectCreateRequest: ProjectCreateRequest = {
      name: "agent-kanban",
      description: "AI-native Kanban for humans and agents",
      repoUrl: "https://example.com/repo.git",
      policy: {
        allowAgentReview: false,
        allowSelfReview: false,
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

  it("exports the atomic claim contract", () => {
    const claimRequest: ClaimReadyCardRequest = {
      cardId: "card-1",
      revision: 7,
      ownerId: "collaborator-1",
    };
    const claimResponse: ClaimReadyCardResponse = {
      card: {
        id: "card-1",
        projectId: "project-1",
        title: "Example",
        state: CardState.InProgress,
        owner: {
          id: "collaborator-1",
          kind: "human",
          displayName: "Song",
        },
        priority: 1,
        revision: 8,
        updatedAt: "2026-04-04T00:00:00.000Z",
        descriptionMd: "# Example",
        summaryMd: null,
        comments: [],
      },
    };

    expect(claimRequest.ownerId).toBe("collaborator-1");
    expect(claimResponse.card.state).toBe(CardState.InProgress);
    expect(claimResponse.card.owner?.id).toBe("collaborator-1");
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
    };
    const createCardResponse: CreateCardResponse = showCardResponse;
    const updateCardMarkdownRequest: UpdateCardMarkdownRequest = {
      cardId: "card-1",
      revision: 1,
      descriptionMd: "# Updated",
    };
    const updateCardMarkdownResponse: UpdateCardMarkdownResponse = showCardResponse;
    const setCardStateRequest: SetCardStateRequest = {
      cardId: "card-1",
      revision: 1,
      to: CardState.Ready,
    };
    const setCardStateResponse: SetCardStateResponse = showCardResponse;
    const assignCardOwnerRequest: AssignCardOwnerRequest = {
      cardId: "card-1",
      revision: 1,
      ownerId: "collaborator-1",
    };
    const assignCardOwnerResponse: AssignCardOwnerResponse = showCardResponse;
    const appendCardSummaryRequest: AppendCardSummaryRequest = {
      cardId: "card-1",
      revision: 1,
      summaryMd: "Done",
    };
    const appendCardSummaryResponse: AppendCardSummaryResponse = showCardResponse;
    const addCommentRequest: AddCommentRequest = {
      cardId: "card-1",
      body: "Working on it",
      kind: CommentKind.Progress,
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
      columns: [
        {
          state: CardState.New,
          cards: [showCardResponse.card],
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
    expect(setCardStateResponse.card.state).toBe(CardState.New);
    expect(assignCardOwnerRequest.ownerId).toBe("collaborator-1");
    expect(assignCardOwnerResponse.card.owner).toBeNull();
    expect(appendCardSummaryRequest.summaryMd).toBe("Done");
    expect(appendCardSummaryResponse.card.summaryMd).toBeNull();
    expect(addCommentRequest.kind).toBe(CommentKind.Progress);
    expect(addCommentResponse.comment.body).toBe("Working on it");
    expect(listInboxRequest.status).toBe(InboxItemStatus.Open);
    expect(listInboxResponse.items).toHaveLength(1);
    expect(boardResponse.columns[0]?.cards).toHaveLength(1);
    expect(projectListResponse.projects[0]?.countsByState[CardState.New]).toBe(1);

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
