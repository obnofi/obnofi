"use client";

import { useState, useEffect, useMemo, startTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { usePageStore } from "@/store/pageStore";
import { useCollaboration } from "@/lib/collaboration/CollaborationContext";
import { createPageTitles } from "@/lib/pageCreation";
import { getSidebarPages } from "@/lib/page/pageUtils";
import {
  clamp,
  flattenVisiblePageTree,
  DEFAULT_SIDEBAR_WIDTH,
  MIN_SIDEBAR_WIDTH,
  MAX_SIDEBAR_WIDTH,
  SIDEBAR_WIDTH_STORAGE_KEY,
  SIDEBAR_HIDDEN_STORAGE_KEY,
  type WorkspaceOption,
} from "@/lib/sidebarPageTree";
import type { PageType } from "@obnofi/types";

export function useSidebarNavigation(workspaceId: string) {
  const router = useRouter();
  const { data: session } = useSession();
  const collaboration = useCollaboration();
  const localUserId = collaboration.localUserId ?? null;

  const [expandedPages, setExpandedPages] = useState<Set<string>>(new Set());
  const [pendingPageId, setPendingPageId] = useState<string | null>(null);
  const [workspaces, setWorkspaces] = useState<WorkspaceOption[]>([]);
  const [sidebarWidth, setSidebarWidth] = useState(DEFAULT_SIDEBAR_WIDTH);
  const [isSidebarHidden, setIsSidebarHidden] = useState(false);

  const { pages, fetchPages, getPageTree, createPage, deletePage } = usePageStore();
  const initializedWorkspaceId = usePageStore((state) => state.initializedWorkspaceId);
  const searchParams = useSearchParams();
  const currentPageId = searchParams.get("page") ?? undefined;
  const effectiveCurrentPageId = pendingPageId ?? currentPageId;

  const showPageTreeSkeleton = initializedWorkspaceId !== workspaceId;

  // ── Audience map ────────────────────────────────────────────────────────────
  const pageAudienceById = useMemo(() => {
    const awarenessStates = Array.isArray(collaboration.awarenessStates)
      ? collaboration.awarenessStates
      : [];
    const audienceMap = new Map<string, Array<{ userId: string; userName: string }>>();
    awarenessStates.forEach((state) => {
      if (state.userId === localUserId || !state.userCursor?.pageId) return;
      const currentAudience = audienceMap.get(state.userCursor.pageId) ?? [];
      currentAudience.push({ userId: state.userId, userName: state.userName });
      audienceMap.set(state.userCursor.pageId, currentAudience);
    });
    return audienceMap;
  }, [collaboration.awarenessStates, localUserId]);

  // ── Cursor tracking ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!effectiveCurrentPageId) return;
    const updateCursor = collaboration.updateCursor ?? (() => {});
    updateCursor({ type: "page", pageId: effectiveCurrentPageId, canvasPosition: null, databaseCell: null });
    return () => { updateCursor(null); };
  }, [collaboration.updateCursor, effectiveCurrentPageId]);

  // ── Restore sidebar persistence ─────────────────────────────────────────────
  useEffect(() => {
    if (typeof window === "undefined") return;
    const savedWidth = window.localStorage.getItem(SIDEBAR_WIDTH_STORAGE_KEY);
    const savedHidden = window.localStorage.getItem(SIDEBAR_HIDDEN_STORAGE_KEY);
    if (savedWidth) {
      const parsedWidth = Number(savedWidth);
      if (Number.isFinite(parsedWidth)) {
        setSidebarWidth(clamp(parsedWidth, MIN_SIDEBAR_WIDTH, MAX_SIDEBAR_WIDTH));
      }
    }
    if (savedHidden === "true") setIsSidebarHidden(true);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(SIDEBAR_WIDTH_STORAGE_KEY, String(sidebarWidth));
  }, [sidebarWidth]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(SIDEBAR_HIDDEN_STORAGE_KEY, String(isSidebarHidden));
  }, [isSidebarHidden]);

  // ── Pages fetch ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!workspaceId) return;
    if (usePageStore.getState().initializedWorkspaceId === workspaceId) return;
    fetchPages(workspaceId);
  }, [workspaceId, fetchPages]);

  // ── Workspaces fetch ────────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    const loadWorkspaces = async () => {
      try {
        const response = await fetch("/api/workspaces");
        if (!response.ok) return;
        const nextWorkspaces = (await response.json()) as WorkspaceOption[];
        if (!cancelled) setWorkspaces(nextWorkspaces);
      } catch { /* swallow */ }
    };
    void loadWorkspaces();
    return () => { cancelled = true; };
  }, []);

  // ── Auto-expand ancestors of current page ───────────────────────────────────
  useEffect(() => {
    if (!currentPageId) return;
    setExpandedPages((prev) => {
      let next: Set<string> | null = null;
      const visited = new Set<string>([currentPageId]);
      let page = pages.find((p) => p.id === currentPageId);
      while (page?.parentId) {
        if (visited.has(page.parentId)) break;
        visited.add(page.parentId);
        if (!prev.has(page.parentId)) {
          if (!next) next = new Set(prev);
          next.add(page.parentId);
        }
        page = pages.find((p) => p.id === page?.parentId);
      }
      return next ?? prev;
    });
  }, [currentPageId, pages]);

  // ── Pending page timeout ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!pendingPageId) return;
    if (currentPageId === pendingPageId) { setPendingPageId(null); return; }
    const timeoutId = window.setTimeout(() => {
      setPendingPageId((current) => (current === pendingPageId ? null : current));
    }, 2000);
    return () => window.clearTimeout(timeoutId);
  }, [currentPageId, pendingPageId]);

  // ── Page tree memos ─────────────────────────────────────────────────────────
  const pageTree = useMemo(() => getPageTree(), [pages]); // eslint-disable-line react-hooks/exhaustive-deps
  const pageTreeMap = useMemo(() => {
    const map = new Map();
    const visit = (nodes: typeof pageTree) => {
      nodes.forEach((node) => { map.set(node.id, node); visit(node.children); });
    };
    visit(pageTree);
    return map;
  }, [pageTree]);

  const visiblePageTreeItems = useMemo(
    () => flattenVisiblePageTree(pageTree, expandedPages),
    [pageTree, expandedPages]
  );

  const sidebarPages = useMemo(() => getSidebarPages(pages), [pages]);

  const recentPages = useMemo(
    () =>
      [...sidebarPages]
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
        .slice(0, 4),
    [sidebarPages]
  );

  const currentWorkspace = workspaces.find((ws) => ws.id === workspaceId) ?? null;
  const currentWorkspaceOwnerImage =
    currentWorkspace?.ownerImage ??
    (currentWorkspace?.ownerId === session?.user?.id ? session?.user?.image ?? null : null);

  // ── Handlers ─────────────────────────────────────────────────────────────────
  const handleToggleExpand = (pageId: string) => {
    setExpandedPages((prev) => {
      const next = new Set(prev);
      if (next.has(pageId)) { next.delete(pageId); } else { next.add(pageId); }
      return next;
    });
  };

  const expandPage = (pageId: string) => {
    setExpandedPages((prev) => new Set(prev).add(pageId));
  };

  const handleSelectPage = (pageId: string) => {
    if (pageId === currentPageId) return;
    setPendingPageId(pageId);
    startTransition(() => { router.push(`/workspace/${workspaceId}?page=${pageId}`); });
  };

  const handleSelectWorkspace = (nextWorkspaceId: string) => {
    if (nextWorkspaceId === workspaceId) return;
    router.push(`/workspace/${nextWorkspaceId}`);
  };

  const handleCreatePage = async (type: PageType) => {
    const newPage = await createPage({ title: createPageTitles[type], type, parentId: null, workspaceId });
    if (newPage) {
      router.push(`/workspace/${workspaceId}?page=${newPage.id}`);
    }
    return newPage;
  };

  const handleCreateChildPage = async (parentId: string, type: PageType) => {
    const newPage = await createPage({ title: createPageTitles[type], type, parentId, workspaceId });
    if (newPage) {
      expandPage(parentId);
      router.push(`/workspace/${workspaceId}?page=${newPage.id}`);
    }
    return newPage;
  };

  const handleDeletePage = async (pageId: string) => {
    const deletedPageIds = new Set<string>();
    const queue = [pageId];
    while (queue.length > 0) {
      const current = queue.shift()!;
      if (deletedPageIds.has(current)) continue;
      deletedPageIds.add(current);
      pages.forEach((page) => {
        if (page.parentId === current && !deletedPageIds.has(page.id)) queue.push(page.id);
      });
    }
    await deletePage(pageId);
    const deletionApplied = !usePageStore.getState().pages.some((page) => page.id === pageId);
    if (deletionApplied && currentPageId && deletedPageIds.has(currentPageId)) {
      router.push(`/workspace/${workspaceId}`);
    }
  };

  return {
    // state
    expandedPages,
    pendingPageId,
    workspaces,
    sidebarWidth,
    setSidebarWidth,
    isSidebarHidden,
    setIsSidebarHidden,
    // derived
    pages,
    currentPageId,
    effectiveCurrentPageId,
    pageAudienceById,
    showPageTreeSkeleton,
    pageTree,
    pageTreeMap,
    visiblePageTreeItems,
    recentPages,
    currentWorkspace,
    currentWorkspaceOwnerImage,
    // handlers
    handleToggleExpand,
    expandPage,
    handleSelectPage,
    handleSelectWorkspace,
    handleCreatePage,
    handleCreateChildPage,
    handleDeletePage,
  };
}
