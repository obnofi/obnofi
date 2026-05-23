import { test, expect } from "@playwright/test";
import { getUserId, signInAs, getWorkspaceId, createCollabPage } from "./helpers";

test("canvas cursor: userA mouse movement shows cursor element in userB view", async ({
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

  const { id: canvasPageId } = await createCollabPage(
    pageA,
    workspaceId,
    "canvas",
    `Canvas Cursor Test ${Date.now()}`,
    ["dev2"]
  );

  await pageA.goto(`/workspace/${workspaceId}?page=${canvasPageId}`);
  await pageA.waitForSelector('[data-testid="inline-canvas"]', { timeout: 20000 });

  await pageB.goto(`/workspace/${workspaceId}?page=${canvasPageId}`);
  await pageB.waitForSelector('[data-testid="inline-canvas"]', { timeout: 20000 });

  try {
    const canvasBox = await pageA.locator('[data-testid="inline-canvas"]').boundingBox();
    if (!canvasBox) throw new Error("Canvas bounding box not found");

    // userA moves mouse across canvas
    await pageA.mouse.move(canvasBox.x + canvasBox.width / 2, canvasBox.y + canvasBox.height / 2);
    await pageA.mouse.move(canvasBox.x + 300, canvasBox.y + 400);

    // userB should see data-user-cursor element for userA
    await expect
      .poll(
        () => pageB.locator(`[data-user-cursor="${userAId}"]`).count(),
        { timeout: 8000, message: `data-user-cursor="${userAId}" should appear on userB's canvas` }
      )
      .toBeGreaterThan(0);

    // capture initial position
    const boxBefore = await pageB.locator(`[data-user-cursor="${userAId}"]`).boundingBox();
    if (!boxBefore) throw new Error("Cursor element bounding box not found");

    // userA moves mouse to a significantly different position
    await pageA.mouse.move(canvasBox.x + 500, canvasBox.y + 600);

    // cursor position in userB should update
    await expect
      .poll(
        async () => {
          const box = await pageB.locator(`[data-user-cursor="${userAId}"]`).boundingBox();
          if (!box) return false;
          return Math.abs(box.x - boxBefore.x) > 5 || Math.abs(box.y - boxBefore.y) > 5;
        },
        { timeout: 5000, message: "Cursor position should change after userA mouse move" }
      )
      .toBe(true);

    // force-close userA; cursor should disappear from userB
    await contextA.close();

    await expect
      .poll(
        () => pageB.locator(`[data-user-cursor="${userAId}"]`).count(),
        { timeout: 5000, message: "Cursor should disappear after userA disconnects" }
      )
      .toBe(0);
  } finally {
    await contextB.close();
  }
});
