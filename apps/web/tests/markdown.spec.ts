import { test, expect } from "@playwright/test";

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
  content: object = { type: "doc", content: [{ type: "paragraph" }] },
  waitForText?: string
) {
  await signInAsDeveloper(page);
  await page.goto("/workspace");
  await expect(page).toHaveURL(/\/workspace\/[^/?]+/);

  const workspaceId =
    page.url().match(/\/workspace\/([^/?]+)/)?.[1];

  expect(workspaceId).toBeTruthy();

  const createPageResponse = await page.context().request.post("/api/pages", {
    data: {
      title: `Markdown E2E ${Date.now()}`,
      type: "document",
      workspaceId,
      content,
    },
  });

  expect(createPageResponse.ok()).toBeTruthy();

  const createdPage = (await createPageResponse.json()) as { id: string };
  await page.goto(`/workspace/${workspaceId}?page=${createdPage.id}`);
  await expect(page.getByTestId("workspace-editor")).toBeVisible({ timeout: 15000 });

  if (waitForText) {
    const editor = page.getByTestId("workspace-editor-input");
    await expect(editor).toContainText(waitForText, { timeout: 15000 });
  }

  return { workspaceId, pageId: createdPage.id };
}

function mdToTiptap(markdown: string): object {
  type T = { type: string; attrs?: Record<string, unknown>; content?: T[]; text?: string; marks?: Array<{ type: string; attrs?: Record<string, unknown> }> };

  function txt(t: string): T { return { type: "text", text: t }; }
  function mark(nodes: T[], m: { type: string; attrs?: Record<string, unknown> }): T[] {
    return nodes.map((n) => n.type === "text" ? { ...n, marks: [...(n.marks ?? []), m] } : n);
  }

  function findMatch(text: string) {
    const ps = [
      { type: "image", regex: /!\[([^\]]*)\]\(([^)]+)\)/ },
      { type: "link", regex: /\[([^\]]*)\]\(([^)]+)\)/ },
      { type: "code", regex: /`([^`\n]+)`/ },
      { type: "strike", regex: /~~([^~\n]+)~~/ },
      { type: "bold", regex: /\*\*(?=\S)([^*]+?)(?<=\S)\*\*|__(?=\S)([^_]+?)(?<=\S)__/ },
      { type: "italic", regex: /(?<!\*)\*(?!\*)(?=\S)([^*]+?)(?<=\S)\*(?!\*)|(?<!_)_(?!_)(?=\S)([^_]+?)(?<=\S)_(?!_)/ },
    ] as const;
    let best: { type: (typeof ps)[number]["type"]; match: RegExpMatchArray } | null = null;
    for (const p of ps) {
      const m = text.match(p.regex);
      if (!m || typeof m.index !== "number") continue;
      if (!best || m.index < (best.match.index ?? Infinity)) best = { type: p.type, match: m };
    }
    return best;
  }

  function parseInline(text: string): T[] {
    if (!text) return [];
    const next = findMatch(text);
    if (!next) return [txt(text)];
    const si = next.match.index ?? 0;
    const fm = next.match[0];
    const inner = next.match[1] ?? next.match[2] ?? "";
    const nodes: T[] = [];
    if (si > 0) nodes.push(txt(text.slice(0, si)));
    if (next.type === "link") {
      nodes.push({ type: "text", text: (next.match[1] ?? "") || (next.match[2] ?? ""), marks: [{ type: "link", attrs: { href: next.match[2] ?? "" } }] });
    } else if (next.type === "image") {
      const alt = next.match[1] ?? "";
      const src = next.match[2] ?? "";
      nodes.push({
        type: "text",
        text: alt || src,
        marks: [{ type: "link", attrs: { href: src } }],
      });
    } else if (inner) {
      const mt = next.type === "code" ? "code" : next.type === "bold" ? "bold" : next.type === "strike" ? "strike" : "italic";
      nodes.push(...mark(parseInline(inner), { type: mt }));
    } else { nodes.push(txt(fm)); }
    const rem = text.slice(si + fm.length);
    if (rem) nodes.push(...parseInline(rem));
    return nodes;
  }

  function para(text: string): T {
    const t = text.trim();
    return t ? { type: "paragraph", content: parseInline(t) } : { type: "paragraph" };
  }

  const TASK = /^[ ]{0,3}[-*+]\s+\[(?: |x|X)\](?:\s+.*)?$/;
  const TASK_ITEM = /^[ ]{0,3}[-*+]\s+\[( |x|X)\](?:\s+(.*))?$/;
  const BULLET = /^[ ]{0,3}[-*+]\s+(?!\[(?: |x|X)\](?:\s|$))(.*)$/;
  const ORDERED = /^[ ]{0,3}\d+\.\s+(.*)$/;
  const BQ = /^[ ]{0,3}>\s?(.*)$/;
  const HEADING = /^(#{1,6})\s+(.*)$/;
  const HR = /^(?:---|\*\*\*|___)\s*$/;
  const CODE = /^```/;
  const isBlock = (l: string) => HEADING.test(l) || TASK.test(l) || BULLET.test(l) || ORDERED.test(l) || BQ.test(l) || HR.test(l) || CODE.test(l);

  function parseBlocks(lines: string[]): T[] {
    const out: T[] = [];
    let i = 0;
    while (i < lines.length) {
      const l = lines[i];
      const t = l.trim();
      if (!t) { i++; continue; }
      if (CODE.test(t)) {
        const lang = l.slice(3).trim().split(/\s+/)[0]?.toLowerCase() ?? "";
        const cl: string[] = [];
        let j = i + 1;
        while (j < lines.length && !lines[j].startsWith("```")) { cl.push(lines[j]); j++; }
        if (j < lines.length && lines[j].startsWith("```")) j++;
        out.push({ type: "codeBlock", attrs: { language: lang || "plaintext", code: cl.join("\n"), isOpen: true } });
        i = j; continue;
      }
      if (HR.test(t)) { out.push({ type: "horizontalRule" }); i++; continue; }
      const imgMatch = t.match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
      if (imgMatch) { out.push({ type: "groveImageBlock", attrs: { src: imgMatch[2], alt: imgMatch[1], caption: "" } }); i++; continue; }
      const hm = t.match(HEADING);
      if (hm) { out.push({ type: "heading", attrs: { level: hm[1].length }, content: parseInline(hm[2].trim()) }); i++; continue; }
      if (TASK.test(l)) {
        const items: T[] = [];
        while (i < lines.length) {
          const m = lines[i].match(TASK_ITEM);
          if (!m) break;
          items.push({ type: "taskItem", attrs: { checked: m[1].toLowerCase() === "x" }, content: [para(m[2] ?? "")] });
          i++;
        }
        out.push({ type: "taskList", content: items }); continue;
      }
      if (BULLET.test(l)) {
        const items: T[] = [];
        while (i < lines.length) {
          const m = lines[i].match(BULLET);
          if (!m) break;
          items.push({ type: "listItem", content: [para(m[1])] });
          i++;
        }
        out.push({ type: "bulletList", content: items }); continue;
      }
      if (ORDERED.test(l)) {
        const items: T[] = [];
        let start = 1;
        while (i < lines.length) {
          const m = lines[i].match(ORDERED);
          if (!m) break;
          const nm = lines[i].match(/^(\d+)\./);
          if (i === /* first */ 0 && nm) start = parseInt(nm[1], 10);
          items.push({ type: "listItem", content: [para(m[1])] });
          i++;
        }
        out.push({ type: "orderedList", attrs: start > 1 ? { start } : {}, content: items }); continue;
      }
      if (BQ.test(l)) {
        const ql: string[] = [];
        while (i < lines.length) {
          const m = lines[i].match(BQ);
          if (!m) break;
          ql.push(m[1]); i++;
        }
        const ps: T[] = [];
        let cur: string[] = [];
        for (const q of ql) {
          if (q.trim() === "") { if (cur.length > 0) { ps.push(para(cur.join(" "))); cur = []; } } else cur.push(q);
        }
        if (cur.length > 0) ps.push(para(cur.join(" ")));
        if (ps.length === 0) ps.push(para(""));
        out.push({ type: "blockquote", content: ps }); continue;
      }
      const pl: string[] = [];
      while (i < lines.length) {
        const line = lines[i];
        if (!line.trim()) break;
        if (i > 0 && isBlock(line)) break;
        pl.push(line.trim()); i++;
      }
      out.push(para(pl.join(" ")));
    }
    return out;
  }

  const norm = markdown.replace(/\r\n?/g, "\n").trim();
  if (!norm) return { type: "doc", content: [{ type: "paragraph" }] };
  const lines = norm.split("\n");
  const content = parseBlocks(lines);
  return { type: "doc", content: content.length > 0 ? content : [{ type: "paragraph" }] };
}

