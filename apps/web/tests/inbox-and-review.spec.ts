import { expect, test } from "@playwright/test";
import { seedReviewUiFixture } from "./helpers/db";

test.beforeEach(() => {
  seedReviewUiFixture();
});

test("human can add verification evidence and complete a card from the browser", async ({ page }) => {
  await page.goto("/cards/card-review");
  await page.getByLabel("Comment kind").selectOption("verification");
  await page.getByRole("textbox", { name: "Comment" }).fill("Verified browser flow and summary.");
  await page.getByRole("button", { name: "Add Comment" }).click();
  const markDoneButton = page.getByRole("button", { name: "Mark Done" });
  await markDoneButton.click();
  await expect(markDoneButton).toHaveCount(0);
  await page.reload();
  await expect(page.getByTestId("card-state-badge")).toHaveText("Done");
});

test("human inbox, readying, and completion actions work end to end", async ({ page }) => {
  await page.goto("/inbox");
  await expect(page.getByTestId("current-human-actor")).toHaveText("human-reviewer");
  await expect(page.getByTestId("inbox-status-badge")).toHaveText("open");
  await page.getByRole("button", { name: "Acknowledge" }).click();
  await expect(page.getByTestId("inbox-status-badge")).toHaveText("acknowledged");

  await page.goto("/cards/card-new");
  const moveToReadyButton = page.getByRole("button", { name: "Move To Ready" });
  await moveToReadyButton.click();
  await expect(moveToReadyButton).toHaveCount(0);
  await page.reload();
  await expect(page.getByTestId("card-state-badge")).toHaveText("Ready");
  const startWorkButton = page.getByRole("button", { name: "Start Work" });
  await startWorkButton.click();
  await expect(startWorkButton).toHaveCount(0);
  await page.reload();
  await expect(page.getByTestId("card-state-badge")).toHaveText("In Progress");

  await page.goto("/cards/card-review");
  await page.getByLabel("Priority").selectOption("1");
  await expect(page.getByText("Priority 1")).toBeVisible();
  await page.getByLabel("Comment kind").selectOption("verification");
  await page.getByRole("textbox", { name: "Comment" }).fill("Verified in browser.");
  await page.getByRole("button", { name: "Add Comment" }).click();
  await expect(page.getByText("Verified in browser.")).toBeVisible();
  const completeReviewButton = page.getByRole("button", { name: "Mark Done" });
  await completeReviewButton.click();
  await expect(completeReviewButton).toHaveCount(0);
  await page.reload();
  await expect(page.getByTestId("card-state-badge")).toHaveText("Done");
});
