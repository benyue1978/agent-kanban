import { expect, test } from "@playwright/test";
import { seedReviewUiFixture } from "./helpers/db";

test.beforeEach(() => {
  seedReviewUiFixture();
});

test("project board renders In Review column and card", async ({ page }) => {
  await page.goto("/projects/project-ui");
  
  // Check column header
  await expect(page.getByRole("heading", { name: "In Review" })).toBeVisible();
  
  // Check that the card is in the column
  const column = page.locator("section").filter({ has: page.getByRole("heading", { name: "In Review" }) });
  await expect(column.getByText("Review-ready implementation")).toBeVisible();
});