test("markdown E2E: bold text inside paragraph is actually bold", async ({ page }) => {
  const doc = mdToTiptap("This is **important** text");
  await gotoWorkspaceDocument(page, doc, "important text");
  const editor = page.getByTestId("workspace-editor-input");
  const bold = editor.locator("strong");
  await expect(bold).toContainText("important");
});

test("markdown E2E: italic text is actually italic", async ({ page }) => {
  const doc = mdToTiptap("This is *emphasized* text");
  await gotoWorkspaceDocument(page, doc, "emphasized text");
  const editor = page.getByTestId("workspace-editor-input");
  const em = editor.locator("em");
  await expect(em).toContainText("emphasized");
});

test("markdown E2E: strikethrough text has line-through", async ({ page }) => {
  const doc = mdToTiptap("This is ~~deleted~~ text");
  await gotoWorkspaceDocument(page, doc, "deleted text");
  const editor = page.getByTestId("workspace-editor-input");
  const s = editor.locator("s");
  await expect(s).toContainText("deleted");
});

test("markdown E2E: inline code has code element", async ({ page }) => {
  const doc = mdToTiptap("Run `npm install` to start");
  await gotoWorkspaceDocument(page, doc, "npm install");
  const editor = page.getByTestId("workspace-editor-input");
  const code = editor.locator("code");
  await expect(code).toContainText("npm install");
});

