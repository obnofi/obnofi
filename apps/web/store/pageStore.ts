import { create } from "zustand";
import { Page, CreatePageInput, UpdatePageInput } from "@obnofi/types";
import {
  mergePagePreservingDocumentContent,
  mergePageListCache,
  upsertCachedPage,
  buildOptimisticPage,
  buildPageTree,
} from "@/lib/page/pageUtils";
import { createFetchPageAction } from "@/lib/page/pageFetch";

export type { PageTreeNode } from "@/lib/page/pageUtils";

const pageUpdateSequences = new Map<string, number>();

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
  getPageTree: () => import("@/lib/page/pageUtils").PageTreeNode[];
  getPageTrail: (pageId: string) => Page[];
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
      set((state) => ({
        pages: mergePageListCache(state.pages, pages),
        isLoading: false,
        initializedWorkspaceId: workspaceId,
      }));
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Unknown error",
        isLoading: false,
      });
    }
  },

  fetchPage: createFetchPageAction(set, get),

  createPage: async (input: CreatePageInput) => {
    const optimisticPage = buildOptimisticPage(input, get().pages);

    set((state) => ({
      pages: [...state.pages, optimisticPage],
      error: null,
    }));

    try {
      const response = await fetch("/api/pages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!response.ok) throw new Error("Failed to create page");
      const newPage: Page = await response.json();
      set((state) => ({
        pages: state.pages.map((p) =>
          p.id === optimisticPage.id ? newPage : p
        ),
      }));
      return newPage;
    } catch (error) {
      set((state) => ({
        pages: state.pages.filter((p) => p.id !== optimisticPage.id),
        error: error instanceof Error ? error.message : "Unknown error",
      }));
      return null;
    }
  },

  updatePage: async (pageId: string, input: UpdatePageInput) => {
    const previousState = get();
    const previousPages = previousState.pages;
    const previousCurrentPage = previousState.currentPage;
    const optimisticPage = previousPages.find((page) => page.id === pageId);
    const updateSequence = (pageUpdateSequences.get(pageId) ?? 0) + 1;
    pageUpdateSequences.set(pageId, updateSequence);

    if (!optimisticPage) {
      return;
    }

    const nextPage: Page = {
      ...optimisticPage,
      ...input,
      headingFontSizes: input.headingFontSizes
        ? {
            ...optimisticPage.headingFontSizes,
            ...input.headingFontSizes,
          }
        : optimisticPage.headingFontSizes,
      updatedAt: new Date().toISOString(),
    };

    set((state) => ({
      pages: state.pages.map((page) => (page.id === pageId ? nextPage : page)),
      currentPage:
        state.currentPage?.id === pageId
          ? {
              ...state.currentPage,
              ...input,
              headingFontSizes: input.headingFontSizes
                ? {
                    ...state.currentPage.headingFontSizes,
                    ...input.headingFontSizes,
                  }
                : state.currentPage.headingFontSizes,
              updatedAt: nextPage.updatedAt,
            }
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
      if (pageUpdateSequences.get(pageId) !== updateSequence) {
        return;
      }
      set((state) => ({
        pages: state.pages.map((p) =>
          p.id === pageId
            ? mergePagePreservingDocumentContent(p, updatedPage, input)
            : p
        ),
        currentPage:
          state.currentPage?.id === pageId
            ? mergePagePreservingDocumentContent(
                state.currentPage,
                updatedPage,
                input
              )
            : state.currentPage,
      }));
    } catch (error) {
      if (pageUpdateSequences.get(pageId) !== updateSequence) {
        return;
      }

      if ("title" in input && Object.keys(input).length === 1) {
        set({
          error: error instanceof Error ? error.message : "Unknown error",
        });
        return;
      }

      set({
        pages: previousPages,
        currentPage: previousCurrentPage,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  },

  deletePage: async (pageId: string) => {
    const previousState = get();
    const previousPages = previousState.pages;
    const previousCurrentPage = previousState.currentPage;

    const toRemove = new Set<string>();
    const queue = [pageId];
    while (queue.length > 0) {
      const current = queue.shift()!;
      if (toRemove.has(current)) continue;
      toRemove.add(current);
      previousPages.forEach((p) => {
        if (p.parentId === current && !toRemove.has(p.id)) {
          queue.push(p.id);
        }
      });
    }

    set({
      pages: previousPages.filter((p) => !toRemove.has(p.id)),
      currentPage: toRemove.has(previousCurrentPage?.id ?? "")
        ? null
        : previousCurrentPage,
      error: null,
    });

    try {
      const response = await fetch(`/api/pages/${pageId}`, {
        method: "DELETE",
      });
      if (!response.ok && response.status !== 404) {
        throw new Error("Failed to delete page");
      }
    } catch (error) {
      set({
        pages: previousPages,
        currentPage: previousCurrentPage,
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
    set((state) => {
      const shouldPreserveCache =
        workspaceId === undefined || state.initializedWorkspaceId === workspaceId;

      return workspaceId !== undefined
        ? {
            pages: shouldPreserveCache
              ? mergePageListCache(state.pages, pages)
              : pages,
            initializedWorkspaceId: workspaceId,
          }
        : {
            pages: mergePageListCache(state.pages, pages),
          };
    }),

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
