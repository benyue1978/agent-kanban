import {
  CardState,
  InboxItemStatus,
} from "@agent-kanban/contracts";
import type {
  AddCommentRequest,
  ClaimReadyCardRequest,
  SetCardStateRequest,
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

const invalidClaimAsStateMutation: SetCardStateRequest = {
  cardId: "card-1",
  revision: 7,
  // @ts-expect-error Ready -> In Progress must use the atomic claim contract.
  to: CardState.InProgress,
};

const inboxStatus = InboxItemStatus.Acknowledged;

void claimRequest;
void setCardStateRequest;
void addCommentRequest;
void invalidClaimAsStateMutation;
void inboxStatus;