test("markdown E2E: headings at all levels", async ({ page }) => {
  const doc = mdToTiptap("# H1\n## H2\n### H3\n#### H4\n##### H5\n###### H6");
  await gotoWorkspaceDocument(page, doc, "H1");
  const editor = page.getByTestId("workspace-editor-input");
  await expect(editor.locator("h1")).toContainText("H1");
  await expect(editor.locator("h2")).toContainText("H2");
  await expect(editor.locator("h3")).toContainText("H3");
  await expect(editor.locator("h4")).toContainText("H4");
  await expect(editor.locator("h5")).toContainText("H5");
  await expect(editor.locator("h6")).toContainText("H6");
});

test("markdown E2E: bullet list renders", async ({ page }) => {
  const doc = mdToTiptap("- item one\n- item two\n- item three");
  await gotoWorkspaceDocument(page, doc, "item one");
  const editor = page.getByTestId("workspace-editor-input");
  await expect(editor).toContainText("item one");
  await expect(editor).toContainText("item two");
  await expect(editor).toContainText("item three");
  const ul = editor.locator("ul");
  await expect(ul).toBeVisible();
});

test("markdown E2E: ordered list renders", async ({ page }) => {
  const doc = mdToTiptap("1. first\n2. second\n3. third");
  await gotoWorkspaceDocument(page, doc, "first");
  const editor = page.getByTestId("workspace-editor-input");
  await expect(editor).toContainText("first");
  await expect(editor).toContainText("second");
  await expect(editor).toContainText("third");
  const ol = editor.locator("ol");
  await expect(ol).toBeVisible();
});

