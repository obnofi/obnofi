import { expect, test } from "@playwright/test";

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

test("공개 Forest 피드와 스냅샷 상세가 렌더링된다", async ({ page }) => {
  await page.goto("/forest");

  await expect(page.getByRole("heading", { name: "지식을 확장하세요" })).toBeVisible();
  await expect(page.getByText("이번 주 인기 Snapshot")).toBeVisible();

  await page.getByRole("link", { name: /Codex for every role, tool, and workflow/i }).click();

  await expect(page).toHaveURL(/\/p\/forest-openai-codex-workflows/);
  await expect(page.getByRole("heading", { name: "Codex for every role, tool, and workflow" })).toBeVisible();
  await expect(page.getByLabel("Published Grove content")).toBeVisible();
});

test("워크스페이스 Forest 스크롤 컨테이너가 동작한다", async ({ page }) => {
  await signInAsDeveloper(page);
  await page.goto("/workspace");
  await expect(page).toHaveURL(/\/workspace\/[^/?]+/);

  const workspaceId = page.url().match(/\/workspace\/([^/?]+)/)?.[1];
  expect(workspaceId).toBeTruthy();

  await page.goto(`/workspace/${workspaceId}/forest`);

  const scrollSurface = page.getByTestId("workspace-forest-scroll");
  await expect(scrollSurface).toBeVisible();
  await expect(scrollSurface.getByText("이번 주 인기 Snapshot")).toBeVisible();

  const dimensions = await scrollSurface.evaluate((node) => ({
    clientHeight: node.clientHeight,
    scrollHeight: node.scrollHeight,
  }));

  expect(dimensions.scrollHeight).toBeGreaterThan(dimensions.clientHeight);

  await scrollSurface.evaluate((node) => {
    node.scrollTop = 600;
  });

  await expect
    .poll(() => scrollSurface.evaluate((node) => node.scrollTop))
    .toBeGreaterThan(0);
});
