import { arrayMove } from "@dnd-kit/sortable";
import type { PageTreeNode } from "@/store/pageStore";
import type { Page, PageType } from "@obnofi/types";

// Constants
export const PAGE_TREE_INDENT = 14;
export const PAGE_ORDER_STEP = 1024;
export const DEFAULT_SIDEBAR_WIDTH = 240;
export const MIN_SIDEBAR_WIDTH = 220;
export const MAX_SIDEBAR_WIDTH = 420;
export const SIDEBAR_WIDTH_STORAGE_KEY = "obnofi-workspace-sidebar-width";
export const SIDEBAR_HIDDEN_STORAGE_KEY = "obnofi-workspace-sidebar-hidden";

// Types
export type SearchMode = "title" | "content" | "title_content";

export interface PageSearchResult {
  id: string;
  title: string;
  type: PageType;
  icon: string | null;
  parentId: string | null;
  updatedAt: string;
  snippet: string;
  matchedIn: SearchMode;
}

export interface WorkspaceOption {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  ownerId: string;
  ownerImage: string | null;
  role: "OWNER" | "EDITOR" | "VIEWER" | "MEMBER";
  createdAt: string;
  updatedAt: string;
}

export interface FlattenedPageNode extends Page {
  depth: number;
  hasChildren: boolean;
}

export interface ProjectedDrop {
  depth: number;
  parentId: string | null;
}

export const searchModeLabels: Record<SearchMode, string> = {
  title: "제목",
  content: "내용",
  title_content: "제목 + 전체내용",
};

// typeIcons must be created at runtime (JSX), so we export a factory.
// Callers should import and use the shared `typeIcons` map defined in WorkspaceSidebar.
// This file only provides logic utilities.

export function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

export function getUserInitials(userName: string): string {
  const trimmed = userName.trim();
  if (!trimmed) return "?";
  const parts = trimmed.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return parts
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

export function flattenVisiblePageTree(
  nodes: PageTreeNode[],
  expanded: Set<string>,
  depth = 0
): FlattenedPageNode[] {
  return nodes.flatMap((node) => {
    const current: FlattenedPageNode = {
      ...node,
      depth,
      hasChildren: node.children.length > 0,
    };

    if (!expanded.has(node.id)) return [current];

    return [current, ...flattenVisiblePageTree(node.children, expanded, depth + 1)];
  });
}

export function collectDescendantIds(node: PageTreeNode): string[] {
  return node.children.flatMap((child) => [child.id, ...collectDescendantIds(child)]);
}

export function getProjectedDropPosition(
  items: FlattenedPageNode[],
  activeId: string,
  overId: string,
  dragOffsetX: number
): ProjectedDrop | null {
  const activeIndex = items.findIndex((item) => item.id === activeId);
  const overIndex = items.findIndex((item) => item.id === overId);

  if (activeIndex === -1 || overIndex === -1) return null;

  const activeItem = items[activeIndex];
  const reordered = arrayMove(items, activeIndex, overIndex);
  const previousItem = reordered[overIndex - 1];
  const nextItem = reordered[overIndex + 1];
  const dragDepth = activeItem.depth + Math.round(dragOffsetX / PAGE_TREE_INDENT);
  const maxDepth = previousItem ? previousItem.depth + 1 : 0;
  const minDepth = nextItem ? nextItem.depth : 0;
  const depth = clamp(dragDepth, minDepth, maxDepth);

  let parentId: string | null = null;

  if (depth === 0) {
    parentId = null;
  } else if (previousItem) {
    if (depth > previousItem.depth) {
      parentId =
        nextItem && depth === nextItem.depth + 1 ? nextItem.id : previousItem.id;
    } else if (depth === previousItem.depth) {
      parentId = previousItem.parentId;
    } else {
      const ancestor = reordered
        .slice(0, overIndex)
        .reverse()
        .find((item) => item.depth === depth - 1);
      parentId = ancestor?.id ?? null;
    }
  }

  return { depth, parentId };
}

export function getReorderedSiblingIds(
  items: FlattenedPageNode[],
  activeId: string,
  overId: string,
  projected: ProjectedDrop
): string[] {
  const activeIndex = items.findIndex((item) => item.id === activeId);
  const overIndex = items.findIndex((item) => item.id === overId);

  if (activeIndex === -1 || overIndex === -1) return [];

  const reordered = arrayMove(items, activeIndex, overIndex).map((item) =>
    item.id === activeId
      ? { ...item, depth: projected.depth, parentId: projected.parentId }
      : item
  );

  return reordered
    .filter((item) => item.parentId === projected.parentId)
    .map((item) => item.id);
}