test("markdown E2E: task list renders with checkboxes", async ({ page }) => {
  const doc = mdToTiptap("- [ ] todo item\n- [x] done item");
  await gotoWorkspaceDocument(page, doc, "todo item");
  const editor = page.getByTestId("workspace-editor-input");
  await expect(editor).toContainText("todo item");
  await expect(editor).toContainText("done item");
  const uncheckedBox = editor.locator('li[data-type="taskItem"] input[type="checkbox"]').first();
  await expect(uncheckedBox).not.toBeChecked();
  const checkedBox = editor.locator('li[data-type="taskItem"] input[type="checkbox"]').last();
  await expect(checkedBox).toBeChecked();
});

test("markdown E2E: code block renders", async ({ page }) => {
  const doc = mdToTiptap("```python\ndef hello():\n    print('world')\n```");
  await gotoWorkspaceDocument(page, doc, "def hello()");
  const codeBlock = page.getByTestId("code-block").first();
  await expect(codeBlock).toBeVisible();
});

test("markdown E2E: blockquote renders", async ({ page }) => {
  const doc = mdToTiptap("> quoted text\n> more quote");
  await gotoWorkspaceDocument(page, doc, "quoted text");
  const editor = page.getByTestId("workspace-editor-input");
  const blockquote = editor.locator("blockquote");
  await expect(blockquote).toBeVisible();
  await expect(blockquote).toContainText("quoted text");
});

test("markdown E2E: horizontal rule renders", async ({ page }) => {
  const doc = mdToTiptap("before\n\n---\n\nafter");
  await gotoWorkspaceDocument(page, doc, "before");
  const editor = page.getByTestId("workspace-editor-input");
  const hr = editor.locator("hr");
  await expect(hr).toBeVisible();
});

test("markdown E2E: link renders", async ({ page }) => {
  const doc = mdToTiptap("[click here](https://example.com)");
  await gotoWorkspaceDocument(page, doc, "click here");
  const editor = page.getByTestId("workspace-editor-input");
  const link = editor.locator("a[href='https://example.com']");
  await expect(link).toBeVisible();
  await expect(link).toContainText("click here");
});

test("markdown E2E: image renders as groveImageBlock, not as link", async ({ page }) => {
  test.setTimeout(60000);
  const doc = mdToTiptap("Photo below\n\n![photo](https://example.com/photo.jpg)");
  await gotoWorkspaceDocument(page, doc, "Photo below");
  const imageBlock = page.getByTestId("grove-image-block").first();
  await expect(imageBlock).toBeVisible({ timeout: 15000 });
});

test("markdown E2E: mixed content renders correctly in the editor", async ({ page }) => {
  const doc = mdToTiptap("# Hello World\n\nThis is **bold** text with *italic* and `code`.\n\n- item one\n- item two\n\n```js\nconsole.log(42);\n```\n\n> A blockquote\n\n---\n\n1. first\n2. second\n\n[link](https://example.com)");

  await gotoWorkspaceDocument(page, doc, "Hello World");

  const editor = page.getByTestId("workspace-editor-input");
  await expect(editor).toContainText("Hello World");
  await expect(editor).toContainText("bold text");
  await expect(editor).toContainText("italic");
  await expect(editor).toContainText("code");
  await expect(editor).toContainText("item one");
  await expect(editor).toContainText("item two");
  await expect(editor).toContainText("console.log(42)");
  await expect(editor).toContainText("A blockquote");
  await expect(editor).toContainText("first");
  await expect(editor).toContainText("second");
  await expect(editor).toContainText("link");

  await expect(editor.locator("h1")).toContainText("Hello World");
  await expect(editor.locator("strong")).toContainText("bold");
  await expect(editor.locator("em")).toContainText("italic");
  await expect(editor.locator("code")).toContainText("code");
  await expect(editor.locator("ul")).toBeVisible();
  await expect(page.getByTestId("code-block").first()).toBeVisible();
  await expect(editor.locator("blockquote")).toBeVisible();
  await expect(editor.locator("hr")).toBeVisible();
  await expect(editor.locator("ol")).toBeVisible();
  await expect(editor.locator("a[href='https://example.com']")).toBeVisible();
});
