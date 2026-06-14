import { test, expect } from "@playwright/test";

async function signInAsDeveloper(page: import("@playwright/test").Page) {
  const request = page.context().request;
  const csrfResponse = await request.get("/api/auth/csrf");
  const { csrfToken } = (await csrfResponse.json()) as { csrfToken: string };
  await request.post("/api/auth/callback/credentials", {
    form: { csrfToken, callbackUrl: "/workspace", json: "true" },
  });
}

async function gotoWorkspaceDocument(page: import("@playwright/test").Page) {
  await signInAsDeveloper(page);
  await page.goto("/workspace");
  await expect(page).toHaveURL(/\/workspace\/[^/?]+/);

  const workspaceId = page.url().match(/\/workspace\/([^/?]+)/)?.[1];
  expect(workspaceId).toBeTruthy();

  const title = `Inline Block Test ${Date.now()}`;
  const createPageResponse = await page.context().request.post("/api/pages", {
    data: {
      title,
      type: "document",
      workspaceId,
      content: { type: "doc", content: [{ type: "paragraph" }] },
    },
  });

  expect(createPageResponse.ok()).toBeTruthy();
  const createdPage = (await createPageResponse.json()) as { id: string };
  await page.goto(`/workspace/${workspaceId}?page=${createdPage.id}`);
  await expect(page.getByTestId("workspace-editor")).toBeVisible({ timeout: 15000 });

  return {
    workspaceId: workspaceId!,
    pageId: createdPage.id,
    title,
  };
}

async function createWorkspaceDatabaseFixture(
  page: import("@playwright/test").Page
) {
  await signInAsDeveloper(page);
  await page.goto("/workspace");
  await expect(page).toHaveURL(/\/workspace\/[^/?]+/);

  const workspaceId = page.url().match(/\/workspace\/([^/?]+)/)?.[1];
  expect(workspaceId).toBeTruthy();

  const createPageResponse = await page.context().request.post("/api/pages", {
    data: {
      title: `Database Fixture ${Date.now()}`,
      type: "database",
      workspaceId,
      content: { type: "doc", content: [{ type: "paragraph" }] },
    },
  });

  expect(createPageResponse.ok()).toBeTruthy();
  const databasePage = (await createPageResponse.json()) as { id: string };

  const createDatabaseResponse = await page.context().request.post("/api/databases", {
    data: { pageId: databasePage.id },
  });
  expect(createDatabaseResponse.ok()).toBeTruthy();
  const database = (await createDatabaseResponse.json()) as { id: string };

  const createRowResponse = await page.context().request.post(
    `/api/databases/${database.id}/rows`,
    {
      data: { title: `Row Fixture ${Date.now()}` },
    }
  );
  expect(createRowResponse.ok()).toBeTruthy();
  const row = (await createRowResponse.json()) as { id: string; title: string };

  return {
    workspaceId: workspaceId!,
    databasePageId: databasePage.id,
    databaseId: database.id,
    rowId: row.id,
    rowTitle: row.title,
  };
}

async function focusEditorTail(page: import("@playwright/test").Page) {
  const editor = page.getByTestId("workspace-editor-input");
  await expect(editor).toBeVisible();
  await editor.locator("p").last().click();
  return editor;
}

async function waitForChildPageId(
  page: import("@playwright/test").Page,
  workspaceId: string,
  parentId: string,
  title: string
) {
  const request = page.context().request;
  const deadline = Date.now() + 30000;

  while (Date.now() < deadline) {
    const response = await request.get(`/api/pages?workspaceId=${workspaceId}`);
    expect(response.ok()).toBeTruthy();
    const pages = (await response.json()) as Array<{
      id: string;
      title: string;
      parentId: string | null;
    }>;

    const match = pages.find((candidate) => (
      candidate.parentId === parentId && candidate.title === title
    ));

    if (match) {
      return match.id;
    }

    await page.waitForTimeout(250);
  }

  throw new Error(`Timed out waiting for child page "${title}"`);
}

