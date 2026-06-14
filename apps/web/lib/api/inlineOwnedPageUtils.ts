type TiptapNodeLike = {
  type?: string;
  attrs?: {
    pageId?: string | null;
    isInlinePage?: boolean;
  };
  content?: TiptapNodeLike[];
} | null;

const INLINE_OWNED_PAGE_NODE_TYPES = new Set([
  "canvasEmbed",
  "databaseNode",
  "subPageEmbed",
  "mindMapEmbed",
]);

export function collectInlineOwnedPageIds(node: TiptapNodeLike, ids = new Set<string>()) {
  if (!node) {
    return ids;
  }

  if (
    node.type &&
    INLINE_OWNED_PAGE_NODE_TYPES.has(node.type) &&
    node.attrs?.pageId &&
    node.attrs.isInlinePage !== false
  ) {
    ids.add(node.attrs.pageId);
  }

  node.content?.forEach((child) => {
    collectInlineOwnedPageIds(child, ids);
  });

  return ids;
}

export function getRemovedInlineOwnedPageIds(previousContent: unknown, nextContent: unknown) {
  const previousIds = collectInlineOwnedPageIds(previousContent as TiptapNodeLike);
  const nextIds = collectInlineOwnedPageIds(nextContent as TiptapNodeLike);

  return Array.from(previousIds).filter((pageId) => !nextIds.has(pageId));
}
