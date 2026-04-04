import { expect, test } from "@playwright/test";
import { seedReviewUiFixture } from "./helpers/db";

test.beforeEach(() => {
  seedReviewUiFixture();
});

test("human can review or send back a card from the browser", async ({ page }) => {
  await page.goto("/cards/card-review");
  const sendBackButton = page.getByRole("button", { name: "Send Back To In Progress" });
  await sendBackButton.click();
  await expect(sendBackButton).toHaveCount(0);
  await page.reload();
  await expect(page.getByTestId("card-state-badge")).toHaveText("In Progress");
});

test("human inbox and review actions work end to end", async ({ page }) => {
  await page.goto("/inbox");
  await expect(page.getByText("human-reviewer")).toBeVisible();
  await expect(page.getByTestId("inbox-status-badge")).toHaveText("open");
  await page.getByRole("button", { name: "Acknowledge" }).click();
  await expect(page.getByTestId("inbox-status-badge")).toHaveText("acknowledged");

  await page.goto("/cards/card-new");
  const moveToReadyButton = page.getByRole("button", { name: "Move To Ready" });
  await moveToReadyButton.click();
  await expect(moveToReadyButton).toHaveCount(0);
  await page.reload();
  await expect(page.getByTestId("card-state-badge")).toHaveText("Ready");

  await page.goto("/cards/card-review");
  await page.getByLabel("Priority").selectOption("1");
  await expect(page.getByText("Priority 1")).toBeVisible();
  await page.getByLabel("Comment").fill("Reviewed in browser.");
  await page.getByRole("button", { name: "Add Comment" }).click();
  await expect(page.getByText("Reviewed in browser.")).toBeVisible();
  const completeReviewButton = page.getByRole("button", { name: "Complete Review" });
  await completeReviewButton.click();
  await expect(completeReviewButton).toHaveCount(0);
  await page.reload();
  await expect(page.getByTestId("card-state-badge")).toHaveText("Done");
});