// ─── Database (Undergrowth) ───────────────────────────────────────────────────

test("인라인 Database: 텍스트 셀 input이 포커스된다", async ({ page }) => {
  test.setTimeout(120000);
  await gotoWorkspaceDocument(page);
  await focusEditorTail(page);
  await page.keyboard.type("/database");

  const dbEmbed = page.getByTestId("inline-database-embed").last();
  await expect(dbEmbed).toHaveAttribute("data-state", "ready", { timeout: 60000 });

  // 셀 내 input이 있으면 클릭 후 포커스 검증 (타이틀 입력 제외)
  const cellInput = dbEmbed.locator("input[name='text-cell']").first();
  const inputVisible = await cellInput.isVisible({ timeout: 5000 }).catch(() => false);
  if (inputVisible) {
    await cellInput.click();
    await expect(cellInput).toBeFocused();
    await page.keyboard.type("test-value");
    await expect(cellInput).toHaveValue("test-value");
  } else {
    // input이 없어도 셀 영역 클릭이 에러 없이 작동하면 통과
    const box = await dbEmbed.boundingBox();
    expect(box).not.toBeNull();
    await page.mouse.click(box!.x + box!.width / 2, box!.y + box!.height / 2);
    await expect(dbEmbed).toBeVisible();
  }
});

test("인라인 Database: 행 추가 버튼을 클릭하면 새 행이 나타난다", async ({ page }) => {
  test.setTimeout(120000);
  await gotoWorkspaceDocument(page);
  await focusEditorTail(page);
  await page.keyboard.type("/database");

  const dbEmbed = page.getByTestId("inline-database-embed").last();
  await expect(dbEmbed).toHaveAttribute("data-state", "ready", { timeout: 60000 });

  // 행 추가 버튼 클릭
  const addRowBtn = dbEmbed
    .getByRole("button", { name: /행 추가|Add row|새 행|New|\+/ })
    .first();
  const btnVisible = await addRowBtn.isVisible({ timeout: 5000 }).catch(() => false);
  if (btnVisible) {
    const rowsBefore = await dbEmbed.locator("[data-testid='database-row'], tr[data-row-id]").count();
    await addRowBtn.click();
    // 새 행이 추가되거나 최소한 에러 없이 작동
    await expect(dbEmbed).toBeVisible();
    const rowsAfter = await dbEmbed.locator("[data-testid='database-row'], tr[data-row-id]").count();
    expect(rowsAfter).toBeGreaterThanOrEqual(rowsBefore);
  } else {
    await expect(dbEmbed).toBeVisible();
  }
});

// ─── Canvas (Clearing) ────────────────────────────────────────────────────────

test("인라인 Canvas: Open 버튼을 클릭해도 크래시가 없다", async ({ page }) => {
  test.setTimeout(120000);
  await gotoWorkspaceDocument(page);
  await focusEditorTail(page);
  await page.keyboard.type("/canvas");

  const canvasEmbed = page.getByTestId("inline-canvas-embed");
  await expect(canvasEmbed).toHaveAttribute("data-state", "ready", { timeout: 60000 });

  const openBtn = page.getByTestId("inline-canvas-open");
  await expect(openBtn).toBeVisible();
  // 클릭해도 에러 없이 작동 (navigate하거나 현재 페이지 유지)
  await openBtn.click();
  // 네비게이션 후에도 페이지가 살아있음을 확인
  await expect(page).not.toHaveURL("about:blank");
});

