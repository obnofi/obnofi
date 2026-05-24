"use client";

import {
  useEffect,
  useState,
  useRef,
  useCallback,
  useMemo,
  startTransition,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import type { DragEndEvent, DragMoveEvent, DragStartEvent } from "@dnd-kit/core";
import { PointerSensor, closestCenter, useSensor, useSensors } from "@dnd-kit/core";
import { useCollaboration } from "@/lib/collaboration/CollaborationContext";
import { usePageStore } from "@/store/pageStore";
import { createPageTitles } from "@/lib/pageCreation";
import type { PageType } from "@obnofi/types";
import {
  clamp,
  flattenVisiblePageTree,
  collectDescendantIds,
  getProjectedDropPosition,
  getReorderedSiblingIds,
  DEFAULT_SIDEBAR_WIDTH,
  MIN_SIDEBAR_WIDTH,
  MAX_SIDEBAR_WIDTH,
  PAGE_ORDER_STEP,
  SIDEBAR_WIDTH_STORAGE_KEY,
  SIDEBAR_HIDDEN_STORAGE_KEY,
  type SearchMode,
  type PageSearchResult,
  type WorkspaceOption,
} from "@/lib/sidebarPageTree";

export function useWorkspaceSidebar(workspaceId: string) {
  const router = useRouter();
  const { data: session } = useSession();
  const collaboration = useCollaboration();
  const awarenessStates = Array.isArray(collaboration.awarenessStates)
    ? collaboration.awarenessStates
    : [];
  const updateCursor = collaboration.updateCursor ?? (() => {});
  const localUserId = collaboration.localUserId ?? null;

  const [expandedPages, setExpandedPages] = useState<Set<string>>(new Set());
  const [showNewPageMenu, setShowNewPageMenu] = useState(false);
  const [isWorkspaceMenuOpen, setIsWorkspaceMenuOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchMode, setSearchMode] = useState<SearchMode>("title_content");
  const [searchResults, setSearchResults] = useState<PageSearchResult[]>([]);
  const [isSearchLoading, setIsSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [workspaces, setWorkspaces] = useState<WorkspaceOption[]>([]);
  const [activeDragPageId, setActiveDragPageId] = useState<string | null>(null);
  const [overDragPageId, setOverDragPageId] = useState<string | null>(null);
  const [dragOffsetX, setDragOffsetX] = useState(0);
  const [pendingPageId, setPendingPageId] = useState<string | null>(null);
  const [sidebarWidth, setSidebarWidth] = useState(DEFAULT_SIDEBAR_WIDTH);
  const [isSidebarHidden, setIsSidebarHidden] = useState(false);
  const [createMenuState, setCreateMenuState] = useState<{
    parentId: string | null;
    position: { top: number; left: number };
  } | null>(null);
  const [activeMenuNodeId, setActiveMenuNodeId] = useState<string | null>(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });

  const menuButtonRef = useRef<HTMLButtonElement | null>(null);
  const filesCreateButtonRef = useRef<HTMLButtonElement>(null);
  const workspaceMenuRef = useRef<HTMLDivElement>(null);
  const sidebarResizeStateRef = useRef<{ startX: number; startWidth: number } | null>(null);

  const { pages, fetchPages, getPageTree, createPage, updatePage, deletePage } = usePageStore();
  const initializedWorkspaceId = usePageStore((state) => state.initializedWorkspaceId);
  const searchParams = useSearchParams();
  const currentPageId = searchParams.get("page") ?? undefined;
  const effectiveCurrentPageId = pendingPageId ?? currentPageId;

  const pageAudienceById = useMemo(() => {
    const audienceMap = new Map<string, Array<{ userId: string; userName: string }>>();
    awarenessStates.forEach((state) => {
      if (state.userId === localUserId || !state.userCursor?.pageId) return;
      const currentAudience = audienceMap.get(state.userCursor.pageId) ?? [];
      currentAudience.push({ userId: state.userId, userName: state.userName });
      audienceMap.set(state.userCursor.pageId, currentAudience);
    });
    return audienceMap;
  }, [awarenessStates, localUserId]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  );

  const showPageTreeSkeleton = initializedWorkspaceId !== workspaceId;

  // ── Reset menus on navigation ─────────────────────────────────────────────
  useEffect(() => {
    setIsSearchOpen(false);
    setShowNewPageMenu(false);
    setIsWorkspaceMenuOpen(false);
    setActiveMenuNodeId(null);
    setCreateMenuState(null);
  }, [workspaceId, currentPageId]);

  // ── Cursor tracking ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!effectiveCurrentPageId) return;
    updateCursor({ type: "page", pageId: effectiveCurrentPageId, canvasPosition: null, databaseCell: null });
    return () => { updateCursor(null); };
  }, [effectiveCurrentPageId, updateCursor]);

  // ── Restore sidebar persistence from localStorage ─────────────────────────
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

  // ── Click-outside handlers ────────────────────────────────────────────────
  useEffect(() => {
    if (!activeMenuNodeId) return;
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (target?.closest?.("[data-page-tree-menu]")) return;
      if (menuButtonRef.current && !menuButtonRef.current.contains(target as Node)) {
        setActiveMenuNodeId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [activeMenuNodeId]);

  useEffect(() => {
    if (!createMenuState) return;
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (target?.closest?.("[data-page-create-menu]")) return;
      if (filesCreateButtonRef.current && filesCreateButtonRef.current.contains(target as Node)) return;
      setCreateMenuState(null);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [createMenuState]);

  useEffect(() => {
    if (!isWorkspaceMenuOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (workspaceMenuRef.current?.contains(target as Node)) return;
      setIsWorkspaceMenuOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isWorkspaceMenuOpen]);

  // ── Sidebar resize ────────────────────────────────────────────────────────
  useEffect(() => {
    const handlePointerMove = (event: MouseEvent) => {
      const resizeState = sidebarResizeStateRef.current;
      if (!resizeState) return;
      const nextWidth = clamp(
        resizeState.startWidth + (event.clientX - resizeState.startX),
        MIN_SIDEBAR_WIDTH,
        MAX_SIDEBAR_WIDTH
      );
      setSidebarWidth(nextWidth);
    };
    const handlePointerUp = () => { sidebarResizeStateRef.current = null; };
    window.addEventListener("mousemove", handlePointerMove);
    window.addEventListener("mouseup", handlePointerUp);
    return () => {
      window.removeEventListener("mousemove", handlePointerMove);
      window.removeEventListener("mouseup", handlePointerUp);
    };
  }, []);

  // ── Pages fetch ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (!workspaceId) return;
    if (usePageStore.getState().initializedWorkspaceId === workspaceId) return;
    fetchPages(workspaceId);
  }, [workspaceId, fetchPages]);

  // ── Workspaces fetch ──────────────────────────────────────────────────────
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

  // ── Auto-expand ancestors of current page ────────────────────────────────
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

  // ── Pending page timeout ──────────────────────────────────────────────────
  useEffect(() => {
    if (!pendingPageId) return;
    if (currentPageId === pendingPageId) { setPendingPageId(null); return; }
    const timeoutId = window.setTimeout(() => {
      setPendingPageId((current) => (current === pendingPageId ? null : current));
    }, 2000);
    return () => window.clearTimeout(timeoutId);
  }, [currentPageId, pendingPageId]);

  // ── Global ⌘K shortcut ────────────────────────────────────────────────────
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setIsSearchOpen(true);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  // ── Search debounce ───────────────────────────────────────────────────────
  useEffect(() => {
    const query = searchQuery.trim();
    if (!isSearchOpen) return;
    if (!query) {
      setSearchResults([]);
      setSearchError(null);
      setIsSearchLoading(false);
      return;
    }

    let cancelled = false;
    const timeoutId = window.setTimeout(async () => {
      setIsSearchLoading(true);
      setSearchError(null);
      try {
        const response = await fetch(
          `/api/pages/search?workspaceId=${encodeURIComponent(workspaceId)}&q=${encodeURIComponent(query)}&mode=${encodeURIComponent(searchMode)}`
        );
        if (!response.ok) throw new Error("검색 결과를 불러오지 못했습니다.");
        const nextResults = (await response.json()) as PageSearchResult[];
        if (!cancelled) setSearchResults(nextResults);
      } catch (error) {
        if (!cancelled) {
          setSearchResults([]);
          setSearchError(error instanceof Error ? error.message : "검색 결과를 불러오지 못했습니다.");
        }
      } finally {
        if (!cancelled) setIsSearchLoading(false);
      }
    }, 180);

    return () => { cancelled = true; window.clearTimeout(timeoutId); };
  }, [isSearchOpen, searchMode, searchQuery, workspaceId]);

  // ── Memos ─────────────────────────────────────────────────────────────────
  const pageTree = useMemo(() => getPageTree(), [pages]); // eslint-disable-line react-hooks/exhaustive-deps
  const pageTreeMap = useMemo(() => {
    const map = new Map();
    const visit = (nodes: typeof pageTree) => {
      nodes.forEach((node) => { map.set(node.id, node); visit(node.children); });
    };
    visit(pageTree);
    return map;
  }, [pageTree]);

  const hiddenDraggedDescendantIds = useMemo(() => {
    if (!activeDragPageId) return new Set<string>();
    const activeNode = pageTreeMap.get(activeDragPageId);
    return new Set(activeNode ? collectDescendantIds(activeNode) : []);
  }, [activeDragPageId, pageTreeMap]);

  const visiblePageTreeItems = useMemo(
    () =>
      flattenVisiblePageTree(pageTree, expandedPages).filter(
        (item) => !hiddenDraggedDescendantIds.has(item.id)
      ),
    [pageTree, expandedPages, hiddenDraggedDescendantIds]
  );

  const projectedDrop = useMemo(() => {
    if (!activeDragPageId || !overDragPageId || visiblePageTreeItems.length === 0) return null;
    return getProjectedDropPosition(visiblePageTreeItems, activeDragPageId, overDragPageId, dragOffsetX);
  }, [activeDragPageId, overDragPageId, dragOffsetX, visiblePageTreeItems]);

  const recentPages = useMemo(
    () =>
      [...pages]
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
        .slice(0, 4),
    [pages]
  );

  const currentWorkspace = workspaces.find((ws) => ws.id === workspaceId) ?? null;
  const currentWorkspaceOwnerImage =
    currentWorkspace?.ownerImage ??
    (currentWorkspace?.ownerId === session?.user?.id ? session?.user?.image ?? null : null);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleToggleExpand = (pageId: string) => {
    setExpandedPages((prev) => {
      const next = new Set(prev);
      if (next.has(pageId)) { next.delete(pageId); } else { next.add(pageId); }
      return next;
    });
  };

  const handleSelectPage = (pageId: string) => {
    if (pageId === currentPageId) return;
    setPendingPageId(pageId);
    startTransition(() => { router.push(`/workspace/${workspaceId}?page=${pageId}`); });
  };

  const handleOpenSearch = useCallback(() => { setIsSearchOpen(true); }, []);
  const handleCloseSearch = useCallback(() => { setIsSearchOpen(false); }, []);

  const handleSelectSearchResult = useCallback(
    (pageId: string) => {
      setIsSearchOpen(false);
      if (pageId === currentPageId) return;
      setPendingPageId(pageId);
      startTransition(() => { router.push(`/workspace/${workspaceId}?page=${pageId}`); });
    },
    [currentPageId, router, workspaceId]
  );

  const handleSelectWorkspace = (nextWorkspaceId: string) => {
    setIsWorkspaceMenuOpen(false);
    if (nextWorkspaceId === workspaceId) return;
    router.push(`/workspace/${nextWorkspaceId}`);
  };

  const handleCloseMenu = useCallback(() => {
    setActiveMenuNodeId(null);
    menuButtonRef.current = null;
  }, []);

  const handleCloseCreateMenu = useCallback(() => { setCreateMenuState(null); }, []);

  const handleOpenMenu = useCallback(
    (nodeId: string, buttonEl: HTMLButtonElement) => {
      const rect = buttonEl.getBoundingClientRect();
      setCreateMenuState(null);
      setMenuPosition({ top: rect.top, left: rect.right + 4 });
      menuButtonRef.current = buttonEl;
      setActiveMenuNodeId(nodeId);
    },
    []
  );

  const handleOpenCreateMenu = useCallback(
    (parentId: string | null, buttonEl: HTMLButtonElement) => {
      const rect = buttonEl.getBoundingClientRect();
      handleCloseMenu();
      setCreateMenuState({ parentId, position: { top: rect.bottom + 4, left: rect.left } });
    },
    [handleCloseMenu]
  );

  const handleHideSidebar = useCallback(() => {
    setShowNewPageMenu(false);
    setIsWorkspaceMenuOpen(false);
    handleCloseMenu();
    handleCloseCreateMenu();
    setIsSidebarHidden(true);
  }, [handleCloseCreateMenu, handleCloseMenu]);

  const handleShowSidebar = useCallback(() => { setIsSidebarHidden(false); }, []);

  const handleSidebarResizeStart = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      event.preventDefault();
      sidebarResizeStateRef.current = { startX: event.clientX, startWidth: sidebarWidth };
    },
    [sidebarWidth]
  );

  const handleCreatePage = async (type: PageType) => {
    const newPage = await createPage({ title: createPageTitles[type], type, parentId: null, workspaceId });
    if (newPage) {
      setShowNewPageMenu(false);
      router.push(`/workspace/${workspaceId}?page=${newPage.id}`);
    }
  };

  const handleCreateChildPage = async (parentId: string, type: PageType) => {
    const newPage = await createPage({ title: createPageTitles[type], type, parentId, workspaceId });
    if (newPage) {
      setExpandedPages((prev) => new Set([...prev, parentId]));
      router.push(`/workspace/${workspaceId}?page=${newPage.id}`);
    }
  };

  const handleCreateFromSidebarMenu = async (type: PageType) => {
    const parentId = createMenuState?.parentId ?? null;
    if (parentId) { await handleCreateChildPage(parentId, type); }
    else { await handleCreatePage(type); }
    handleCloseCreateMenu();
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

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      setActiveDragPageId(String(event.active.id));
      setOverDragPageId(String(event.active.id));
      setDragOffsetX(0);
      handleCloseMenu();
      handleCloseCreateMenu();
    },
    [handleCloseCreateMenu, handleCloseMenu]
  );

  const handleDragMove = useCallback((event: DragMoveEvent) => {
    setDragOffsetX(event.delta.x);
    if (event.over?.id) setOverDragPageId(String(event.over.id));
  }, []);

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const activeId = String(event.active.id);
      const overId = event.over?.id ? String(event.over.id) : null;
      const projection =
        overId && activeId !== overId
          ? getProjectedDropPosition(visiblePageTreeItems, activeId, overId, dragOffsetX)
          : null;

      setActiveDragPageId(null);
      setOverDragPageId(null);
      setDragOffsetX(0);

      if (!overId || !projection || activeId === overId) return;

      if (projection.parentId) {
        const activeNode = pageTreeMap.get(activeId);
        const descendantIds = new Set(activeNode ? collectDescendantIds(activeNode) : []);
        if (descendantIds.has(projection.parentId)) return;
      }

      const nextSiblingIds = getReorderedSiblingIds(visiblePageTreeItems, activeId, overId, projection);
      if (nextSiblingIds.length === 0) {
        await updatePage(activeId, { parentId: projection.parentId, order: 0 });
        return;
      }

      await Promise.all(
        nextSiblingIds.map((pageId, index) =>
          updatePage(pageId, { parentId: projection.parentId, order: index * PAGE_ORDER_STEP })
        )
      );

      if (projection.parentId) {
        setExpandedPages((prev) => new Set(prev).add(projection.parentId as string));
      }
    },
    [dragOffsetX, pageTreeMap, updatePage, visiblePageTreeItems]
  );

  const handleDragCancel = useCallback(() => {
    setActiveDragPageId(null);
    setOverDragPageId(null);
    setDragOffsetX(0);
  }, []);

  return {
    // state
    expandedPages,
    showNewPageMenu,
    setShowNewPageMenu,
    isWorkspaceMenuOpen,
    setIsWorkspaceMenuOpen,
    isSettingsOpen,
    setIsSettingsOpen,
    isSearchOpen,
    searchQuery,
    setSearchQuery,
    searchMode,
    setSearchMode,
    searchResults,
    isSearchLoading,
    searchError,
    workspaces,
    activeDragPageId,
    sidebarWidth,
    isSidebarHidden,
    createMenuState,
    activeMenuNodeId,
    menuPosition,
    // refs
    filesCreateButtonRef,
    workspaceMenuRef,
    // derived
    currentPageId,
    effectiveCurrentPageId,
    pageAudienceById,
    sensors,
    showPageTreeSkeleton,
    pageTree,
    visiblePageTreeItems,
    projectedDrop,
    recentPages,
    currentWorkspace,
    currentWorkspaceOwnerImage,
    // handlers
    handleToggleExpand,
    handleSelectPage,
    handleOpenSearch,
    handleCloseSearch,
    handleSelectSearchResult,
    handleSelectWorkspace,
    handleOpenMenu,
    handleCloseMenu,
    handleOpenCreateMenu,
    handleCloseCreateMenu,
    handleHideSidebar,
    handleShowSidebar,
    handleSidebarResizeStart,
    handleCreatePage,
    handleCreateFromSidebarMenu,
    handleDeletePage,
    handleDragStart,
    handleDragMove,
    handleDragEnd,
    handleDragCancel,
  };
}
