import type { ContractError, ErrorResponse } from "./errors.js";
import type { ProjectPolicy } from "./policy.js";

export const CardState = {
  New: "New",
  Ready: "Ready",
  InProgress: "In Progress",
  InReview: "In Review",
  Done: "Done",
} as const;

export type CardStateValue = (typeof CardState)[keyof typeof CardState];
export type NonClaimCardStateValue = Exclude<
  CardStateValue,
  typeof CardState.InProgress
>;

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

interface CardReadBase {
  id: string;
  projectId: string;
  title: string;
  priority: number | null;
  revision: number;
  updatedAt: string;
}

interface CardReadNewReady extends CardReadBase {
  state: typeof CardState.New | typeof CardState.Ready;
  owner: ActorRef | null;
  summaryMd: null;
}

interface CardReadInReview extends CardReadBase {
  state: typeof CardState.InReview;
  owner: ActorRef;
  summaryMd: null;
}

interface CardReadInProgress extends CardReadBase {
  state: typeof CardState.InProgress;
  owner: ActorRef;
  summaryMd: null;
}

interface CardReadDone extends CardReadBase {
  state: typeof CardState.Done;
  owner: ActorRef | null;
  summaryMd: string;
}

export type CardListItem =
  | CardReadNewReady
  | CardReadInReview
  | CardReadInProgress
  | CardReadDone;

export type CardDetail = CardListItem & {
  descriptionMd: string;
  comments: CommentRecord[];
};

export type CardDetailWithSummary = Extract<CardDetail, { state: typeof CardState.Done }>;

export type ClaimedCardDetail = Extract<CardDetail, { state: typeof CardState.InProgress }>;

export interface ProjectListItem {
  id: string;
  name: string;
  repoUrl: string;
  countsByState: Record<CardStateValue, number>;
}

export interface ProjectDetail {
  id: string;
  name: string;
  description: string | null;
  repoUrl: string;
  policy: ProjectPolicy;
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

export interface ProjectCreateRequest {
  name: string;
  description: string | null;
  repoUrl: string;
  policy: ProjectPolicy;
}

export interface ProjectCreateResponse {
  project: ProjectDetail;
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
  to: NonClaimCardStateValue;
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
  card: CardDetailWithSummary;
}

export interface AddCommentRequest {
  cardId: string;
  body: string;
  kind: CommentKindValue;
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

export interface InboxItemStatusUpdateRequest {
  itemId: string;
  status: InboxItemStatusValue;
}

export interface InboxItemStatusUpdateResponse {
  item: InboxItem;
}

export interface ClaimReadyCardRequest {
  cardId: string;
  revision: number;
  ownerId: string;
}

export interface ClaimReadyCardResponse {
  card: ClaimedCardDetail;
}

export interface ApiErrorResponse extends ErrorResponse {
  error: ContractError;
}
