import type { BoardResponse, CardDetail, ProjectCreateResponse } from "@agent-kanban/contracts";

const apiBaseUrl = process.env.KANBAN_API_URL ?? "http://127.0.0.1:3001";

async function readJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(new URL(path, apiBaseUrl), {
    ...init,
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status} ${response.statusText}`);
  }

  return (await response.json()) as T;
}

export async function fetchBoard(projectId: string): Promise<BoardResponse> {
  return await readJson<BoardResponse>(`/projects/${projectId}/board`);
}

export async function fetchCard(cardId: string): Promise<CardDetail> {
  const response = await readJson<{ card: CardDetail }>(`/cards/${cardId}`);
  return response.card;
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
