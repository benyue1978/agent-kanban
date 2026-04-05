import type {
  AddCommentResponse,
  AppendCardSummaryResponse,
  AssignCardOwnerResponse,
  BoardResponse,
  CardDetail,
  CreateCardResponse,
  ErrorResponse,
  ImportPlanTasksResponse,
  SetCardStateResponse,
  ShowCardResponse,
  UpdateCardMarkdownResponse,
} from "@agent-kanban/contracts";

export class CliApiError extends Error {
  constructor(
    message: string,
    readonly statusCode: number,
    readonly responseBody: unknown
  ) {
    super(message);
    this.name = "CliApiError";
  }
}

async function parseResponseBody(response: Response): Promise<unknown> {
  const text = await response.text();

  if (text.length === 0) {
    return null;
  }

  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

export class ApiClient {
  constructor(private readonly baseUrl: string) {}

  private async request<T>(
    path: string,
    init: {
      body?: unknown;
      method?: "GET" | "POST";
    } = {}
  ): Promise<T> {
    const requestBody = init.body === undefined ? undefined : JSON.stringify(init.body);
    const response = await fetch(new URL(path, this.baseUrl), {
      method: init.method ?? "GET",
      ...(requestBody === undefined
        ? {}
        : {
            headers: {
              "content-type": "application/json",
            },
            body: requestBody,
          }),
    });
    const responseBody = await parseResponseBody(response);

    if (!response.ok) {
      const errorMessage =
        typeof responseBody === "object" &&
        responseBody !== null &&
        "error" in responseBody &&
        typeof responseBody.error === "object" &&
        responseBody.error !== null &&
        "message" in responseBody.error &&
        typeof responseBody.error.message === "string"
          ? responseBody.error.message
          : `request failed with status ${response.status}`;
      throw new CliApiError(errorMessage, response.status, responseBody);
    }

    return responseBody as T;
  }

  getBoard(projectId: string): Promise<BoardResponse> {
    return this.request<BoardResponse>(`/projects/${projectId}/board`);
  }

  getCard(cardId: string): Promise<ShowCardResponse> {
    return this.request<ShowCardResponse>(`/cards/${cardId}`);
  }

  createCard(body: Record<string, unknown>): Promise<CreateCardResponse> {
    return this.request<CreateCardResponse>("/cards", {
      method: "POST",
      body,
    });
  }

  assignOwner(cardId: string, body: Record<string, unknown>): Promise<AssignCardOwnerResponse> {
    return this.request<AssignCardOwnerResponse>(`/cards/${cardId}/assign-owner`, {
      method: "POST",
      body,
    });
  }

  setState(cardId: string, body: Record<string, unknown>): Promise<SetCardStateResponse> {
    return this.request<SetCardStateResponse>(`/cards/${cardId}/set-state`, {
      method: "POST",
      body,
    });
  }

  updateMarkdown(
    cardId: string,
    body: Record<string, unknown>
  ): Promise<UpdateCardMarkdownResponse> {
    return this.request<UpdateCardMarkdownResponse>(`/cards/${cardId}/update-markdown`, {
      method: "POST",
      body,
    });
  }

  appendSummary(
    cardId: string,
    body: Record<string, unknown>
  ): Promise<AppendCardSummaryResponse> {
    return this.request<AppendCardSummaryResponse>(`/cards/${cardId}/append-summary`, {
      method: "POST",
      body,
    });
  }

  addComment(cardId: string, body: Record<string, unknown>): Promise<AddCommentResponse> {
    return this.request<AddCommentResponse>(`/cards/${cardId}/comments`, {
      method: "POST",
      body,
    });
  }

  importPlan(projectId: string, body: Record<string, unknown>): Promise<ImportPlanTasksResponse> {
    return this.request<ImportPlanTasksResponse>(`/projects/${projectId}/import-plan`, {
      method: "POST",
      body,
    });
  }
}

export function asErrorResponse(error: unknown): ErrorResponse {
  if (error instanceof CliApiError) {
    return error.responseBody as ErrorResponse;
  }

  return {
    error: {
      code: "invalid_transition",
      message: error instanceof Error ? error.message : "unexpected cli error",
    },
  };
}

export function getCardRevision(card: CardDetail): number {
  return card.revision;
}
