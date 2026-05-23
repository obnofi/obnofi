import { test, expect } from "@playwright/test";
import {
  getUserId,
  getUserColor,
  signInAs,
  getWorkspaceId,
  createCollabPage,
  createDatabaseRow,
} from "./helpers";

test("database cursor: cell focus shows outline for remote user, clears on blur", async ({
  browser,
}) => {
  test.setTimeout(60000);

  const contextA = await browser.newContext({ baseURL: "http://localhost:3000" });
  const pageA = await contextA.newPage();
  const workspaceId = await getWorkspaceId(pageA, "dev1");
  const userAId = getUserId("dev1");
  const userAColor = getUserColor(userAId);

  // Ensure dev2 user exists in DB before adding as collaborator
  const contextB = await browser.newContext({ baseURL: "http://localhost:3000" });
  const pageB = await contextB.newPage();
  await signInAs(pageB, "dev2");

  const { id: dbPageId, databaseId } = await createCollabPage(
    pageA,
    workspaceId,
    "database",
    `DB Cursor Test ${Date.now()}`,
    ["dev2"]
  );

  if (!databaseId) throw new Error("databaseId missing from created page");

  // create a row so there is at least one cell to interact with
  const row = await createDatabaseRow(pageA, databaseId);

  await pageA.goto(`/workspace/${workspaceId}?page=${dbPageId}`);
  // wait until the row cell is rendered
  await pageA.waitForSelector(`[data-testid^="db-cell-${row.id}-"]`, { timeout: 20000 });

  await pageB.goto(`/workspace/${workspaceId}?page=${dbPageId}`);
  await pageB.waitForSelector(`[data-testid^="db-cell-${row.id}-"]`, { timeout: 20000 });

  try {
    // userA clicks the title cell of the created row
    const titleCellA = pageA.locator(`[data-testid="db-cell-${row.id}-title"]`);
    await titleCellA.click();

    // userB: same cell should get a box-shadow matching userA's color
    const titleCellB = pageB.locator(`[data-testid="db-cell-${row.id}-title"]`);

    await expect
      .poll(
        async () => {
          const shadow = await titleCellB.evaluate(
            (el) => (el as HTMLElement).style.boxShadow
          );
          return shadow.includes(userAColor);
        },
        { timeout: 8000, message: `Cell should have box-shadow with userA color ${userAColor}` }
      )
      .toBe(true);

    // userA clicks a different area (outside cells) to blur
    await pageA.locator("header").click({ force: true });

    // userB: box-shadow should clear
    await expect
      .poll(
        async () => {
          const shadow = await titleCellB.evaluate(
            (el) => (el as HTMLElement).style.boxShadow
          );
          return shadow === "" || !shadow.includes(userAColor);
        },
        { timeout: 5000, message: "Cell shadow should clear after userA blurs" }
      )
      .toBe(true);
  } finally {
    await contextA.close();
    await contextB.close();
  }
});
