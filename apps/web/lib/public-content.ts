const WIKI_LINK_REGEX = /\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g;

type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

type PublicPageRef = { id: string; title: string };

function normalizeTitle(value: string) {
  return value.trim().toLowerCase();
}

function sanitizeText(text: string, publicTitleMap: Map<string, PublicPageRef>) {
  return text.replace(WIKI_LINK_REGEX, (_, rawTarget: string, rawLabel?: string) => {
    const target = publicTitleMap.get(normalizeTitle(rawTarget));
    if (!target) {
      return rawLabel?.trim() || "Private reference";
    }
    return rawLabel?.trim() || target.title;
  });
}

function sanitizeNode(
  value: JsonValue,
  publicTitleMap: Map<string, PublicPageRef>,
  publicPageIds: Set<string>,
  publicPageById: Map<string, PublicPageRef>
): JsonValue {
  if (Array.isArray(value)) {
    return value
      .map((item) => sanitizeNode(item, publicTitleMap, publicPageIds, publicPageById))
      .filter((item) => item !== null);
  }

  if (!value || typeof value !== "object") {
    return typeof value === "string" ? sanitizeText(value, publicTitleMap) : value;
  }

  const record = value as Record<string, JsonValue>;

  if (record.type === "text" && typeof record.text === "string") {
    return {
      ...record,
      text: sanitizeText(record.text, publicTitleMap),
    };
  }

  if (record.type === "databaseEmbed") {
    const attrs =
      record.attrs && typeof record.attrs === "object"
        ? (record.attrs as Record<string, JsonValue>)
        : {};
    const referencedPageId =
      typeof attrs.pageId === "string" ? attrs.pageId : null;

    if (referencedPageId && publicPageIds.has(referencedPageId)) {
      const referencedPage = publicPageById.get(referencedPageId);
      return {
        type: "paragraph",
        content: [
          {
            type: "text",
            text: referencedPage
              ? `Embedded database: ${referencedPage.title}`
              : "Embedded database",
          },
        ],
      };
    }

    return {
      type: "paragraph",
      content: [
        { type: "text", text: "Embedded database hidden because it is not public." },
      ],
    };
  }

  if (record.type === "databaseNode" || record.type === "linkedDatabaseEmbed") {
    const attrs =
      record.attrs && typeof record.attrs === "object"
        ? (record.attrs as Record<string, JsonValue>)
        : {};
    const referencedPageId =
      typeof attrs.pageId === "string" ? attrs.pageId : null;

    if (referencedPageId && publicPageIds.has(referencedPageId)) {
      const referencedPage = publicPageById.get(referencedPageId);
      return {
        type: "paragraph",
        content: [
          {
            type: "text",
            text: referencedPage
              ? `Embedded database: ${referencedPage.title}`
              : "Embedded database",
          },
        ],
      };
    }

    return {
      type: "paragraph",
      content: [
        { type: "text", text: "Embedded database hidden because it is not public." },
      ],
    };
  }

  if (record.type === "canvasEmbed") {
    const attrs =
      record.attrs && typeof record.attrs === "object"
        ? (record.attrs as Record<string, JsonValue>)
        : {};
    const referencedPageId =
      typeof attrs.pageId === "string" ? attrs.pageId : null;

    if (referencedPageId && publicPageIds.has(referencedPageId)) {
      const referencedPage = publicPageById.get(referencedPageId);
      return {
        type: "paragraph",
        content: [
          {
            type: "text",
            text: referencedPage
              ? `Embedded canvas: ${referencedPage.title}`
              : "Embedded canvas",
          },
        ],
      };
    }

    return {
      type: "paragraph",
      content: [
        { type: "text", text: "Embedded canvas hidden because it is not public." },
      ],
    };
  }

  if (record.type === "subPageEmbed" || record.type === "pageLink") {
    const attrs =
      record.attrs && typeof record.attrs === "object"
        ? (record.attrs as Record<string, JsonValue>)
        : {};
    const referencedPageId =
      typeof attrs.pageId === "string" ? attrs.pageId : null;

    if (referencedPageId && publicPageIds.has(referencedPageId)) {
      const referencedPage = publicPageById.get(referencedPageId);
      return {
        type: "paragraph",
        content: [
          {
            type: "text",
            text: referencedPage?.title ?? "Public reference",
          },
        ],
      };
    }

    return {
      type: "paragraph",
      content: [{ type: "text", text: "Private reference" }],
    };
  }

  const next: Record<string, JsonValue> = {};
  for (const [key, entry] of Object.entries(record)) {
    next[key] = sanitizeNode(entry, publicTitleMap, publicPageIds, publicPageById);
  }
  return next;
}

/**
 * publicPages: already filtered to isPublic=true pages — pass only { id, title }.
 * Caller is responsible for pre-filtering; this function does no additional filtering.
 */
export function sanitizePublicContent(
  content: object | null,
  publicPages: PublicPageRef[]
): object | null {
  if (!content) {
    return null;
  }

  const publicTitleMap = new Map(
    publicPages.map((page) => [normalizeTitle(page.title), page] as const)
  );
  const publicPageIds = new Set(publicPages.map((page) => page.id));
  const publicPageById = new Map(publicPages.map((page) => [page.id, page] as const));

  return sanitizeNode(
    content as JsonValue,
    publicTitleMap,
    publicPageIds,
    publicPageById
  ) as object;
}
