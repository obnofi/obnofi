import { Page } from "@obnofi/types";
import { isOptimisticPageId, mergeCachedPage, upsertCachedPage } from "./pageUtils";

let activePageFetchController: AbortController | null = null;
let activePageFetchSequence = 0;
let activePageFetchPageId: string | null = null;
let activePageFetchPromise: Promise<void> | null = null;

interface FetchState {
  pages: Page[];
  currentPage: Page | null;
  isLoading: boolean;
  error: string | null;
}

type SetFn = (
  updater: Partial<FetchState> | ((s: FetchState) => Partial<FetchState>)
) => void;
type GetFn = () => FetchState;

export function createFetchPageAction(set: SetFn, get: GetFn) {
  return async (pageId: string) => {
    const cachedPage = get().pages.find((page) => page.id === pageId) ?? null;
    const canUseCachedPage = cachedPage !== null;
    let controller: AbortController | null = null;
    let fetchSequence = 0;

    set({
      isLoading: true,
      error: null,
      currentPage: canUseCachedPage
        ? cachedPage
        : get().currentPage?.id === pageId
          ? get().currentPage
          : null,
    });

    if (activePageFetchPageId === pageId && activePageFetchPromise) {
      try {
        await activePageFetchPromise;
      } catch {
        // The owner request updates store error state; duplicate callers only wait.
      }
      return;
    }

    try {
      if (isOptimisticPageId(pageId)) {
        const optimisticPage =
          get().pages.find((page) => page.id === pageId) ?? null;

        set({
          currentPage: optimisticPage,
          isLoading: false,
          error: optimisticPage ? null : "Page not found",
        });
        return;
      }

      activePageFetchController?.abort();
      controller = new AbortController();
      activePageFetchController = controller;
      activePageFetchPageId = pageId;
      fetchSequence = ++activePageFetchSequence;

      activePageFetchPromise = (async () => {
        const response = await fetch(`/api/pages/${pageId}`, {
          signal: controller?.signal,
        });
        if (!response.ok) throw new Error("Failed to fetch page");
        const page = await response.json();

        if (fetchSequence !== activePageFetchSequence) {
          return;
        }

        if (controller && activePageFetchController === controller) {
          activePageFetchController = null;
        }

        set((state) => {
          const cachedPage = state.pages.find((p) => p.id === page.id);
          const nextCurrentPage = mergeCachedPage(cachedPage, page);

          return {
            pages: upsertCachedPage(state.pages, nextCurrentPage),
            currentPage: nextCurrentPage,
            isLoading: false,
          };
        });
      })();

      await activePageFetchPromise;
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        if (fetchSequence === activePageFetchSequence) {
          set({ isLoading: false });
        }
        return;
      }

      set({
        error: error instanceof Error ? error.message : "Unknown error",
        isLoading: false,
        currentPage:
          get().currentPage?.id === pageId ? get().currentPage : null,
      });
    } finally {
      if (controller && activePageFetchController === controller) {
        activePageFetchController = null;
      }
      if (activePageFetchPageId === pageId) {
        activePageFetchPageId = null;
        activePageFetchPromise = null;
      }
    }
  };
}