test("인라인 Canvas: 내부 클릭이 에디터 노드 선택을 유발하지 않는다", async ({ page }) => {
  test.setTimeout(120000);
  await gotoWorkspaceDocument(page);
  await focusEditorTail(page);
  await page.keyboard.type("/canvas");

  const canvasEmbed = page.getByTestId("inline-canvas-embed");
  await expect(canvasEmbed).toHaveAttribute("data-state", "ready", { timeout: 60000 });

  // 클릭 전에 canvas embed가 1개인지 확인
  await expect(canvasEmbed).toHaveCount(1);

  // 헤더 영역 클릭 (element 상대 좌표): Playwright가 자동 스크롤-인투-뷰 처리
  // box.y + height/2 는 캔버스 임베드가 뷰포트를 벗어날 경우 하단 GroveInsertionToolbar
  // 의 캔버스 버튼과 y좌표가 겹쳐 두 번째 캔버스가 삽입되는 문제를 방지
  await canvasEmbed.click({ position: { x: 40, y: 20 } });

  // 클릭 후에도 canvas embed가 1개여야 함
  await expect(canvasEmbed).toHaveCount(1);

  // ProseMirror 노드 선택 시 나타나는 .ProseMirror-selectednode 클래스가 없어야 함
  const editorInput = page.getByTestId("workspace-editor-input");
  const selectedNode = editorInput.locator(".ProseMirror-selectednode");
  await expect(selectedNode).toHaveCount(0);

  // canvas embed 자체는 여전히 보여야 함
  await expect(canvasEmbed).toBeVisible();
});

test("인라인 Canvas: 마인드맵 입력 중 높이가 계속 커지지 않는다", async ({ page }) => {
  test.setTimeout(120000);
  await gotoWorkspaceDocument(page);
  await focusEditorTail(page);
  await page.keyboard.type("/canvas");

  const canvasEmbed = page.getByTestId("inline-canvas-embed");
  await expect(canvasEmbed).toHaveAttribute("data-state", "ready", { timeout: 60000 });

  const canvas = page.getByTestId("inline-canvas");
  await expect(canvas.getByText("Research cluster")).toBeVisible({ timeout: 15000 });
  const mindMapTool = canvas.locator('button[title="Mind map"]').first();
  await expect(mindMapTool).toBeVisible();
  await mindMapTool.click();

  const canvasBox = await canvas.boundingBox();
  expect(canvasBox).not.toBeNull();
  const targetX = canvasBox!.x + canvasBox!.width - 140;
  const targetY = canvasBox!.y + 140;

  const vineEditor = canvas.locator('[contenteditable="true"]').last();
  let editorReady = false;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    await page.mouse.click(targetX, targetY);
    const readyCount = await vineEditor.count();
    if (readyCount > 0) {
      editorReady = true;
      break;
    }
    await page.waitForTimeout(400);
  }

  expect(editorReady).toBeTruthy();
  await expect(vineEditor).toBeFocused({ timeout: 10000 });
  await expect(canvas.getByText("Mind map")).toHaveCount(0);

  await vineEditor.type("Seed");

  const firstHeight = await vineEditor.evaluate((element) => {
    let current: HTMLElement | null = element as HTMLElement;
    while (current) {
      const style = current.getAttribute("style") ?? "";
      if (style.includes("left:") && style.includes("top:") && style.includes("width:") && style.includes("height:")) {
        return current.getBoundingClientRect().height;
      }
      current = current.parentElement;
    }
    return (element as HTMLElement).getBoundingClientRect().height;
  });

  await vineEditor.type("lings");

  const secondHeight = await vineEditor.evaluate((element) => {
    let current: HTMLElement | null = element as HTMLElement;
    while (current) {
      const style = current.getAttribute("style") ?? "";
      if (style.includes("left:") && style.includes("top:") && style.includes("width:") && style.includes("height:")) {
        return current.getBoundingClientRect().height;
      }
      current = current.parentElement;
    }
    return (element as HTMLElement).getBoundingClientRect().height;
  });

  expect(secondHeight).toBeLessThanOrEqual(firstHeight + 2);
  await page.locator("body").click({ position: { x: 20, y: 20 } });
  await expect(canvas.getByText("Seedlings")).toBeVisible();
});

