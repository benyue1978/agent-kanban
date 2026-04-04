import type { AddCommentResponse, AppendCardSummaryResponse, AssignCardOwnerResponse, BoardResponse, CardDetail, CreateCardResponse, ErrorResponse, SetCardStateResponse, ShowCardResponse, UpdateCardMarkdownResponse } from "@agent-kanban/contracts";
export declare class CliApiError extends Error {
    readonly statusCode: number;
    readonly responseBody: unknown;
    constructor(message: string, statusCode: number, responseBody: unknown);
}
export declare class ApiClient {
    private readonly baseUrl;
    constructor(baseUrl: string);
    private request;
    getBoard(projectId: string): Promise<BoardResponse>;
    getCard(cardId: string): Promise<ShowCardResponse>;
    createCard(body: Record<string, unknown>): Promise<CreateCardResponse>;
    assignOwner(cardId: string, body: Record<string, unknown>): Promise<AssignCardOwnerResponse>;
    setState(cardId: string, body: Record<string, unknown>): Promise<SetCardStateResponse>;
    updateMarkdown(cardId: string, body: Record<string, unknown>): Promise<UpdateCardMarkdownResponse>;
    appendSummary(cardId: string, body: Record<string, unknown>): Promise<AppendCardSummaryResponse>;
    addComment(cardId: string, body: Record<string, unknown>): Promise<AddCommentResponse>;
}
export declare function asErrorResponse(error: unknown): ErrorResponse;
export declare function getCardRevision(card: CardDetail): number;
//# sourceMappingURL=client.d.ts.map