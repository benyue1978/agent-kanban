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
export type CardDetailWithSummary = Omit<CardDetail, "summaryMd"> & {
    summaryMd: string;
};
export type ClaimedCardDetail = Omit<CardDetail, "state" | "owner"> & {
    state: typeof CardState.InProgress;
    owner: ActorRef;
};
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
//# sourceMappingURL=card.d.ts.map