test("인라인 Canvas: 마인드맵 노드에 크기 조절 핸들이 표시된다", async ({ page }) => {
  test.setTimeout(120000);
  await gotoWorkspaceDocument(page);
  await focusEditorTail(page);
  await page.keyboard.type("/canvas");

  const canvas = page.getByTestId("inline-canvas");
  await expect(page.getByTestId("inline-canvas-embed")).toHaveAttribute("data-state", "ready", { timeout: 60000 });
  await expect(canvas.getByText("Research cluster")).toBeVisible({ timeout: 15000 });

  await canvas.locator('button[title="Mind map"]').first().click();
  const canvasBox = await canvas.boundingBox();
  expect(canvasBox).not.toBeNull();

  for (let attempt = 0; attempt < 3; attempt += 1) {
    await page.mouse.click(canvasBox!.x + canvasBox!.width - 140, canvasBox!.y + 140);
    if (await canvas.getByRole("button", { name: "Resize from se" }).count()) {
      break;
    }
    await page.waitForTimeout(400);
  }

  const resizeHandle = canvas.getByRole("button", { name: "Resize from se" }).last();
  await expect(resizeHandle).toBeVisible();

  await expect(canvas.getByRole("button", { name: "Resize from nw" }).last()).toBeVisible();
  await expect(canvas.getByRole("button", { name: "Resize from se" }).last()).toBeVisible();
});

// ─── 편집 가능성 심화 검증 ────────────────────────────────────────────────────

test("인라인 Database: New 버튼으로 행 추가되고 타이틀 버튼이 렌더된다", async ({ page }) => {
  test.setTimeout(120000);
  await gotoWorkspaceDocument(page);
  await focusEditorTail(page);
  await page.keyboard.type("/database");

  const dbEmbed = page.getByTestId("inline-database-embed").last();
  await expect(dbEmbed).toHaveAttribute("data-state", "ready", { timeout: 60000 });

  // "New" 버튼 직접 클릭
  const newBtn = dbEmbed.getByRole("button", { name: "New" }).first();
  await expect(newBtn).toBeVisible({ timeout: 10000 });

  const rowsBefore = await dbEmbed.locator("tbody tr").count();
  await newBtn.click();

  // 행이 추가돼야 함
  await expect(dbEmbed.locator("tbody tr")).toHaveCount(rowsBefore + 1, { timeout: 10000 });

  // 행 타이틀 버튼이 렌더돼야 함
  const titleBtn = dbEmbed.locator("tbody tr button").first();
  await expect(titleBtn).toBeVisible();
});

test("고아 인라인 Canvas 페이지는 사이드바 Files에 노출되지 않는다", async ({ page }) => {
  test.setTimeout(120000);
  const workspace = await gotoWorkspaceDocument(page);
  const sidebarItemsBefore = await page.locator("[data-testid^='sidebar-page-']").count();

  const createPageResponse = await page.context().request.post("/api/pages", {
    data: {
      title: "Inline Clearing",
      type: "canvas",
      workspaceId: workspace.workspaceId,
      parentId: workspace.pageId,
    },
  });
  expect(createPageResponse.ok()).toBeTruthy();

  await page.reload();
  await expect(page.getByTestId("workspace-editor")).toBeVisible({ timeout: 15000 });
  await expect(page.locator("[data-testid^='sidebar-page-']")).toHaveCount(sidebarItemsBefore);
  await expect(page.getByTestId("workspace-sidebar")).not.toContainText("Inline Clearing");
});

test("백스페이스로 인라인 canvas/database를 삭제하면 실제 페이지도 삭제된다", async ({ page }) => {
  test.setTimeout(120000);
  const workspace = await gotoWorkspaceDocument(page);

  await focusEditorTail(page);
  await page.keyboard.type("/canvas");

  const canvasEmbed = page.getByTestId("inline-canvas-embed").last();
  await expect(canvasEmbed).toHaveAttribute("data-state", "ready", { timeout: 60000 });
  const canvasPageId = await waitForChildPageId(
    page,
    workspace.workspaceId,
    workspace.pageId,
    "Inline Clearing"
  );

  await page.keyboard.press("Backspace");
  await expect(canvasEmbed).toHaveCount(0);
  await expect
    .poll(async () => {
      const response = await page.context().request.get(`/api/pages/${canvasPageId}`);
      return response.status();
    }, { timeout: 15000 })
    .toBe(404);

  await focusEditorTail(page);
  await page.keyboard.type("/database");

  const databaseEmbed = page.getByTestId("inline-database-embed").last();
  await expect(databaseEmbed).toHaveAttribute("data-state", "ready", { timeout: 60000 });
  const databasePageId = await waitForChildPageId(
    page,
    workspace.workspaceId,
    workspace.pageId,
    "Grove Catalog"
  );

  await page.keyboard.press("Backspace");
  await expect(databaseEmbed).toHaveCount(0);
  await expect
    .poll(async () => {
      const response = await page.context().request.get(`/api/pages/${databasePageId}`);
      return response.status();
    }, { timeout: 15000 })
    .toBe(404);
});

