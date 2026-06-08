import { test, expect } from "@playwright/test";
import {
  signInAs,
  getWorkspaceId,
  createCollabPage,
} from "./helpers";

const CURSOR_CHAT_MAX_LENGTH = 52;
const CURSOR_CHAT_TTL_MS = 5000;

async function openSharedDocument(browser: import("@playwright/test").Browser) {
  const contextA = await browser.newContext({ baseURL: "http://localhost:3000" });
  const pageA = await contextA.newPage();
  const workspaceId = await getWorkspaceId(pageA, "dev1");

  const contextB = await browser.newContext({ baseURL: "http://localhost:3000" });
  const pageB = await contextB.newPage();
  await signInAs(pageB, "dev2");

  const { id: docPageId } = await createCollabPage(
    pageA,
    workspaceId,
    "document",
    `Cursor Chat ${Date.now()}`,
    ["dev2"],
    { collaborationEnabled: true }
  );

  await pageA.goto(`/workspace/${workspaceId}?page=${docPageId}`);
  await pageA.waitForSelector('[data-testid="workspace-editor"]', { timeout: 15000 });
  await expect(pageA.getByTestId("collaboration-status")).toBeVisible({ timeout: 15000 });

  await pageB.goto(`/workspace/${workspaceId}?page=${docPageId}`);
  await pageB.waitForSelector('[data-testid="workspace-editor"]', { timeout: 15000 });
  await expect(pageB.getByTestId("collaboration-status")).toBeVisible({ timeout: 15000 });

  return { contextA, contextB, pageA, pageB };
}

async function clearActiveElement(page: import("@playwright/test").Page) {
  await page.evaluate(() => {
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
  });
}

test("cursor chat: slash opens bubble, draft syncs live, Esc clears without persisting", async ({
  browser,
}) => {
  test.setTimeout(60000);

  const { contextA, contextB, pageA, pageB } = await openSharedDocument(browser);

  try {
    const editorA = pageA.getByTestId("workspace-editor-input");
    await pageA.bringToFront();
    await clearActiveElement(pageA);
    await pageA.keyboard.press("/");

    const inputA = pageA.locator('input[name="cursor-chat-message"]');
    await expect(inputA).toBeVisible();

    const longDraft = "x".repeat(CURSOR_CHAT_MAX_LENGTH + 8);
    await inputA.fill(longDraft);

    await expect(inputA).toHaveValue("x".repeat(CURSOR_CHAT_MAX_LENGTH));
    await expect(pageA.getByText(`${CURSOR_CHAT_MAX_LENGTH}/${CURSOR_CHAT_MAX_LENGTH}`)).toBeVisible();

    await expect(pageB.getByText("x".repeat(CURSOR_CHAT_MAX_LENGTH), { exact: true })).toBeVisible();

    await pageA.keyboard.press("Escape");

    await expect(inputA).toHaveCount(0);
    await expect(pageB.getByText("x".repeat(CURSOR_CHAT_MAX_LENGTH), { exact: true })).toHaveCount(0);
    await expect(editorA).not.toContainText("x".repeat(CURSOR_CHAT_MAX_LENGTH));

    await editorA.locator("p").last().click();
    await pageA.keyboard.press("/");
    await expect(inputA).toHaveCount(0);
  } finally {
    await contextA.close();
    await contextB.close();
  }
});

test("cursor chat: submitted message expires after 5 seconds and does not enter the document", async ({
  browser,
}) => {
  test.setTimeout(90000);

  const { contextA, contextB, pageA, pageB } = await openSharedDocument(browser);

  try {
    const message = `cursor chat ttl ${Date.now()}`;
    const editorA = pageA.getByTestId("workspace-editor-input");
    const editorB = pageB.getByTestId("workspace-editor-input");

    await pageA.bringToFront();
    await clearActiveElement(pageA);
    await pageA.keyboard.press("/");

    const inputA = pageA.locator('input[name="cursor-chat-message"]');
    await inputA.fill(message);
    await pageA.keyboard.press("Enter");

    await expect(inputA).toHaveCount(0);
    await expect(pageA.getByText(message, { exact: true })).toBeVisible();
    await expect(pageB.getByText(message, { exact: true })).toBeVisible();
    await expect(editorA).not.toContainText(message);
    await expect(editorB).not.toContainText(message);

    await pageA.waitForTimeout(CURSOR_CHAT_TTL_MS + 800);

    await expect(pageA.getByText(message, { exact: true })).toHaveCount(0);
    await expect(pageB.getByText(message, { exact: true })).toHaveCount(0);
    await expect(editorA).not.toContainText(message);
    await expect(editorB).not.toContainText(message);
  } finally {
    await contextA.close();
    await contextB.close();
  }
});
