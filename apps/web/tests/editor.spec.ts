import { test, expect } from "@playwright/test";

const editorText = `playwright-note-${Date.now()}`;
const nextTitle = `Playwright Title ${Date.now()}`;
const tinyPng = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aM9sAAAAASUVORK5CYII=",
  "base64"
);
const tinyMp3 = Buffer.from("SUQzAwAAAAAA", "base64");
const tinyMp4 = Buffer.from("AAAAIGZ0eXBpc29tAAACAGlzb20=", "base64");

async function signInAsDeveloper(page: import("@playwright/test").Page) {
  const request = page.context().request;
  const csrfResponse = await request.get("/api/auth/csrf");
  const { csrfToken } = (await csrfResponse.json()) as { csrfToken: string };

  await request.post("/api/auth/callback/credentials", {
    form: {
      csrfToken,
      callbackUrl: "/workspace",
      json: "true",
    },
  });
}

async function gotoWorkspaceDocument(
  page: import("@playwright/test").Page,
  content: object = { type: "doc", content: [{ type: "paragraph" }] }
) {
  await signInAsDeveloper(page);
  await page.goto("/workspace");
  await expect(page).toHaveURL(/\/workspace\/[^/?]+/);

  const workspaceId =
    page.url().match(/\/workspace\/([^/?]+)/)?.[1];

  expect(workspaceId).toBeTruthy();

  const createPageResponse = await page.context().request.post("/api/pages", {
    data: {
      title: `Playwright Page ${Date.now()}`,
      type: "document",
      workspaceId,
      content,
    },
  });

  expect(createPageResponse.ok()).toBeTruthy();

  const createdPage = (await createPageResponse.json()) as { id: string };
  await page.goto(`/workspace/${workspaceId}?page=${createdPage.id}`);
  await expect(page.getByTestId("workspace-editor")).toBeVisible({ timeout: 15000 });
}

async function focusEditorTail(page: import("@playwright/test").Page) {
  const editor = page.getByTestId("workspace-editor-input");
  const lastParagraph = editor.locator("p").last();

  await expect(editor).toBeVisible({ timeout: 15000 });
  await expect(lastParagraph).toBeVisible({ timeout: 15000 });
  await lastParagraph.click();

  return editor;
}

async function insertSlashCommand(
  page: import("@playwright/test").Page,
  query: string,
  title: string
) {
  await focusEditorTail(page);
  await page.keyboard.type(query);
  const item = page.getByRole("button", { name: new RegExp(title) }).first();
  await expect(item).toBeVisible({ timeout: 15000 });
  await item.click();
}

test("Tiptap 블록 에디터 기본 동작", async ({ page }) => {
  await gotoWorkspaceDocument(page);

  const editor = await focusEditorTail(page);
  await page.keyboard.type(editorText);

  await expect(editor).toContainText(editorText);
});

test("[ ] 입력시 체크박스 할일 블록이 삽입된다", async ({ page }) => {
  await gotoWorkspaceDocument(page);

  const editor = await focusEditorTail(page);
  await page.keyboard.type("[ ] 할 일");
  await page.keyboard.press("Space");

  const taskItem = editor.locator('li[data-type="taskItem"]').last();
  const checkbox = taskItem.locator('input[type="checkbox"]').first();

  await expect(taskItem).toBeVisible();
  await expect(taskItem).toContainText("할 일");
  await expect(checkbox).not.toBeChecked();
});

test("워크스페이스 진입 후 에디터가 표시된다", async ({ page }) => {
  await gotoWorkspaceDocument(page);

  await expect(page.getByTestId("workspace-editor")).toBeVisible();
  await expect(page.getByTestId("workspace-editor-input")).toBeVisible();
  await expect(page.getByTestId("workspace-page-title")).toHaveValue(/.+/);
});

test("문서 제목을 수정할 수 있다", async ({ page }) => {
  await gotoWorkspaceDocument(page);

  const titleInput = page.getByTestId("workspace-page-title");
  await titleInput.fill(nextTitle);

  await expect(titleInput).toHaveValue(nextTitle);
  await expect(page.getByTestId("workspace-sidebar")).toContainText(nextTitle);
});

