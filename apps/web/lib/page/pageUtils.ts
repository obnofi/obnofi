import { Page, CreatePageInput, UpdatePageInput, PageHighlightColor } from "@obnofi/types";

export const PAGE_ORDER_STEP = 1024;
export const DEFAULT_HIGHLIGHT_COLORS: PageHighlightColor[] = [
  "yellow",
  "green",
  "blue",
  "pink",
];

export function isOptimisticPageId(pageId: string) {
  return pageId.startsWith("optimistic-");
}

export function generateOptimisticPageId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `optimistic-${crypto.randomUUID()}`;
  }
  return `optimistic-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function mergePagePreservingDocumentContent(
  previousPage: Page,
  nextPage: Page,
  input: UpdatePageInput
): Page {
  if ("content" in input) {
    return nextPage;
  }

  if (previousPage.type !== "document") {
    return nextPage;
  }

  return {
    ...nextPage,
    content: previousPage.content,
  };
}

export function mergeCachedPage(previousPage: Page | null | undefined, nextPage: Page): Page {
  if (!previousPage) {
    return nextPage;
  }

  const previousUpdatedAt = new Date(previousPage.updatedAt).getTime();
  const nextUpdatedAt = new Date(nextPage.updatedAt).getTime();
  const shouldPreserveLocalTitle = previousUpdatedAt > nextUpdatedAt;

  return {
    ...previousPage,
    ...nextPage,
    title: shouldPreserveLocalTitle ? previousPage.title : nextPage.title,
    content:
      nextPage.content !== null
        ? nextPage.content
        : previousPage.content,
  };
}

export function upsertCachedPage(pages: Page[], nextPage: Page): Page[] {
  let found = false;
  const mergedPages = pages.map((page) => {
    if (page.id !== nextPage.id) {
      return page;
    }

    found = true;
    return mergeCachedPage(page, nextPage);
  });

  return found ? mergedPages : [...mergedPages, nextPage];
}

export function mergePageListCache(previousPages: Page[], nextPages: Page[]): Page[] {
  const previousPageMap = new Map(previousPages.map((page) => [page.id, page]));

  return nextPages.map((page) => mergeCachedPage(previousPageMap.get(page.id), page));
}

export function buildOptimisticPage(
  input: CreatePageInput,
  existingPages: Page[]
): Page {
  const siblingOrder = existingPages
    .filter((p) => (p.parentId ?? null) === (input.parentId ?? null) && !p.parentDatabaseId)
    .reduce((max, p) => Math.max(max, p.order), -PAGE_ORDER_STEP);
  const now = new Date().toISOString();

  return {
    id: generateOptimisticPageId(),
    title: input.title,
    groveTitleLevel: 1,
    bodyFontSizePt: 12,
    headingFontSizes: { h1: 30, h2: 23, h3: 18, h4: 16, h5: 14 },
    highlightColors: DEFAULT_HIGHLIGHT_COLORS,
    content:
      input.type === "document"
        ? input.content ?? { type: "doc", content: [{ type: "paragraph" }] }
        : null,
    type: input.type,
    icon: null,
    coverImage: null,
    parentId: input.parentId ?? null,
    order: siblingOrder + PAGE_ORDER_STEP,
    workspaceId: input.workspaceId,
    createdAt: now,
    updatedAt: now,
    yjsUpdatedAt: null,
    isPublic: false,
    shareId: null,
    sharePassword: null,
    databaseId: input.databaseId ?? null,
    parentDatabaseId: null,
    collaborationEnabled:
      input.type === "document" ? input.collaborationEnabled ?? true : false,
    lineIndicatorEnabled:
      input.type === "document" ? input.lineIndicatorEnabled ?? false : false,
  };
}

export interface PageTreeNode extends Page {
  children: PageTreeNode[];
}

type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

type InlineOwnedEmbedType =
  | "canvasEmbed"
  | "databaseEmbed"
  | "databaseNode"
  | "mindMapEmbed"
  | "subPageEmbed";

const INLINE_EMBED_PAGE_TYPES: Partial<Record<InlineOwnedEmbedType, Page["type"]>> = {
  canvasEmbed: "canvas",
  databaseEmbed: "database",
  databaseNode: "database",
  mindMapEmbed: "mindmap",
  subPageEmbed: "document",
};

const INLINE_SURFACE_DEFAULT_TITLES: Partial<Record<Page["type"], string[]>> = {
  canvas: ["Inline Clearing"],
  database: ["Grove Catalog"],
  mindmap: ["Inline Mind Map"],
};

function collectInlineOwnedPageIdsFromNode(
  value: JsonValue,
  ownerPage: Page,
  pageMap: Map<string, Page>,
  result: Set<string>
) {
  if (!value) {
    return;
  }

  if (Array.isArray(value)) {
    value.forEach((item) =>
      collectInlineOwnedPageIdsFromNode(item, ownerPage, pageMap, result)
    );
    return;
  }

  if (typeof value !== "object") {
    return;
  }

  const record = value as Record<string, JsonValue>;
  const embedType = record.type;
  const attrs =
    record.attrs && typeof record.attrs === "object"
      ? (record.attrs as Record<string, JsonValue>)
      : null;

  if (attrs && typeof embedType === "string") {
    const embeddedPageId =
      typeof attrs.pageId === "string" ? attrs.pageId : null;
    const parentPageId =
      typeof attrs.parentPageId === "string" ? attrs.parentPageId : null;
    const explicitlyInline = attrs.isInlinePage === true;

    if (embeddedPageId) {
      const embeddedPage = pageMap.get(embeddedPageId);
      const expectedPageType =
        INLINE_EMBED_PAGE_TYPES[embedType as InlineOwnedEmbedType];
      const matchesLegacyInlineOwnership =
        parentPageId === ownerPage.id &&
        embeddedPage?.parentId === ownerPage.id &&
        embeddedPage.type === expectedPageType;

      if (explicitlyInline || matchesLegacyInlineOwnership) {
        result.add(embeddedPageId);
      }
    }
  }

  Object.values(record).forEach((entry) =>
    collectInlineOwnedPageIdsFromNode(entry, ownerPage, pageMap, result)
  );
}

export function getSidebarPages(pages: Page[]): Page[] {
  const pageMap = new Map(pages.map((page) => [page.id, page]));
  const referencedInlinePageIds = new Set<string>();

  pages.forEach((page) => {
    collectInlineOwnedPageIdsFromNode(
      page.content as JsonValue,
      page,
      pageMap,
      referencedInlinePageIds
    );
  });

  return pages.filter((page) => {
    if (referencedInlinePageIds.has(page.id)) {
      return true;
    }

    if (!page.parentId) {
      return true;
    }

    const parentPage = pageMap.get(page.parentId);
    if (!parentPage) {
      return true;
    }

    const defaultTitles = INLINE_SURFACE_DEFAULT_TITLES[page.type];
    const looksLikeInlineSurface =
      Array.isArray(defaultTitles) && defaultTitles.includes(page.title);

    if (!looksLikeInlineSurface) {
      return true;
    }

    return false;
  });
}

export function buildPageTree(pages: Page[]): PageTreeNode[] {
  const sidebarPages = getSidebarPages(pages);
  const pageMap = new Map<string, PageTreeNode>();
  const roots: PageTreeNode[] = [];

  // Initialize all pages with empty children array
  sidebarPages.forEach((page) => {
    pageMap.set(page.id, { ...page, children: [] });
  });

  // Build tree structure
  sidebarPages.forEach((page) => {
    const node = pageMap.get(page.id)!;
    if (page.parentId && pageMap.has(page.parentId)) {
      const parent = pageMap.get(page.parentId)!;
      parent.children.push(node);
    } else {
      roots.push(node);
    }
  });

  // Sort siblings by explicit order first, then updatedAt for a stable tie-breaker.
  const sortNodes = (nodes: PageTreeNode[]) => {
    nodes.sort(
      (a, b) =>
        a.order - b.order ||
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
    nodes.forEach((node) => sortNodes(node.children));
  };
  sortNodes(roots);

  return roots;
}