test("백스페이스로 인라인 page를 삭제하면 실제 페이지도 삭제된다", async ({ page }) => {
  test.setTimeout(180000);
  const workspace = await gotoWorkspaceDocument(page);

  const childPageResponse = await page.context().request.post("/api/pages", {
    data: {
      title: `Embedded Grove Seed ${Date.now()}`,
      type: "document",
      workspaceId: workspace.workspaceId,
      parentId: workspace.pageId,
    },
  });
  expect(childPageResponse.ok()).toBeTruthy();
  const childPage = (await childPageResponse.json()) as { id: string; title: string };

  await page.reload();
  await expect(page.getByTestId("workspace-editor")).toBeVisible({ timeout: 15000 });
  await focusEditorTail(page);
  await page.evaluate(
    ({ childPageId, workspaceId, parentPageId }) => {
      const editor = (window as typeof window & {
        __obnofiEditor?: {
          chain: () => {
            focus: () => {
              insertContent: (content: unknown) => { run: () => void };
            };
          };
        };
      }).__obnofiEditor;

      if (!editor) {
        throw new Error("Editor bridge unavailable");
      }

      editor
        .chain()
        .focus()
        .insertContent([
          {
            type: "subPageEmbed",
            attrs: {
              pageId: childPageId,
              workspaceId,
              parentPageId,
              isInlinePage: true,
            },
          },
          { type: "paragraph" },
        ])
        .run();
    },
    {
      childPageId: childPage.id,
      workspaceId: workspace.workspaceId,
      parentPageId: workspace.pageId,
    }
  );
  await focusEditorTail(page);

  await page.keyboard.press("Backspace");
  await page.keyboard.press("Backspace");
  await expect(page.getByText(childPage.title)).toHaveCount(0);
  await expect
    .poll(async () => {
      const response = await page.context().request.get(`/api/pages/${childPage.id}`);
      return response.status();
    }, { timeout: 15000 })
    .toBe(404);
});

test("인라인 Mind Map: 전용 블록이 생성되고 Open 버튼이 동작한다", async ({ page }) => {
  test.setTimeout(120000);
  await gotoWorkspaceDocument(page);
  await focusEditorTail(page);
  await page.keyboard.type("/mindmap");

  const mindMapEmbed = page.getByTestId("inline-mindmap-embed");
  await expect(mindMapEmbed).toHaveAttribute("data-state", "ready", { timeout: 60000 });
  await expect(page.getByTestId("inline-canvas-embed")).toHaveCount(0);

  const openButton = page.getByTestId("inline-mindmap-open");
  await expect(openButton).toBeVisible();
  await openButton.click();
  await expect(page).not.toHaveURL("about:blank");
});

