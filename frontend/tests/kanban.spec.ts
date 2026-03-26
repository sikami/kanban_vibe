import { expect, test } from "@playwright/test";

test("loads the kanban board", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Kanban Studio" })).toBeVisible();
  await expect(page.locator('[data-testid^="column-"]')).toHaveCount(5);
});

test("adds a column with the same core column UI", async ({ page }) => {
  await page.goto("/");

  const existingColumn = page.locator('[data-testid^="column-"]').first();
  await page.getByRole("button", { name: /add column/i }).click();

  const columns = page.locator('[data-testid^="column-"]');
  await expect(columns).toHaveCount(6);

  const newColumn = columns.nth(5);
  await expect(newColumn).toBeVisible();
  await expect(newColumn.getByLabel("Column title")).toHaveValue("New Column 6");
  await expect(newColumn.getByText(/drop a card here/i)).toBeVisible();
  await expect(
    newColumn.getByRole("button", { name: /add a card/i })
  ).toBeVisible();

  await expect(
    newColumn.getByRole("button", { name: /add a card/i })
  ).toHaveText(
    await existingColumn.getByRole("button", { name: /add a card/i }).textContent()
  );
});

test("adds a card to a column", async ({ page }) => {
  await page.goto("/");
  const firstColumn = page.locator('[data-testid^="column-"]').first();
  await firstColumn.getByRole("button", { name: /add a card/i }).click();
  await firstColumn.getByPlaceholder("Card title").fill("Playwright card");
  await firstColumn.getByPlaceholder("Details").fill("Added via e2e.");
  await firstColumn.getByRole("button", { name: /add card/i }).click();
  await expect(firstColumn.getByText("Playwright card")).toBeVisible();
});

test("moves a card between columns", async ({ page }) => {
  await page.goto("/");
  const card = page.getByTestId("card-card-1");
  const targetColumn = page.getByTestId("column-col-review");
  const cardBox = await card.boundingBox();
  const columnBox = await targetColumn.boundingBox();
  if (!cardBox || !columnBox) {
    throw new Error("Unable to resolve drag coordinates.");
  }

  await page.mouse.move(
    cardBox.x + cardBox.width / 2,
    cardBox.y + cardBox.height / 2
  );
  await page.mouse.down();
  await page.mouse.move(
    columnBox.x + columnBox.width / 2,
    columnBox.y + 120,
    { steps: 12 }
  );
  await page.mouse.up();
  await expect(targetColumn.getByTestId("card-card-1")).toBeVisible();
});
