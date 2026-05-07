import { resolvePersistedYjsContent } from "@/lib/yjsContent";

export type PageSearchMode = "title" | "content" | "title_content";

type JsonLike = null | boolean | number | string | JsonLike[] | { [key: string]: JsonLike };

export function resolveSearchableContent(params: {
  content: unknown;
  yjsState?: Uint8Array | Buffer | null;
}): string {
  const latestContent =
    resolvePersistedYjsContent(params.yjsState) ?? (params.content as JsonLike);

  return extractPlainText(latestContent).replace(/\s+/g, " ").trim();
}

export function extractPlainText(value: unknown): string {
  const parts: string[] = [];

  const visit = (node: unknown) => {
    if (node == null) {
      return;
    }

    if (typeof node === "string") {
      parts.push(node);
      return;
    }

    if (typeof node !== "object") {
      return;
    }

    if (Array.isArray(node)) {
      node.forEach(visit);
      return;
    }

    const record = node as { [key: string]: unknown };

    if (typeof record.text === "string") {
      parts.push(record.text);
    }

    Object.values(record).forEach((child) => {
      if (child !== record.text) {
        visit(child);
      }
    });
  };

  visit(value);

  return parts.join(" ");
}

export function matchesSearch(params: {
  query: string;
  title: string;
  content: string;
  mode: PageSearchMode;
}): boolean {
  const normalizedQuery = params.query.trim().toLowerCase();

  if (!normalizedQuery) {
    return true;
  }

  const title = params.title.toLowerCase();
  const content = params.content.toLowerCase();

  if (params.mode === "title") {
    return title.includes(normalizedQuery);
  }

  if (params.mode === "content") {
    return content.includes(normalizedQuery);
  }

  return title.includes(normalizedQuery) || content.includes(normalizedQuery);
}

export function getSearchSnippet(content: string, query: string, maxLength = 140): string {
  const normalizedContent = content.replace(/\s+/g, " ").trim();
  if (!normalizedContent) {
    return "";
  }

  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) {
    return normalizedContent.slice(0, maxLength);
  }

  const matchIndex = normalizedContent.toLowerCase().indexOf(normalizedQuery);
  if (matchIndex === -1) {
    return normalizedContent.slice(0, maxLength);
  }

  const start = Math.max(0, matchIndex - Math.floor((maxLength - normalizedQuery.length) / 2));
  const end = Math.min(normalizedContent.length, start + maxLength);
  const snippet = normalizedContent.slice(start, end).trim();

  return `${start > 0 ? "..." : ""}${snippet}${end < normalizedContent.length ? "..." : ""}`;
}