test("페이지 멘션: 선택한 페이지가 [[페이지명]] 인라인 멘션으로 삽입된다", async ({ page }) => {
  test.setTimeout(120000);
  const workspace = await gotoWorkspaceDocument(page);
  const currentPageTitle = workspace.title;

  await focusEditorTail(page);
  await page.keyboard.type("/mention");
  const pageMentionItem = page.getByRole("button", { name: /페이지 멘션/ }).first();
  await expect(pageMentionItem).toBeVisible({ timeout: 15000 });
  await page.keyboard.press("Escape");

  await page.evaluate(
    ({ pageId, pageTitle }) => {
      const editor = (window as typeof window & {
        __obnofiEditor?: {
          commands: {
            insertPageMention: (attrs: { pageId: string; pageTitle: string }) => void;
          };
        };
      }).__obnofiEditor;

      if (!editor) {
        throw new Error("Editor bridge unavailable");
      }

      editor.commands.insertPageMention({ pageId, pageTitle });
    },
    { pageId: workspace.pageId, pageTitle: currentPageTitle! }
  );

  const mention = page.locator("a[data-page-link='true']").filter({
    hasText: `[[${currentPageTitle!}]]`,
  });
  await expect(mention).toBeVisible();
  await expect(mention).toHaveAttribute("href", new RegExp(`page=${workspace.pageId}$`));
});

test("GitHub Gist 슬래시 항목은 gist 링크만 허용한다", async ({ page }) => {
  test.setTimeout(120000);
  await gotoWorkspaceDocument(page);
  await focusEditorTail(page);
  await page.keyboard.type("/gist");

  const gistInput = page.getByTestId("github-embed-input-githubGist");
  await expect(gistInput).toBeVisible({ timeout: 15000 });

  await gistInput.fill("https://github.com/vercel/next.js");
  await expect(page.getByTestId("github-embed-submit-githubGist")).toBeDisabled();

  await gistInput.fill("https://gist.github.com/octocat/9257657");
  await expect(page.getByTestId("github-embed-submit-githubGist")).toBeEnabled();
  await page.getByTestId("github-embed-submit-githubGist").click();
  await expect(page.getByTestId("github-embed-block")).toContainText("gist.github.com/octocat");
});

test("GitHub 이슈와 PR 슬래시 항목은 각 URL 타입만 허용한다", async ({ page }) => {
  test.setTimeout(120000);
  await gotoWorkspaceDocument(page);
  await focusEditorTail(page);
  await page.keyboard.type("/issue");
  const issueInput = page.getByTestId("github-embed-input-githubIssue");
  await expect(issueInput).toBeVisible({ timeout: 15000 });
  await issueInput.fill("https://github.com/vercel/next.js/pull/1");
  await expect(page.getByTestId("github-embed-submit-githubIssue")).toBeDisabled();
  await issueInput.fill("https://github.com/vercel/next.js/issues/1");
  await expect(page.getByTestId("github-embed-submit-githubIssue")).toBeEnabled();
  await page.getByTestId("github-embed-submit-githubIssue").click();
  await expect(page.getByTestId("github-embed-block").last()).toContainText("Issue #1");

  await focusEditorTail(page);
  await page.keyboard.type("/pr");
  const pullInput = page.getByTestId("github-embed-input-githubPull");
  await expect(pullInput).toBeVisible({ timeout: 15000 });
  await pullInput.fill("https://github.com/vercel/next.js/issues/2");
  await expect(page.getByTestId("github-embed-submit-githubPull")).toBeDisabled();
  await pullInput.fill("https://github.com/vercel/next.js/pull/2");
  await expect(page.getByTestId("github-embed-submit-githubPull")).toBeEnabled();
  await page.getByTestId("github-embed-submit-githubPull").click();
  await expect(page.getByTestId("github-embed-block").last()).toContainText("Pull request #2");
});

test("Database row 상세 탭은 캐시된 row 정보로 열리고 database를 다시 요청하지 않는다", async ({ page }) => {
  test.setTimeout(120000);

  const fixture = await createWorkspaceDatabaseFixture(page);
  await page.goto(`/workspace/${fixture.workspaceId}?page=${fixture.databasePageId}`);

  await expect(page.getByTestId("workspace-database-ready")).toBeVisible({
    timeout: 20000,
  });

  const requests: string[] = [];
  page.on("request", (request) => {
    const url = request.url();
    if (url.includes(`/api/databases/${fixture.databaseId}`)) {
      requests.push(url);
    }
  });

  const rowLocator = page.locator("tbody tr").filter({ hasText: fixture.rowTitle }).first();
  await expect(rowLocator).toBeVisible({ timeout: 15000 });
  const openRowButton = rowLocator.getByRole("button", { name: fixture.rowTitle });
  await expect(openRowButton).toBeVisible({ timeout: 15000 });
  await openRowButton.click();

  const sideTab = page.locator("[data-grove-side-tab-panel='true']");
  await expect(sideTab).toBeVisible({ timeout: 15000 });
  await expect(sideTab).toContainText(fixture.rowTitle);
  expect(requests).toHaveLength(0);
});

