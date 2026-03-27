import { expect, test, type Page } from "@playwright/test";

const login = async (page: Page) => {
  await page.goto("/");
  await expect(page.getByTestId("login-page")).toBeVisible();
  await page.getByTestId("login-username").fill("user");
  await page.getByTestId("login-password").fill("password");
  await page.getByTestId("login-submit").click();
  await expect(page.getByRole("heading", { name: "Kanban Studio" })).toBeVisible();
};

test("requires login and supports logout", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByTestId("login-page")).toBeVisible();
  await expect(page.getByTestId("login-title")).toHaveText("Sign in to your board");

  await page.getByTestId("login-username").fill("user");
  await page.getByTestId("login-password").fill("password");
  await page.getByTestId("login-submit").click();

  await expect(page.getByRole("heading", { name: "Kanban Studio" })).toBeVisible();

  await page.getByTestId("logout-button").click();
  await expect(page.getByTestId("login-page")).toBeVisible();
  await expect(page.getByTestId("login-title")).toHaveText("Sign in to your board");
});

test("loads the kanban board", async ({ page }) => {
  await login(page);
  await expect(page.locator('[data-testid^="column-col-"]')).toHaveCount(5);
});

test("adds a column with the same core column UI", async ({ page }) => {
  await login(page);

  const existingColumn = page.locator('[data-testid^="column-col-"]').first();
  await page.getByRole("button", { name: /add column/i }).click();

  const columns = page.locator('[data-testid^="column-col-"]');
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
  await login(page);
  const firstColumn = page.locator('[data-testid^="column-col-"]').first();
  await firstColumn.getByRole("button", { name: /add a card/i }).click();
  await firstColumn.getByPlaceholder("Card title").fill("Playwright card");
  await firstColumn.getByPlaceholder("Details").fill("Added via e2e.");
  await firstColumn.getByRole("button", { name: /add card/i }).click();
  await expect(firstColumn.getByText("Playwright card")).toBeVisible();
});

test("edits a card in a column", async ({ page }) => {
  await login(page);

  const firstColumn = page.locator('[data-testid^="column-col-"]').first();
  await firstColumn.getByTestId("card-edit-col-backlog-card-1").click();
  await firstColumn.getByTestId("card-card-1-edit-title").fill("Edited via e2e");
  await firstColumn.getByTestId("card-card-1-edit-details").fill("Updated in browser.");
  await firstColumn.getByTestId("card-card-1-save").click();

  await expect(firstColumn.getByText("Edited via e2e")).toBeVisible();
  await expect(firstColumn.getByText("Updated in browser.")).toBeVisible();
});

test("deletes a column and its cards", async ({ page }) => {
  await login(page);

  await expect(page.locator('[data-testid^="column-col-"]')).toHaveCount(5);
  await expect(page.getByText("Align roadmap themes")).toBeVisible();

  const firstColumn = page.locator('[data-testid^="column-col-"]').first();
  await firstColumn
    .getByRole("button", { name: /delete column backlog/i })
    .click();

  await expect(page.locator('[data-testid^="column-col-"]')).toHaveCount(4);
  await expect(page.getByText("Align roadmap themes")).toHaveCount(0);
});

test("moves a column between columns", async ({ page }) => {
  await login(page);

  const firstColumn = page.getByTestId("column-col-backlog");
  const targetColumn = page.getByTestId("column-col-progress");
  const handle = page.getByTestId("column-drag-col-backlog");

  const handleBox = await handle.boundingBox();
  const targetBox = await targetColumn.boundingBox();
  if (!handleBox || !targetBox) {
    throw new Error("Unable to resolve column drag coordinates.");
  }

  await page.mouse.move(
    handleBox.x + handleBox.width / 2,
    handleBox.y + handleBox.height / 2
  );
  await page.mouse.down();
  await page.mouse.move(
    targetBox.x + targetBox.width / 2,
    targetBox.y + targetBox.height / 2,
    { steps: 12 }
  );
  await page.mouse.up();

  const columnTitles = await page
    .locator('[data-testid^="column-col-"] input[aria-label="Column title"]')
    .evaluateAll((nodes) => nodes.map((node) => (node as HTMLInputElement).value));

  expect(columnTitles).toEqual([
    "Discovery",
    "In Progress",
    "Backlog",
    "Review",
    "Done",
  ]);
});

test("moves a card between columns", async ({ page }) => {
  await login(page);
  const card = page.getByTestId("card-card-1");
  const handle = page.getByTestId("card-card-1-drag-handle");
  const targetColumn = page.getByTestId("column-col-review");
  const cardBox = await handle.boundingBox();
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

test("persists board changes across reloads", async ({ page }) => {
  await login(page);

  await page.getByTestId("board-add-column").click();
  await expect(page.locator('[data-testid^="column-col-"]')).toHaveCount(6);

  await page.reload();

  const columns = page.locator('[data-testid^="column-col-"]');
  await expect(columns).toHaveCount(6);
  await expect(columns.nth(5).getByLabel("Column title")).toHaveValue("New Column 6");
});

test("reverts unsaved column title edits on outside click", async ({ page }) => {
  await login(page);

  const columnTitle = page.getByTestId("column-title-col-backlog");
  await columnTitle.click();
  await columnTitle.fill("Temporary");
  await expect(columnTitle).toHaveValue("Temporary");

  await page.getByTestId("board-add-column").click();

  await expect(page.getByTestId("column-title-col-backlog")).toHaveValue("Backlog");
  await expect(page.getByTestId("dashboard-column-pill-input-col-backlog")).toHaveValue(
    "Backlog"
  );
});
