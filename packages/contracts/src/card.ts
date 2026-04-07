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
  Verification: "verification",
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
  sourcePlanPath: string | null;
  sourceSpecPath: string | null;
  sourceTaskId: string | null;
  title: string;
  priority: number | null;
  revision: number;
  updatedAt: string;
}

interface CardReadNew extends CardReadBase {
  state: typeof CardState.New;
  owner: ActorRef | null;
  summaryMd: null;
}

interface CardReadReady extends CardReadBase {
  state: typeof CardState.Ready;
  owner: ActorRef | null;
  summaryMd: null;
}

interface CardReadInProgress extends CardReadBase {
  state: typeof CardState.InProgress;
  owner: ActorRef;
  summaryMd: string | null;
}

interface CardReadInReview extends CardReadBase {
  state: typeof CardState.InReview;
  owner: ActorRef;
  summaryMd: string | null;
}

interface CardReadDone extends CardReadBase {
  state: typeof CardState.Done;
  owner: ActorRef | null;
  summaryMd: string;
}

export type CardListItem =
  | CardReadNew
  | CardReadReady
  | CardReadInProgress
  | CardReadInReview
  | CardReadDone;

export type CardDetail = CardListItem & {
  descriptionMd: string;
  comments: CommentRecord[];
};

export type SummaryPresentCard =
  | (Extract<CardDetail, { state: typeof CardState.InProgress }> & { summaryMd: string })
  | (Extract<CardDetail, { state: typeof CardState.InReview }> & { summaryMd: string })
  | Extract<CardDetail, { state: typeof CardState.Done }>;

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

export interface BoardColumn<S extends CardStateValue = CardStateValue> {
  state: S;
  cards: Extract<CardListItem, { state: S }>[];
}

export type BoardColumns = {
  [S in CardStateValue]: BoardColumn<S>;
};

export interface BoardResponse {
  columns: BoardColumns;
}

export interface ProjectListResponse {
  projects: ProjectListItem[];
}

export interface CollaboratorListResponse {
  collaborators: ActorRef[];
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
  actorId?: string;
  sourcePlanPath?: string | null;
  sourceSpecPath?: string | null;
  sourceTaskFingerprint?: string | null;
  sourceTaskId?: string | null;
}

export interface CreateCardResponse {
  card: CardDetail;
}

export interface UpdateCardMarkdownRequest {
  cardId: string;
  revision: number;
  descriptionMd: string;
  actorId?: string;
}

export interface UpdateCardMarkdownResponse {
  card: CardDetail;
}

interface SetCardStateRequestBase {
  cardId: string;
  revision: number;
  actorId?: string;
}

export type SetCardStateRequest =
  | (SetCardStateRequestBase & {
      ownerId: string;
      to: typeof CardState.InProgress;
    })
  | (SetCardStateRequestBase & {
      ownerId?: string;
      to: NonClaimCardStateValue;
    });

export interface SetCardStateResponse {
  card: CardDetail;
}

export interface SetCardPriorityRequest {
  cardId: string;
  revision: number;
  priority: number | null;
  actorId?: string;
}

export interface SetCardPriorityResponse {
  card: CardDetail;
}

export interface AssignCardOwnerRequest {
  cardId: string;
  revision: number;
  ownerId: string | null;
  actorId?: string;
}

export interface AssignCardOwnerResponse {
  card: CardDetail;
}

export interface AppendCardSummaryRequest {
  cardId: string;
  revision: number;
  summaryMd: string;
  actorId?: string;
}

export interface AppendCardSummaryResponse {
  card: SummaryPresentCard;
}

export interface ImportPlanTaskItem {
  sourcePlanPath: string;
  sourceSpecPath?: string | null;
  sourceTaskFingerprint: string;
  sourceTaskId: string;
  title: string;
  descriptionMd: string;
  priority?: number | null;
}

export interface ImportPlanTasksRequest {
  actorId?: string;
  tasks: ImportPlanTaskItem[];
}

export interface ImportPlanTaskResult {
  cardId: string;
  sourceTaskId: string;
  outcome: "created" | "updated" | "unchanged" | "protected";
  state: CardStateValue;
}

export interface ImportPlanTasksResponse {
  results: ImportPlanTaskResult[];
}

export interface AddCommentRequest {
  cardId: string;
  authorId: string;
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