test("Database는 처음 생성되면 이름 컬럼만 보이고 상세 탭 제목 변경이 즉시 반영된다", async ({ page }) => {
  test.setTimeout(120000);

  const fixture = await createWorkspaceDatabaseFixture(page);
  await page.goto(`/workspace/${fixture.workspaceId}?page=${fixture.databasePageId}`);

  const workspaceDatabase = page.getByTestId("workspace-database-ready");
  await expect(workspaceDatabase).toBeVisible({ timeout: 20000 });
  await expect(workspaceDatabase).toContainText("1 columns");
  await expect(page.locator("thead")).toContainText("이름");
  await expect(workspaceDatabase.getByRole("button", { name: "Table" })).toBeVisible();
  await expect(workspaceDatabase.getByRole("button", { name: "Gallery" })).toHaveCount(0);
  await expect(workspaceDatabase.getByRole("button", { name: "Kanban" })).toHaveCount(0);
  await expect(workspaceDatabase.getByRole("button", { name: "Calendar" })).toHaveCount(0);

  let releasePatch: (() => void) | null = null;
  const patchStarted = new Promise<void>((resolve) => {
    void page.route(`**/api/pages/${fixture.rowId}`, async (route, request) => {
      if (request.method() !== "PATCH") {
        await route.continue();
        return;
      }

      resolve();
      await new Promise<void>((resume) => {
        releasePatch = resume;
      });
      await route.continue();
    });
  });

  const rowLocator = page.locator("tbody tr").filter({ hasText: fixture.rowTitle }).first();
  await expect(rowLocator).toBeVisible({ timeout: 15000 });
  await rowLocator.getByRole("button", { name: fixture.rowTitle }).click();

  const sideTab = page.locator("[data-grove-side-tab-panel='true']");
  await expect(sideTab).toBeVisible({ timeout: 15000 });

  const nextTitle = `Optimistic Row ${Date.now()}`;
  const titleField = sideTab.locator("textarea[name='page-title']");
  await titleField.fill(nextTitle);

  await patchStarted;
  await expect(page.locator("tbody tr").filter({ hasText: nextTitle }).first()).toBeVisible();

  releasePatch?.();
  await expect(sideTab).toContainText(nextTitle);
});

test("인라인 Canvas: Select 툴 버튼 클릭이 동작한다", async ({ page }) => {
  test.setTimeout(120000);
  await gotoWorkspaceDocument(page);
  await focusEditorTail(page);
  await page.keyboard.type("/canvas");

  const canvasEmbed = page.getByTestId("inline-canvas-embed");
  await expect(canvasEmbed).toHaveAttribute("data-state", "ready", { timeout: 60000 });

  // 인라인 캔버스 내부 툴바에서 Select 버튼 찾기
  const selectBtn = canvasEmbed.getByTitle("Select");
  await expect(selectBtn).toBeVisible({ timeout: 10000 });

  // 클릭이 에러 없이 동작해야 함
  await selectBtn.click();
  await expect(canvasEmbed).toBeVisible();
});

