"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Page, PageType } from "@obnofi/types";

export const embeddedPageCache = new Map<string, Page>();
export const embeddedPageRequestCache = new Map<string, Promise<Page | null>>();

interface UseEmbeddedPageStateOptions {
  pageId: string | null;
  workspaceId: string | null;
  parentPageId: string | null;
  autoCreate: boolean;
  isInlinePage: boolean;
  cachedPage: Page | null | undefined;
  isEditorEditable: boolean;
  pageType: PageType;
  emptyTitle: string;
  updateAttrs: (next: {
    pageId?: string | null;
    autoCreate?: boolean;
    isInlinePage?: boolean;
  }) => boolean;
}

interface UseEmbeddedPageStateResult {
  embeddedPage: Page | null;
  isCreating: boolean;
  isLoading: boolean;
  renameEmbeddedPage: (nextTitle: string) => Promise<void>;
}

export function useEmbeddedPageState({
  pageId,
  workspaceId,
  parentPageId,
  autoCreate,
  isInlinePage,
  cachedPage,
  isEditorEditable,
  pageType,
  emptyTitle,
  updateAttrs,
}: UseEmbeddedPageStateOptions): UseEmbeddedPageStateResult {
  const [embeddedPage, setEmbeddedPage] = useState<Page | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const hasLoaded = useRef(false);
  const hasAttemptedReconnect = useRef(false);
  const isCreatingRef = useRef(false);

  const loadEmbeddedPage = useCallback(async () => {
    if (!pageId || hasLoaded.current) {
      if (!pageId) setEmbeddedPage(null);
      return;
    }

    const pageFromStore = cachedPage;
    if (pageFromStore) {
      embeddedPageCache.set(pageId, pageFromStore);
      hasLoaded.current = true;
      setEmbeddedPage(pageFromStore);
      return;
    }

    const pageFromCache = embeddedPageCache.get(pageId);
    if (pageFromCache) {
      hasLoaded.current = true;
      setEmbeddedPage(pageFromCache);
      return;
    }

    hasLoaded.current = true;
    setIsLoading(true);

    let request = embeddedPageRequestCache.get(pageId);
    if (!request) {
      request = fetch(`/api/pages/${pageId}`)
        .then(async (response) => {
          if (!response.ok) return null;
          return (await response.json()) as Page;
        })
        .finally(() => {
          embeddedPageRequestCache.delete(pageId);
        });
      embeddedPageRequestCache.set(pageId, request);
    }

    const page = await request;
    if (!page) {
      setEmbeddedPage(null);
      hasLoaded.current = false;
      setIsLoading(false);
      return;
    }

    embeddedPageCache.set(pageId, page);
    setEmbeddedPage(page);
    setIsLoading(false);
  }, [cachedPage, pageId]);

  const createEmbeddedPage = useCallback(async () => {
    if (!workspaceId || !parentPageId || isCreatingRef.current) return;

    isCreatingRef.current = true;
    setIsCreating(true);
    updateAttrs({ autoCreate: false, isInlinePage });

    const response = await fetch("/api/pages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: emptyTitle,
        type: pageType,
        parentId: parentPageId,
        workspaceId,
      }),
    });

    isCreatingRef.current = false;
    setIsCreating(false);

    if (!response.ok) {
      updateAttrs({ autoCreate: true, isInlinePage });
      return;
    }

    const createdPage = (await response.json()) as Page;
    embeddedPageCache.set(createdPage.id, createdPage);
    hasLoaded.current = true;
    setEmbeddedPage(createdPage);
    updateAttrs({ pageId: createdPage.id, autoCreate: false, isInlinePage });
  }, [emptyTitle, isInlinePage, pageType, parentPageId, updateAttrs, workspaceId]);

  useEffect(() => {
    if (!isEditorEditable || !autoCreate || pageId) return;
    void createEmbeddedPage();
  }, [autoCreate, createEmbeddedPage, isEditorEditable, pageId]);

  useEffect(() => {
    if (!pageId) {
      hasLoaded.current = false;
      setEmbeddedPage(null);
      return;
    }

    if (cachedPage) {
      embeddedPageCache.set(pageId, cachedPage);
      hasLoaded.current = true;
      setEmbeddedPage(cachedPage);
    }
  }, [cachedPage, pageId]);

  useEffect(() => {
    if (!pageId || hasLoaded.current) return;
    void loadEmbeddedPage();
  }, [loadEmbeddedPage, pageId]);

  useEffect(() => {
    if (pageId) {
      hasAttemptedReconnect.current = false;
      return;
    }

    if (autoCreate || !workspaceId || !parentPageId || hasAttemptedReconnect.current) {
      return;
    }

    hasAttemptedReconnect.current = true;
    let cancelled = false;

    const reconnect = async () => {
      const response = await fetch(`/api/pages?workspaceId=${workspaceId}`);
      if (!response.ok || cancelled) return;

      const pages = (await response.json()) as Page[];
      const fallback = pages
        .filter(
          (page) =>
            page.type === pageType &&
            page.parentId === parentPageId &&
            page.title === emptyTitle
        )
        .sort(
          (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        )[0];

      if (!fallback || cancelled) return;

      hasLoaded.current = true;
      setEmbeddedPage(fallback);
      setIsCreating(false);
      updateAttrs({ pageId: fallback.id, autoCreate: false });
    };

    void reconnect();
    return () => {
      cancelled = true;
    };
  }, [autoCreate, emptyTitle, pageId, pageType, parentPageId, updateAttrs, workspaceId]);

  const renameEmbeddedPage = useCallback(
    async (nextTitle: string) => {
      const targetId = embeddedPage?.id ?? pageId;
      if (!targetId) return;

      const trimmed = nextTitle.trim();
      if (!trimmed) return;

      setEmbeddedPage((prev) => (prev ? { ...prev, title: trimmed } : prev));
      const cached = embeddedPageCache.get(targetId);
      if (cached) embeddedPageCache.set(targetId, { ...cached, title: trimmed });

      try {
        await fetch(`/api/pages/${targetId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: trimmed }),
        });
      } catch {
        // 낙관적 업데이트 값을 유지한다 — 네트워크 실패해도 UI는 새 제목 표시
      }
    },
    [embeddedPage, pageId]
  );

  return { embeddedPage, isCreating, isLoading, renameEmbeddedPage };
}