test("목차 항목을 클릭하면 해당 Grove 제목으로 이동한다", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });

  const fillerParagraphs = Array.from({ length: 80 }, (_, index) => ({
    type: "paragraph",
    content: [{ type: "text", text: `Grove filler line ${index + 1}` }],
  }));

  await gotoWorkspaceDocument(page, {
    type: "doc",
    content: [
      { type: "heading", attrs: { level: 1 }, content: [{ type: "text", text: "Canopy Start" }] },
      ...fillerParagraphs,
      { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Deep Grove Section" }] },
      { type: "paragraph", content: [{ type: "text", text: "Arrived at the section." }] },
    ],
  });

  const targetHeading = page.getByRole("heading", { name: "Deep Grove Section" });
  const tocButton = page.getByRole("button", { name: "Deep Grove Section" });

  await expect(tocButton).toBeVisible();

  const beforeScrollTop = await page.evaluate(() => {
    const surface = document.querySelector('[data-testid="grove-page-surface"]');
    return Math.max(
      surface instanceof HTMLElement ? surface.scrollTop : 0,
      window.scrollY
    );
  });
  await tocButton.click();

  await expect
    .poll(() =>
      page.evaluate(() => {
        const surface = document.querySelector('[data-testid="grove-page-surface"]');
        return Math.max(
          surface instanceof HTMLElement ? surface.scrollTop : 0,
          window.scrollY
        );
      })
    )
    .toBeGreaterThan(beforeScrollTop);

  const targetTop = await targetHeading.evaluate(
    (heading) => heading.getBoundingClientRect().top
  );

  expect(targetTop).toBeGreaterThanOrEqual(0);
  expect(targetTop).toBeLessThan(280);
});

test("/canvas 입력시 인라인 캔버스가 삽입된다", async ({ page }) => {
  await gotoWorkspaceDocument(page);

  await focusEditorTail(page);
  await page.keyboard.type("/canvas");

  const canvasEmbed = page.getByTestId("inline-canvas-embed");
  await expect(canvasEmbed).toHaveAttribute("data-state", "ready");
  await expect(page.getByTestId("inline-canvas-ready")).toBeVisible();
  await expect(page.getByTestId("inline-canvas-open")).toBeVisible();
  await expect(page.getByTestId("inline-canvas")).toBeVisible();
});

test("/image 입력시 이미지 블록을 추가하고 파일 업로드를 반영한다", async ({ page }) => {
  await gotoWorkspaceDocument(page);

  await insertSlashCommand(page, "/image", "이미지");

  const imageBlock = page.getByTestId("grove-image-block").last();
  await expect(imageBlock).toBeVisible();

  const fileInput = imageBlock.locator('input[type="file"]');
  await fileInput.setInputFiles({
    name: "grove-seed.png",
    mimeType: "image/png",
    buffer: tinyPng,
  });

  await expect(imageBlock.locator("img")).toHaveAttribute("src", /^(data:|blob:|https?:)/);
});

test("새로고침 시 legacy 인라인 캔버스 블록이 무한 재요청하지 않는다", async ({ page }) => {
  test.setTimeout(90000);
  await signInAsDeveloper(page);
  await page.goto("/workspace");
  await expect(page).toHaveURL(/\/workspace\/[^/?]+/);

  const workspaceId =
    page.url().match(/\/workspace\/([^/?]+)/)?.[1];

  expect(workspaceId).toBeTruthy();

  const parentPageResponse = await page.context().request.post("/api/pages", {
    data: {
      title: `Canvas Parent ${Date.now()}`,
      type: "document",
      workspaceId,
      content: {
        type: "doc",
        content: [
          {
            type: "canvasEmbed",
            attrs: {
              pageId: null,
              workspaceId,
              parentPageId: "legacy-parent-placeholder",
              autoCreate: false,
            },
          },
        ],
      },
    },
  });

  expect(parentPageResponse.ok()).toBeTruthy();

  const parentPage = (await parentPageResponse.json()) as { id: string };

  const patchedParentResponse = await page.context().request.patch(
    `/api/pages/${parentPage.id}`,
    {
      data: {
        content: {
          type: "doc",
          content: [
            {
              type: "canvasEmbed",
              attrs: {
                pageId: null,
                workspaceId,
                parentPageId: parentPage.id,
                autoCreate: false,
              },
            },
          ],
        },
      },
    }
  );

  expect(patchedParentResponse.ok()).toBeTruthy();

  let workspacePageListRequests = 0;
  await page.route(`**/api/pages?workspaceId=${workspaceId}`, async (route) => {
    workspacePageListRequests += 1;
    await route.continue();
  });

  await page.goto(`/workspace/${workspaceId}?page=${parentPage.id}`);
  await expect(page.getByTestId("workspace-editor")).toBeVisible({ timeout: 15000 });
  await expect(page.getByTestId("inline-canvas-collapsed")).toBeVisible({ timeout: 10000 });
  await page.reload();
  await expect(page.getByTestId("workspace-editor")).toBeVisible({ timeout: 15000 });
  await expect(page.getByTestId("inline-canvas-collapsed")).toBeVisible({ timeout: 10000 });
  await page.waitForTimeout(2500);

  expect(workspacePageListRequests).toBeLessThanOrEqual(2);
});

