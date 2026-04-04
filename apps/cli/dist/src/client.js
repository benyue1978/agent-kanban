export class CliApiError extends Error {
    statusCode;
    responseBody;
    constructor(message, statusCode, responseBody) {
        super(message);
        this.statusCode = statusCode;
        this.responseBody = responseBody;
        this.name = "CliApiError";
    }
}
async function parseResponseBody(response) {
    const text = await response.text();
    if (text.length === 0) {
        return null;
    }
    try {
        return JSON.parse(text);
    }
    catch {
        return text;
    }
}
export class ApiClient {
    baseUrl;
    constructor(baseUrl) {
        this.baseUrl = baseUrl;
    }
    async request(path, init = {}) {
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
            const errorMessage = typeof responseBody === "object" &&
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
        return responseBody;
    }
    getBoard(projectId) {
        return this.request(`/projects/${projectId}/board`);
    }
    getCard(cardId) {
        return this.request(`/cards/${cardId}`);
    }
    createCard(body) {
        return this.request("/cards", {
            method: "POST",
            body,
        });
    }
    assignOwner(cardId, body) {
        return this.request(`/cards/${cardId}/assign-owner`, {
            method: "POST",
            body,
        });
    }
    setState(cardId, body) {
        return this.request(`/cards/${cardId}/set-state`, {
            method: "POST",
            body,
        });
    }
    updateMarkdown(cardId, body) {
        return this.request(`/cards/${cardId}/update-markdown`, {
            method: "POST",
            body,
        });
    }
    appendSummary(cardId, body) {
        return this.request(`/cards/${cardId}/append-summary`, {
            method: "POST",
            body,
        });
    }
    addComment(cardId, body) {
        return this.request(`/cards/${cardId}/comments`, {
            method: "POST",
            body,
        });
    }
}
export function asErrorResponse(error) {
    if (error instanceof CliApiError) {
        return error.responseBody;
    }
    return {
        error: {
            code: "invalid_transition",
            message: error instanceof Error ? error.message : "unexpected cli error",
        },
    };
}
export function getCardRevision(card) {
    return card.revision;
}
