import type {
  BoardResponse,
  CardDetail,
  InboxItem,
  InboxItemStatusValue,
  ListInboxResponse,
  ProjectCreateResponse,
  ProjectListResponse,
} from "@agent-kanban/contracts";

const apiBaseUrl = process.env.KANBAN_API_URL ?? "http://127.0.0.1:3001";

async function requestApi(path: string, init?: RequestInit): Promise<Response> {
  return await fetch(new URL(path, apiBaseUrl), {
    ...init,
    cache: "no-store",
  });
}

async function readJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await requestApi(path, init);

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status} ${response.statusText}`);
  }

  return (await response.json()) as T;
}

export async function postApi(
  path: string,
  body: Record<string, unknown>
): Promise<{ body: unknown; status: number }> {
  const response = await requestApi(path, {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const text = await response.text();

  return {
    body: text.length === 0 ? null : (JSON.parse(text) as unknown),
    status: response.status,
  };
}

export async function fetchBoard(projectId: string): Promise<BoardResponse> {
  return await readJson<BoardResponse>(`/projects/${projectId}/board`);
}

export async function fetchProjects() : Promise<ProjectListResponse["projects"]> {
  const response = await readJson<ProjectListResponse>("/projects");
  return response.projects;
}

export async function fetchCard(cardId: string): Promise<CardDetail> {
  const response = await readJson<{ card: CardDetail }>(`/cards/${cardId}`);
  return response.card;
}

export async function fetchInbox(
  collaboratorId: string,
  status?: InboxItemStatusValue
): Promise<InboxItem[]> {
  const query = new URLSearchParams({ collaboratorId });

  if (status !== undefined) {
    query.set("status", status);
  }

  const response = await readJson<ListInboxResponse>(`/inbox?${query.toString()}`);
  return response.items;
}

export async function createProjectForTest(projectId: string): Promise<void> {
  try {
    await readJson<ProjectCreateResponse>("/projects", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        name: "agent-kanban",
        repoUrl: "https://example.com/repo.git",
      }),
    });
  } catch {
    void projectId;
  }
}