test("/database 입력시 인라인 데이터베이스가 삽입된다", async ({ page }) => {
  test.setTimeout(60000);
  await gotoWorkspaceDocument(page);

  await focusEditorTail(page);
  await page.keyboard.type("/database");

  const databaseEmbed = page.getByTestId("inline-database-embed").last();
  await expect(databaseEmbed).toHaveAttribute("data-state", "ready", { timeout: 20000 });
  await expect(page.getByTestId("inline-database-ready").last()).toBeVisible({ timeout: 20000 });
  await expect(page.getByTestId("inline-database-select")).toHaveCount(0);
  await expect(databaseEmbed.getByRole("button", { name: "Open" })).toHaveCount(0);
});

test("/github 입력시 GitHub 임베드 블록이 삽입된다", async ({ page }) => {
  await gotoWorkspaceDocument(page);

  await focusEditorTail(page);
  await page.keyboard.type("/github");
  await page.keyboard.press("Enter");

  const githubEmbed = page.getByTestId("github-embed-block").last();
  await expect(githubEmbed).toBeVisible();

  await githubEmbed
    .getByLabel("GitHub URL")
    .fill("https://github.com/openai/codex/pull/1");
  await githubEmbed.getByRole("button", { name: "임베드" }).click();

  await expect(githubEmbed.getByRole("link")).toHaveAttribute(
    "href",
    "https://github.com/openai/codex/pull/1"
  );
  await expect(githubEmbed).toContainText("Pull request #1");
  await expect(githubEmbed).toContainText("openai/codex#1");

  await githubEmbed.hover();
  const blockHandle = page.getByRole("button", { name: "블록 이동" });
  await expect(blockHandle).toBeVisible();
  const handleBox = await blockHandle.boundingBox();
  expect(handleBox).not.toBeNull();
  await page.mouse.move(handleBox!.x + handleBox!.width / 2, handleBox!.y + handleBox!.height / 2);
  await page.mouse.down();
  await page.mouse.up();
  // pointer simulation triggers selectBlockNode but loses editor focus — restore it
  await page.evaluate(() => {
    (document.querySelector(".ProseMirror") as HTMLElement)?.focus();
  });
  await page.keyboard.press("Backspace");
  await expect(githubEmbed).toBeHidden();
});

test("/button 입력시 버튼 블록이 삽입된다", async ({ page }) => {
  await gotoWorkspaceDocument(page);

  await focusEditorTail(page);
  await page.keyboard.type("/button");
  await page.keyboard.press("Enter");

  const buttonBlock = page.getByTestId("button-block").last();
  await expect(buttonBlock).toBeVisible();
  await expect(page.getByTestId("button-block-preview").last()).toContainText("Button");
  await expect(page.getByTestId("button-block-label").last()).toHaveValue("Button");
  await expect(page.getByTestId("button-block-url").last()).toHaveValue("");
});

test("API 테스터 블록은 로컬 API 요청을 실행하고 응답을 보여준다", async ({ page }) => {
  await gotoWorkspaceDocument(page);

  await insertSlashCommand(page, "/api", "API 테스터");

  const apiTester = page.getByTestId("api-tester-block").last();
  await expect(apiTester).toBeVisible();

  await apiTester.locator('input[placeholder="https://api.example.com/v1/resource"]').fill("/api/auth/csrf");
  await apiTester.getByRole("button", { name: "요청 보내기" }).click();

  await expect(apiTester).toContainText("200");
  await expect(apiTester).toContainText("csrfToken");
});

test("/video 입력시 동영상 블록을 추가하고 파일 업로드를 반영한다", async ({ page }) => {
  await gotoWorkspaceDocument(page);

  await insertSlashCommand(page, "/video", "동영상");

  const videoBlock = page.getByTestId("video-block").last();
  await expect(videoBlock).toBeVisible();

  await videoBlock.locator('input[type="file"]').setInputFiles({
    name: "grove-clip.mp4",
    mimeType: "video/mp4",
    buffer: tinyMp4,
  });

  await expect(videoBlock.locator("video")).toHaveAttribute("src", /^(data:|blob:|https?:)/);
});

