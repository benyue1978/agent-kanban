import type { ContractError, ErrorResponse } from "./errors";

export const CardState = {
  New: "New",
  Ready: "Ready",
  InProgress: "In Progress",
  InReview: "In Review",
  Done: "Done",
} as const;

export type CardStateValue = (typeof CardState)[keyof typeof CardState];

export const CommentKind = {
  Progress: "progress",
  Question: "question",
  Decision: "decision",
  Note: "note",
} as const;

export type CommentKindValue = (typeof CommentKind)[keyof typeof CommentKind];

export const InboxItemStatus = {
  Open: "open",
  Acknowledged: "acknowledged",
  Resolved: "resolved",
} as const;

export type InboxItemStatusValue =
  (typeof InboxItemStatus)[keyof typeof InboxItemStatus];

export interface ActorRef {
  id: string;
  kind: "human" | "agent";
  displayName: string | null;
}

export interface CardListItem {
  id: string;
  projectId: string;
  title: string;
  state: CardStateValue;
  owner: ActorRef | null;
  priority: number | null;
  revision: number;
  updatedAt: string;
}

export interface CommentRecord {
  id: string;
  cardId: string;
  authorId: string;
  body: string;
  kind: CommentKindValue;
  mentions: string[];
  createdAt: string;
}

export interface InboxItem {
  id: string;
  cardId: string;
  commentId: string;
  status: InboxItemStatusValue;
  createdAt: string;
}

export interface CardDetail extends CardListItem {
  descriptionMd: string;
  summaryMd: string | null;
  comments: CommentRecord[];
}

export interface ProjectListItem {
  id: string;
  name: string;
  repoUrl: string;
  countsByState: Record<CardStateValue, number>;
}

export interface BoardColumn {
  state: CardStateValue;
  cards: CardListItem[];
}

export interface BoardResponse {
  columns: BoardColumn[];
}

export interface ProjectListResponse {
  projects: ProjectListItem[];
}

export interface ListCardsRequest {
  projectId: string;
  state?: CardStateValue;
  ownerId?: string;
}

export interface ListCardsResponse {
  cards: CardListItem[];
}

export interface ShowCardRequest {
  cardId: string;
}

export interface ShowCardResponse {
  card: CardDetail;
}

export interface CreateCardRequest {
  projectId: string;
  title: string;
  descriptionMd: string;
  priority?: number | null;
}

export interface CreateCardResponse {
  card: CardDetail;
}

export interface UpdateCardMarkdownRequest {
  cardId: string;
  revision: number;
  descriptionMd: string;
}

export interface UpdateCardMarkdownResponse {
  card: CardDetail;
}

export interface SetCardStateRequest {
  cardId: string;
  revision: number;
  to: CardStateValue;
}

export interface SetCardStateResponse {
  card: CardDetail;
}

export interface AssignCardOwnerRequest {
  cardId: string;
  revision: number;
  ownerId: string | null;
}

export interface AssignCardOwnerResponse {
  card: CardDetail;
}

export interface AppendCardSummaryRequest {
  cardId: string;
  revision: number;
  summaryMd: string;
}

export interface AppendCardSummaryResponse {
  card: CardDetail;
}

export interface AddCommentRequest {
  cardId: string;
  body: string;
  kind: CommentKindValue;
  mentions?: string[];
}

export interface AddCommentResponse {
  comment: CommentRecord;
}

export interface ListInboxRequest {
  collaboratorId: string;
  status?: InboxItemStatusValue;
}

export interface ListInboxResponse {
  items: InboxItem[];
}

export interface ApiErrorResponse extends ErrorResponse {
  error: ContractError;
}