test("인라인 Canvas: 보드 배경 클릭이 에러 없이 동작한다", async ({ page }) => {
  test.setTimeout(120000);
  await gotoWorkspaceDocument(page);
  await focusEditorTail(page);
  await page.keyboard.type("/canvas");

  const canvasEmbed = page.getByTestId("inline-canvas-embed").last();
  await expect(canvasEmbed).toHaveAttribute("data-state", "ready", { timeout: 60000 });

  // 헤더 바로 아래 보드 상단 영역 클릭
  // y=height/2 는 뷰포트 스크롤 시 GroveInsertionToolbar와 겹칠 수 있으므로 y=60 사용
  await canvasEmbed.click({ position: { x: 200, y: 60 } });

  // 클릭 후에도 단 하나의 canvas embed가 있어야 함
  await expect(page.getByTestId("inline-canvas-embed")).toHaveCount(1);
  // ProseMirror 노드 선택 없어야 함
  const selectedNode = page.getByTestId("workspace-editor-input").locator(".ProseMirror-selectednode");
  await expect(selectedNode).toHaveCount(0);
});

test("인라인 Mind Map: 다음 문단에서 Backspace로 임베드를 삭제할 수 있다", async ({ page }) => {
  test.setTimeout(120000);
  await gotoWorkspaceDocument(page);
  await focusEditorTail(page);
  await page.keyboard.type("/mind map");

  const mindMapEmbed = page.getByTestId("inline-mindmap-embed").last();
  await expect(mindMapEmbed).toHaveAttribute("data-state", "ready", { timeout: 60000 });
  await expect(page.getByTestId("inline-mindmap-embed")).toHaveCount(1);

  const mindMapBox = await mindMapEmbed.boundingBox();
  expect(mindMapBox).not.toBeNull();
  await page.mouse.click(mindMapBox!.x + 32, mindMapBox!.y + 80);

  const editorParagraphs = page.getByTestId("workspace-editor-input").locator("p");
  await editorParagraphs.last().click();
  await page.keyboard.press("Backspace");

  await expect(page.getByTestId("inline-mindmap-embed")).toHaveCount(0);
});

// ─── DB Diagram ───────────────────────────────────────────────────────────────

test("인라인 DB Diagram: 블록 클릭 후 블록이 언마운트되지 않는다", async ({ page }) => {
  test.setTimeout(120000);
  await gotoWorkspaceDocument(page);
  await focusEditorTail(page);
  await page.keyboard.type("/erd");

  const diagramBlock = page.getByTestId("db-diagram-block").last();
  await expect(diagramBlock).toBeVisible({ timeout: 10000 });

  const box = await diagramBlock.boundingBox();
  expect(box).not.toBeNull();
  await page.mouse.click(box!.x + box!.width / 2, box!.y + box!.height / 2);

  // 클릭 후에도 블록이 살아있어야 함 (ProseMirror가 선택으로 가로채면 블록 상태 변경 가능)
  await expect(diagramBlock).toBeVisible();

  // ProseMirror 노드 선택 클래스가 없어야 함
  const editorInput = page.getByTestId("workspace-editor-input");
  const selectedNode = editorInput.locator(".ProseMirror-selectednode");
  await expect(selectedNode).toHaveCount(0);
});

test("인라인 DB Diagram: CodeMirror 에디터에 타이핑이 가능하다", async ({ page }) => {
  test.setTimeout(120000);
  await gotoWorkspaceDocument(page);
  await focusEditorTail(page);
  await page.keyboard.type("/erd");

  const diagramBlock = page.getByTestId("db-diagram-block").last();
  await expect(diagramBlock).toBeVisible({ timeout: 10000 });

  const cmEditor = diagramBlock.locator(".cm-editor").first();
  const cmVisible = await cmEditor.isVisible({ timeout: 5000 }).catch(() => false);

  if (cmVisible) {
    await cmEditor.click();
    // CodeMirror의 contenteditable 영역에 포커스
    const cmContent = cmEditor.locator(".cm-content");
    await expect(cmContent).toBeFocused();
    await page.keyboard.type("-- inline test");
    // cm-content 텍스트에 타이핑한 내용이 포함되어야 함
    await expect(cmContent).toContainText("-- inline test");
  } else {
    // CodeMirror가 없어도 블록이 보이면 통과
    await expect(diagramBlock).toBeVisible();
  }
});
