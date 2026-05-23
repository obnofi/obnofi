import { test, expect } from "@playwright/test";
import {
  getUserId,
  signInAs,
  getWorkspaceId,
  createCollabPage,
} from "./helpers";

test("page presence: sidebar avatar appears for co-present user, disappears on disconnect", async ({
  browser,
}) => {
  test.setTimeout(60000);

  const contextA = await browser.newContext({ baseURL: "http://localhost:3000" });
  const pageA = await contextA.newPage();
  const workspaceId = await getWorkspaceId(pageA, "dev1");
  const userAId = getUserId("dev1");

  // Ensure dev2 user exists in DB before adding as collaborator
  const contextB = await browser.newContext({ baseURL: "http://localhost:3000" });
  const pageB = await contextB.newPage();
  await signInAs(pageB, "dev2");

  const { id: testPageId } = await createCollabPage(
    pageA,
    workspaceId,
    "document",
    `Cursor Test ${Date.now()}`,
    ["dev2"]
  );

  await pageA.goto(`/workspace/${workspaceId}?page=${testPageId}`);
  await pageA.waitForSelector('[data-testid="workspace-editor"]', { timeout: 15000 });

  await pageB.goto(`/workspace/${workspaceId}?page=${testPageId}`);
  await pageB.waitForSelector('[data-testid="workspace-editor"]', { timeout: 15000 });

  try {
    // userA avatar should appear in userB's sidebar next to the shared page
    await expect
      .poll(
        () =>
          pageB
            .locator(
              `[data-testid="sidebar-page-${testPageId}"] [data-testid="user-avatar-${userAId}"]`
            )
            .count(),
        { timeout: 8000, message: `user-avatar-${userAId} inside sidebar-page-${testPageId}` }
      )
      .toBeGreaterThan(0);

    // userA creates a second page and navigates there; awareness for testPageId clears
    const { id: secondPageId } = await createCollabPage(
      pageA,
      workspaceId,
      "document",
      `Second Page ${Date.now()}`
    );
    await pageA.goto(`/workspace/${workspaceId}?page=${secondPageId}`);

    // userB's sidebar: userA avatar should no longer be on the original page
    await expect
      .poll(
        () =>
          pageB
            .locator(
              `[data-testid="sidebar-page-${testPageId}"] [data-testid="user-avatar-${userAId}"]`
            )
            .count(),
        { timeout: 5000, message: "userA avatar should be gone from testPageId after navigation" }
      )
      .toBe(0);

    // Force-close userA context; avatar should fully disappear
    await contextA.close();

    await expect
      .poll(
        () => pageB.locator(`[data-testid="user-avatar-${userAId}"]`).count(),
        { timeout: 5000, message: "userA avatar should disappear after context close" }
      )
      .toBe(0);
  } finally {
    await contextB.close();
  }
});
