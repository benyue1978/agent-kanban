import { expect, test } from "@playwright/test";

test("board and card detail render current process state", async ({ page }) => {
  const projectResponse = await page.request.post("http://127.0.0.1:3001/projects", {
    data: {
      name: "agent-kanban",
      repoUrl: "https://example.com/repo.git",
    },
  });
  const project = await projectResponse.json();

  await page.request.post("http://127.0.0.1:3001/cards", {
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
  await page.getByRole("link", { name: /Backend skeleton/ }).click();
  await page.waitForURL(/\/cards\//);
  await expect(page.getByRole("heading", { name: "Final Summary", level: 3 })).toBeVisible();
});