test("/audio 입력시 오디오 블록을 추가하고 파일 업로드를 반영한다", async ({ page }) => {
  await gotoWorkspaceDocument(page);

  await insertSlashCommand(page, "/audio", "오디오");

  const audioBlock = page.getByTestId("audio-block").last();
  await expect(audioBlock).toBeVisible();

  await audioBlock.locator('input[type="file"]').setInputFiles({
    name: "grove-sound.mp3",
    mimeType: "audio/mpeg",
    buffer: tinyMp3,
  });

  await expect(audioBlock.locator("audio")).toHaveAttribute("src", /^(data:|blob:|https?:)/);
});

test("/file 입력시 파일 블록을 추가하고 첨부 목록을 렌더링한다", async ({ page }) => {
  await gotoWorkspaceDocument(page);

  await insertSlashCommand(page, "/file", "파일");

  const fileBlock = page.getByTestId("file-block").last();
  await expect(fileBlock).toBeVisible();

  await fileBlock.locator('input[type="file"]').setInputFiles({
    name: "grove-doc.txt",
    mimeType: "text/plain",
    buffer: Buffer.from("obnofi file attachment"),
  });

  await expect(fileBlock).toContainText("grove-doc.txt");
});

test("/bookmark 입력시 북마크 블록을 추가하고 링크 카드가 만들어진다", async ({ page }) => {
  await gotoWorkspaceDocument(page);

  await insertSlashCommand(page, "/bookmark", "북마크");

  const bookmarkBlock = page.getByTestId("bookmark-block").last();
  await expect(bookmarkBlock).toBeVisible();

  const inputs = bookmarkBlock.locator("input");
  await inputs.nth(0).fill("example.com/docs");
  await inputs.nth(0).blur();
  await inputs.nth(1).fill("Docs Bookmark");

  await expect(bookmarkBlock.getByRole("link")).toHaveAttribute("href", "https://example.com/docs");
  await expect(bookmarkBlock).toContainText("Docs Bookmark");
});

test("/embed 입력시 링크 임베드 블록이 URL을 카드로 렌더링한다", async ({ page }) => {
  await gotoWorkspaceDocument(page);

  await insertSlashCommand(page, "/embed", "링크 임베드");

  const embedBlock = page.getByTestId("link-embed-block-embed").last();
  await expect(embedBlock).toBeVisible();

  await embedBlock.getByTestId("link-embed-input-embed").fill("https://example.com/reference");
  await embedBlock.getByTestId("link-embed-input-embed").blur();

  await expect(embedBlock.getByRole("link")).toHaveAttribute("href", "https://example.com/reference");
  await expect(embedBlock).toContainText("example.com");
});

test("/google 입력시 Google Drive 임베드 블록이 Drive 링크를 렌더링한다", async ({ page }) => {
  await gotoWorkspaceDocument(page);

  await insertSlashCommand(page, "/google", "Google Drive");

  const driveBlock = page.getByTestId("link-embed-block-googleDrive").last();
  await expect(driveBlock).toBeVisible();

  await driveBlock
    .getByTestId("link-embed-input-googleDrive")
    .fill("https://drive.google.com/file/d/abc123/view");
  await driveBlock.getByTestId("link-embed-input-googleDrive").blur();

  await expect(driveBlock.getByRole("link")).toHaveAttribute(
    "href",
    "https://drive.google.com/file/d/abc123/view"
  );
  await expect(driveBlock).toContainText("Google Drive");
});

test("/tweet 입력시 Tweet 임베드 블록이 X 링크를 렌더링한다", async ({ page }) => {
  await gotoWorkspaceDocument(page);

  await insertSlashCommand(page, "/tweet", "Tweet");

  const tweetBlock = page.getByTestId("link-embed-block-tweet").last();
  await expect(tweetBlock).toBeVisible();

  await tweetBlock
    .getByTestId("link-embed-input-tweet")
    .fill("https://x.com/openai/status/1234567890");
  await tweetBlock.getByTestId("link-embed-input-tweet").blur();

  await expect(tweetBlock.getByRole("link")).toHaveAttribute(
    "href",
    "https://x.com/openai/status/1234567890"
  );
  await expect(tweetBlock).toContainText("@openai");
});

test(": 입력시 기본 이모지 탭에서 이모지를 삽입할 수 있다", async ({ page }) => {
  await gotoWorkspaceDocument(page);

  const editor = await focusEditorTail(page);
  await page.keyboard.type(":seed");
  await page.keyboard.press("Enter");

  await expect(editor).toContainText("🌱");
});

