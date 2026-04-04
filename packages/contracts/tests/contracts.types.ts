import {
  CardState,
  InboxItemStatus,
} from "@agent-kanban/contracts";
import type {
  AddCommentRequest,
  AppendCardSummaryResponse,
  ClaimReadyCardRequest,
  ClaimReadyCardResponse,
  SetCardStateRequest,
  CardDetail,
} from "@agent-kanban/contracts";

const claimRequest = {
  cardId: "card-1",
  revision: 7,
  ownerId: "collaborator-1",
} satisfies ClaimReadyCardRequest;

const setCardStateRequest = {
  cardId: "card-1",
  revision: 7,
  to: CardState.InReview,
} satisfies SetCardStateRequest;

const addCommentRequest = {
  cardId: "card-1",
  body: "Working on it",
  kind: "progress",
} satisfies AddCommentRequest;

const appendSummaryResponse = {
  card: {
    id: "card-1",
    projectId: "project-1",
    title: "Example",
    state: CardState.Done,
    owner: {
      id: "collaborator-1",
      kind: "human",
      displayName: "Song",
    },
    priority: 1,
    revision: 8,
    updatedAt: "2026-04-04T00:00:00.000Z",
    descriptionMd: "# Example",
    summaryMd: "Finished",
    comments: [],
  },
} satisfies AppendCardSummaryResponse;

const claimResponse = {
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
} satisfies ClaimReadyCardResponse;

const validProgressReadCard = {
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
} satisfies CardDetail;

const validDoneReadCard = {
  id: "card-1",
  projectId: "project-1",
  title: "Example",
  state: CardState.Done,
  owner: {
    id: "collaborator-1",
    kind: "human",
    displayName: "Song",
  },
  priority: 1,
  revision: 8,
  updatedAt: "2026-04-04T00:00:00.000Z",
  descriptionMd: "# Example",
  summaryMd: "Finished",
  comments: [],
} satisfies CardDetail;

const invalidClaimAsStateMutation: SetCardStateRequest = {
  cardId: "card-1",
  revision: 7,
  // @ts-expect-error Ready -> In Progress must use the atomic claim contract.
  to: CardState.InProgress,
};

const impossibleSummaryResponse = {
  card: {
    id: "card-1",
    projectId: "project-1",
    title: "Example",
    state: CardState.Done,
    owner: {
      id: "collaborator-1",
      kind: "human",
      displayName: "Song",
    },
    priority: 1,
    revision: 8,
    updatedAt: "2026-04-04T00:00:00.000Z",
    descriptionMd: "# Example",
    // @ts-expect-error summary response must guarantee a string summary.
    summaryMd: null,
    comments: [],
  },
} satisfies AppendCardSummaryResponse;

const impossibleClaimResponse = {
  card: {
    id: "card-1",
    projectId: "project-1",
    title: "Example",
    // @ts-expect-error claim response must be In Progress.
    state: CardState.Ready,
    // @ts-expect-error claim response must have a non-null owner.
    owner: null,
    priority: 1,
    revision: 8,
    updatedAt: "2026-04-04T00:00:00.000Z",
    descriptionMd: "# Example",
    summaryMd: null,
    comments: [],
  },
} satisfies ClaimReadyCardResponse;

const impossibleProgressReadCard = {
  id: "card-1",
  projectId: "project-1",
  title: "Example",
  state: CardState.InProgress,
  owner: null,
  priority: 1,
  revision: 8,
  updatedAt: "2026-04-04T00:00:00.000Z",
  descriptionMd: "# Example",
  summaryMd: null,
  comments: [],
  // @ts-expect-error read model must require owner for In Progress.
} satisfies CardDetail;

const impossibleDoneReadCard = {
  id: "card-1",
  projectId: "project-1",
  title: "Example",
  state: CardState.Done,
  owner: null,
  priority: 1,
  revision: 8,
  updatedAt: "2026-04-04T00:00:00.000Z",
  descriptionMd: "# Example",
  summaryMd: null,
  comments: [],
  // @ts-expect-error read model must require a string summary for Done.
} satisfies CardDetail;

const inboxStatus = InboxItemStatus.Acknowledged;

void claimRequest;
void appendSummaryResponse;
void claimResponse;
void validProgressReadCard;
void validDoneReadCard;
void setCardStateRequest;
void addCommentRequest;
void invalidClaimAsStateMutation;
void impossibleSummaryResponse;
void impossibleClaimResponse;
void impossibleProgressReadCard;
void impossibleDoneReadCard;
void inboxStatus;
