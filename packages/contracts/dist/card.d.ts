import type { ContractError, ErrorResponse } from "./errors.js";
import type { ProjectPolicy } from "./policy.js";
export declare const CardState: {
    readonly New: "New";
    readonly Ready: "Ready";
    readonly InProgress: "In Progress";
    readonly InReview: "In Review";
    readonly Done: "Done";
};
export type CardStateValue = (typeof CardState)[keyof typeof CardState];
export type NonClaimCardStateValue = Exclude<CardStateValue, typeof CardState.InProgress>;
export declare const CommentKind: {
    readonly Progress: "progress";
    readonly Question: "question";
    readonly Decision: "decision";
    readonly Note: "note";
};
export type CommentKindValue = (typeof CommentKind)[keyof typeof CommentKind];
export declare const InboxItemStatus: {
    readonly Open: "open";
    readonly Acknowledged: "acknowledged";
    readonly Resolved: "resolved";
};
export type InboxItemStatusValue = (typeof InboxItemStatus)[keyof typeof InboxItemStatus];
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
interface CardReadInReview extends CardReadBase {
    state: typeof CardState.InReview;
    owner: ActorRef;
    summaryMd: null;
}
interface CardReadInReviewWithSummary extends CardReadBase {
    state: typeof CardState.InReview;
    owner: ActorRef;
    summaryMd: string;
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
export type CardListItem = CardReadNew | CardReadReady | CardReadInReview | CardReadInReviewWithSummary | CardReadInProgress | CardReadDone;
export type CardDetail = CardListItem & {
    descriptionMd: string;
    comments: CommentRecord[];
};
export type SummaryPresentCard = Extract<CardDetail, {
    state: typeof CardState.InReview;
    summaryMd: string;
}> | Extract<CardDetail, {
    state: typeof CardState.Done;
}>;
export type ClaimedCardDetail = Extract<CardDetail, {
    state: typeof CardState.InProgress;
}>;
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
    cards: Extract<CardListItem, {
        state: S;
    }>[];
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
export interface SetCardStateRequest {
    cardId: string;
    revision: number;
    to: NonClaimCardStateValue;
    actorId?: string;
}
export interface SetCardStateResponse {
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
export {};
//# sourceMappingURL=card.d.ts.map