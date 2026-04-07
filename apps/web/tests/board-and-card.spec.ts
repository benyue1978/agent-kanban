import { expect, test } from "@playwright/test";

const apiBaseUrl = process.env.PLAYWRIGHT_API_BASE_URL ?? "http://127.0.0.1:3101";

test("home page lists projects and project names route to boards", async ({ page }) => {
  const projectName = "agent-kanban-home";
  const projectResponse = await page.request.post(`${apiBaseUrl}/projects`, {
    data: {
      name: projectName,
      repoUrl: "https://example.com/home-repo.git",
    },
  });
  const project = await projectResponse.json();

  await page.request.post(`${apiBaseUrl}/cards`, {
    data: {
      projectId: project.project.id,
      title: "Backend skeleton",
      descriptionMd: `# Backend skeleton

## Goal
Ship the first board detail vertical slice.

## Scope
Render the board and card detail through the web app.

## Definition of Done
- [x] board
- [x] detail`,
    },
  });

  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Choose a project board." })).toBeVisible();
  await page.getByRole("link", { name: new RegExp(projectName) }).click();
  await page.waitForURL(`/projects/${projectName}`);
  await expect(page.getByRole("heading", { name: "Ready" })).toBeVisible();
});

test("board and card detail render current process state", async ({ page }) => {
  const projectName = `agent-kanban-${Date.now()}`;
  const projectResponse = await page.request.post(`${apiBaseUrl}/projects`, {
    data: {
      name: projectName,
      repoUrl: "https://example.com/repo.git",
    },
  });
  const project = await projectResponse.json();

  await page.request.post(`${apiBaseUrl}/cards`, {
    data: {
      projectId: project.project.id,
      title: "Backend skeleton",
      descriptionMd: `# Backend skeleton

## Goal
Ship the first board detail vertical slice.

## Scope
Render the board and card detail through the web app.

## Definition of Done
- [x] board
- [x] detail

## Final Summary

### What was done
- Built the initial UI.

### DoD Check
- [x] board
- [x] detail`,
    },
  });

  await page.goto(`/projects/${project.project.id}`);
  await expect(page.getByRole("heading", { name: "Ready" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "In Progress" })).toBeVisible();
  await page.getByRole("link", { name: /Backend skeleton/ }).click();
  await page.waitForURL(/\/cards\//);
  await expect(page.getByRole("heading", { name: "Final Summary", level: 3 })).toBeVisible();
});
