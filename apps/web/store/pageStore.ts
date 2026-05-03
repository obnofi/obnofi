import { create } from "zustand";
import { Page, PageType, CreatePageInput, UpdatePageInput } from "@obnofi/types";

interface PageState {
  pages: Page[];
  currentPage: Page | null;
  isLoading: boolean;
  error: string | null;
  /** SSR/fetch로 페이지 목록이 채워진 워크스페이스 id. 같은 워크스페이스에서 중복 fetch를 막는 데 사용. */
  initializedWorkspaceId: string | null;

  // Actions
  fetchPages: (workspaceId: string) => Promise<void>;
  fetchPage: (pageId: string) => Promise<void>;
  createPage: (input: CreatePageInput) => Promise<Page | null>;
  updatePage: (pageId: string, input: UpdatePageInput) => Promise<void>;
  deletePage: (pageId: string) => Promise<void>;
  setCurrentPage: (
    page:
      | Page
      | null
      | ((currentPage: Page | null) => Page | null)
  ) => void;
  setPages: (pages: Page[], workspaceId?: string) => void;
  getChildPages: (parentId: string | null) => Page[];
  getPageTree: () => PageTreeNode[];
  getPageTrail: (pageId: string) => Page[];
}

export interface PageTreeNode extends Page {
  children: PageTreeNode[];
}

function buildPageTree(pages: Page[]): PageTreeNode[] {
  const pageMap = new Map<string, PageTreeNode>();
  const roots: PageTreeNode[] = [];

  // Initialize all pages with empty children array
  pages.forEach((page) => {
    pageMap.set(page.id, { ...page, children: [] });
  });

  // Build tree structure
  pages.forEach((page) => {
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

export const usePageStore = create<PageState>((set, get) => ({
  pages: [],
  currentPage: null,
  isLoading: false,
  error: null,
  initializedWorkspaceId: null,

  fetchPages: async (workspaceId: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`/api/pages?workspaceId=${workspaceId}`);
      if (!response.ok) throw new Error("Failed to fetch pages");
      const pages = await response.json();
      set({ pages, isLoading: false, initializedWorkspaceId: workspaceId });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Unknown error",
        isLoading: false,
      });
    }
  },

  fetchPage: async (pageId: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`/api/pages/${pageId}`);
      if (!response.ok) throw new Error("Failed to fetch page");
      const page = await response.json();
      set({ currentPage: page, isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Unknown error",
        isLoading: false,
      });
    }
  },

  createPage: async (input: CreatePageInput) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch("/api/pages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!response.ok) throw new Error("Failed to create page");
      const newPage = await response.json();
      set((state) => ({
        pages: [...state.pages, newPage],
        isLoading: false,
      }));
      return newPage;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Unknown error",
        isLoading: false,
      });
      return null;
    }
  },

  updatePage: async (pageId: string, input: UpdatePageInput) => {
    const previousState = get();
    const previousPages = previousState.pages;
    const previousCurrentPage = previousState.currentPage;
    const optimisticPage = previousPages.find((page) => page.id === pageId);

    if (!optimisticPage) {
      return;
    }

    const nextPage: Page = {
      ...optimisticPage,
      ...input,
      updatedAt: new Date().toISOString(),
    };

    set((state) => ({
      pages: state.pages.map((page) => (page.id === pageId ? nextPage : page)),
      currentPage:
        state.currentPage?.id === pageId
          ? { ...state.currentPage, ...input, updatedAt: nextPage.updatedAt }
          : state.currentPage,
      error: null,
    }));

    try {
      const response = await fetch(`/api/pages/${pageId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!response.ok) throw new Error("Failed to update page");
      const updatedPage = await response.json();
      set((state) => ({
        pages: state.pages.map((p) => (p.id === pageId ? updatedPage : p)),
        currentPage:
          state.currentPage?.id === pageId ? updatedPage : state.currentPage,
      }));
    } catch (error) {
      set({
        pages: previousPages,
        currentPage: previousCurrentPage,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  },

  deletePage: async (pageId: string) => {
    try {
      const response = await fetch(`/api/pages/${pageId}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete page");
      set((state) => {
        const toRemove = new Set<string>();
        const queue = [pageId];
        while (queue.length > 0) {
          const current = queue.shift()!;
          toRemove.add(current);
          state.pages.forEach((p) => {
            if (p.parentId === current && !toRemove.has(p.id)) {
              queue.push(p.id);
            }
          });
        }
        return {
          pages: state.pages.filter((p) => !toRemove.has(p.id)),
          currentPage: toRemove.has(state.currentPage?.id ?? "")
            ? null
            : state.currentPage,
        };
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  },

  setCurrentPage: (pageOrUpdater) =>
    set((state) => {
      const nextCurrentPage =
        typeof pageOrUpdater === "function"
          ? pageOrUpdater(state.currentPage)
          : pageOrUpdater;

      return {
        currentPage: nextCurrentPage,
        pages: nextCurrentPage
          ? state.pages.map((page) =>
              page.id === nextCurrentPage.id ? nextCurrentPage : page
            )
          : state.pages,
      };
    }),

  setPages: (pages: Page[], workspaceId?: string) =>
    set(
      workspaceId !== undefined
        ? { pages, initializedWorkspaceId: workspaceId }
        : { pages }
    ),

  getChildPages: (parentId: string | null) => {
    const { pages } = get();
    return pages.filter((p) => p.parentId === parentId);
  },

  getPageTree: () => buildPageTree(get().pages),

  getPageTrail: (pageId: string) => {
    const { pages } = get();
    const pageMap = new Map(pages.map((page) => [page.id, page]));
    const trail: Page[] = [];
    const visited = new Set<string>();
    let cursor = pageMap.get(pageId) ?? null;

    while (cursor && !visited.has(cursor.id)) {
      trail.unshift(cursor);
      visited.add(cursor.id);
      cursor = cursor.parentId ? pageMap.get(cursor.parentId) ?? null : null;
    }

    return trail;
  },
}));