test("이미지를 잘라 개인 이모지로 추가할 수 있다", async ({ page }) => {
  await gotoWorkspaceDocument(page);

  const editor = await focusEditorTail(page);
  await page.keyboard.type(":");
  await page.locator('input[type="file"][accept="image/*"]:not([name])').setInputFiles({
    name: "grove.png",
    mimeType: "image/png",
    buffer: Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAAFElEQVR42mP8z8Dwn4GBgYGJAQoAHxcCA8uBbrQAAAAASUVORK5CYII=",
      "base64"
    ),
  });

  await page.getByPlaceholder("my-emoji").fill("grove");
  await page.getByRole("button", { name: "잘라서 추가" }).click();

  await expect(editor.locator('img[data-obnofi-custom-emoji][title=":grove:"]').last()).toBeVisible();
});

test("그래프 뷰에서도 사이드바가 유지된다", async ({ page }) => {
  await gotoWorkspaceDocument(page);

  await page.getByTestId("graph-view-link").click();

  await expect(page.getByTestId("workspace-graph-page")).toBeVisible();
  await expect(page.getByTestId("workspace-sidebar")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Graph View" })).toBeVisible();
  await expect(page.getByTestId("graph-back-link")).toBeVisible();
});

test("사이드바를 숨기고 다시 열 수 있다", async ({ page }) => {
  await gotoWorkspaceDocument(page);

  const sidebar = page.getByTestId("workspace-sidebar");
  await expect(sidebar).toBeVisible();

  await page.getByRole("button", { name: "사이드바 숨기기" }).click();
  await expect(page.getByRole("button", { name: "사이드바 열기" })).toBeVisible();

  await page.getByRole("button", { name: "사이드바 열기" }).click();
  await expect(sidebar).toBeVisible();
});

test("사이드바 너비를 조절할 수 있다", async ({ page }) => {
  await gotoWorkspaceDocument(page);

  const sidebar = page.getByTestId("workspace-sidebar");
  const resizeHandle = page.getByRole("button", { name: "사이드바 너비 조절" });
  const beforeBox = await sidebar.boundingBox();
  const handleBox = await resizeHandle.boundingBox();

  expect(beforeBox).not.toBeNull();
  expect(handleBox).not.toBeNull();

  await page.mouse.move(
    handleBox!.x + handleBox!.width / 2,
    handleBox!.y + handleBox!.height / 2
  );
  await page.mouse.down();
  await page.mouse.move(handleBox!.x + 80, handleBox!.y + handleBox!.height / 2, {
    steps: 8,
  });
  await page.mouse.up();

  const afterBox = await sidebar.boundingBox();
  expect(afterBox).not.toBeNull();
  expect(afterBox!.width).toBeGreaterThan(beforeBox!.width);
});

test("블록 핸들을 드래그해 블록 순서를 바꿀 수 있다", async ({ page }) => {
  await gotoWorkspaceDocument(page, {
    type: "doc",
    content: [
      { type: "paragraph", content: [{ type: "text", text: "Welcome to Obnofi" }] },
      { type: "paragraph", content: [{ type: "text", text: "Features" }] },
    ],
  });

  const sourceBlock = page
    .locator("[data-grove-block='true']")
    .filter({ hasText: "Welcome to Obnofi" })
    .first();
  const targetBlock = page
    .locator("[data-grove-block='true']")
    .filter({ hasText: "Features" })
    .first();

  await expect(sourceBlock).toBeVisible();
  await expect(targetBlock).toBeVisible();

  await sourceBlock.hover();

  const moveHandle = page.getByRole("button", { name: "블록 이동" });
  await expect(moveHandle).toBeVisible();

  const handleBox = await moveHandle.boundingBox();
  const targetBox = await targetBlock.boundingBox();

  expect(handleBox).not.toBeNull();
  expect(targetBox).not.toBeNull();

  await page.mouse.move(
    handleBox!.x + handleBox!.width / 2,
    handleBox!.y + handleBox!.height / 2
  );
  await page.mouse.down();
  await page.mouse.move(targetBox!.x + 4, targetBox!.y + targetBox!.height - 6, { steps: 12 });
  await page.mouse.up();

  const blockTexts = await page.locator("[data-grove-block='true']").evaluateAll((nodes) =>
    nodes.map((node) => node.textContent?.replace(/\s+/g, " ").trim() ?? "")
  );

  expect(blockTexts.indexOf("Welcome to Obnofi")).toBeGreaterThan(
    blockTexts.indexOf("Features")
  );
});
