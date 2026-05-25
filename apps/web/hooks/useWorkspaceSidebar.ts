"use client";

import { useState, useRef, useCallback, useMemo, useEffect, startTransition } from "react";
import { useRouter } from "next/navigation";
import { useSidebarSearch } from "./useSidebarSearch";
import { useSidebarNavigation } from "./useSidebarNavigation";
import { useSidebarDrag } from "./useSidebarDrag";
import { collectDescendantIds, clamp, MIN_SIDEBAR_WIDTH, MAX_SIDEBAR_WIDTH } from "@/lib/sidebarPageTree";
import type { PageType } from "@obnofi/types";
import { createPageTitles } from "@/lib/pageCreation";
import { usePageStore } from "@/store/pageStore";

export function useWorkspaceSidebar(workspaceId: string) {
  const router = useRouter();

  const [showNewPageMenu, setShowNewPageMenu] = useState(false);
  const [isWorkspaceMenuOpen, setIsWorkspaceMenuOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
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

  // ── Sub-hooks ──────────────────────────────────────────────────────────────
  const search = useSidebarSearch({ workspaceId });

  const nav = useSidebarNavigation(workspaceId);

  const handleCloseMenu = useCallback(() => {
    setActiveMenuNodeId(null);
    menuButtonRef.current = null;
  }, []);

  const handleCloseCreateMenu = useCallback(() => { setCreateMenuState(null); }, []);

  const drag = useSidebarDrag({
    workspaceId,
    visiblePageTreeItems: nav.visiblePageTreeItems,
    pageTreeMap: nav.pageTreeMap,
    onMenuClose: handleCloseMenu,
    onCreateMenuClose: handleCloseCreateMenu,
    onExpandParent: nav.expandPage,
  });

  // Re-compute visiblePageTreeItems with dragged-descendant filter
  const hiddenDraggedDescendantIds = useMemo(() => {
    if (!drag.activeDragPageId) return new Set<string>();
    const activeNode = nav.pageTreeMap.get(drag.activeDragPageId);
    return new Set(activeNode ? collectDescendantIds(activeNode) : []);
  }, [drag.activeDragPageId, nav.pageTreeMap]);

  const visiblePageTreeItems = useMemo(
    () => nav.visiblePageTreeItems.filter((item) => !hiddenDraggedDescendantIds.has(item.id)),
    [nav.visiblePageTreeItems, hiddenDraggedDescendantIds]
  );

  // ── Reset menus on navigation ──────────────────────────────────────────────
  useEffect(() => {
    search.handleCloseSearch();
    setShowNewPageMenu(false);
    setIsWorkspaceMenuOpen(false);
    setActiveMenuNodeId(null);
    setCreateMenuState(null);
  }, [workspaceId, nav.currentPageId]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Click-outside handlers ─────────────────────────────────────────────────
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

  // ── Sidebar resize ─────────────────────────────────────────────────────────
  useEffect(() => {
    const handlePointerMove = (event: MouseEvent) => {
      const resizeState = sidebarResizeStateRef.current;
      if (!resizeState) return;
      const nextWidth = clamp(
        resizeState.startWidth + (event.clientX - resizeState.startX),
        MIN_SIDEBAR_WIDTH,
        MAX_SIDEBAR_WIDTH
      );
      nav.setSidebarWidth(nextWidth);
    };
    const handlePointerUp = () => { sidebarResizeStateRef.current = null; };
    window.addEventListener("mousemove", handlePointerMove);
    window.addEventListener("mouseup", handlePointerUp);
    return () => {
      window.removeEventListener("mousemove", handlePointerMove);
      window.removeEventListener("mouseup", handlePointerUp);
    };
  }, [nav.setSidebarWidth]);

  // ── Menu handlers ──────────────────────────────────────────────────────────
  const handleOpenMenu = useCallback((nodeId: string, buttonEl: HTMLButtonElement) => {
    const rect = buttonEl.getBoundingClientRect();
    setCreateMenuState(null);
    setMenuPosition({ top: rect.top, left: rect.right + 4 });
    menuButtonRef.current = buttonEl;
    setActiveMenuNodeId(nodeId);
  }, []);

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
    nav.setIsSidebarHidden(true);
  }, [handleCloseCreateMenu, handleCloseMenu, nav.setIsSidebarHidden]);

  const handleShowSidebar = useCallback(() => { nav.setIsSidebarHidden(false); }, [nav.setIsSidebarHidden]);

  const handleSidebarResizeStart = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      event.preventDefault();
      sidebarResizeStateRef.current = { startX: event.clientX, startWidth: nav.sidebarWidth };
    },
    [nav.sidebarWidth]
  );

  // ── Page creation ──────────────────────────────────────────────────────────
  const { createPage } = usePageStore();

  const handleCreatePage = async (type: PageType) => {
    const newPage = await createPage({ title: createPageTitles[type], type, parentId: null, workspaceId });
    if (newPage) {
      setShowNewPageMenu(false);
      router.push(`/workspace/${workspaceId}?page=${newPage.id}`);
    }
  };

  const handleCreateFromSidebarMenu = async (type: PageType) => {
    const parentId = createMenuState?.parentId ?? null;
    if (parentId) {
      await nav.handleCreateChildPage(parentId, type);
    } else {
      await handleCreatePage(type);
    }
    handleCloseCreateMenu();
  };

  const handleSelectSearchResult = useCallback(
    (pageId: string) => {
      search.handleCloseSearch();
      if (pageId === nav.currentPageId) return;
      startTransition(() => { router.push(`/workspace/${workspaceId}?page=${pageId}`); });
    },
    [nav.currentPageId, router, workspaceId, search.handleCloseSearch] // eslint-disable-line react-hooks/exhaustive-deps
  );

  const handleSelectWorkspace = (nextWorkspaceId: string) => {
    setIsWorkspaceMenuOpen(false);
    nav.handleSelectWorkspace(nextWorkspaceId);
  };

  return {
    // UI state
    showNewPageMenu,
    setShowNewPageMenu,
    isWorkspaceMenuOpen,
    setIsWorkspaceMenuOpen,
    isSettingsOpen,
    setIsSettingsOpen,
    createMenuState,
    activeMenuNodeId,
    menuPosition,
    // refs
    filesCreateButtonRef,
    workspaceMenuRef,
    // search
    isSearchOpen: search.isSearchOpen,
    searchQuery: search.searchQuery,
    setSearchQuery: search.setSearchQuery,
    searchMode: search.searchMode,
    setSearchMode: search.setSearchMode,
    searchResults: search.searchResults,
    isSearchLoading: search.isSearchLoading,
    searchError: search.searchError,
    handleOpenSearch: search.handleOpenSearch,
    handleCloseSearch: search.handleCloseSearch,
    // navigation
    currentPageId: nav.currentPageId,
    effectiveCurrentPageId: nav.effectiveCurrentPageId,
    pageAudienceById: nav.pageAudienceById,
    showPageTreeSkeleton: nav.showPageTreeSkeleton,
    pageTree: nav.pageTree,
    recentPages: nav.recentPages,
    currentWorkspace: nav.currentWorkspace,
    currentWorkspaceOwnerImage: nav.currentWorkspaceOwnerImage,
    workspaces: nav.workspaces,
    expandedPages: nav.expandedPages,
    sidebarWidth: nav.sidebarWidth,
    isSidebarHidden: nav.isSidebarHidden,
    handleToggleExpand: nav.handleToggleExpand,
    handleSelectPage: nav.handleSelectPage,
    handleDeletePage: nav.handleDeletePage,
    // drag
    activeDragPageId: drag.activeDragPageId,
    sensors: drag.sensors,
    projectedDrop: drag.projectedDrop,
    visiblePageTreeItems,
    handleDragStart: drag.handleDragStart,
    handleDragMove: drag.handleDragMove,
    handleDragEnd: drag.handleDragEnd,
    handleDragCancel: drag.handleDragCancel,
    // combined handlers
    handleOpenMenu,
    handleCloseMenu,
    handleOpenCreateMenu,
    handleCloseCreateMenu,
    handleHideSidebar,
    handleShowSidebar,
    handleSidebarResizeStart,
    handleCreatePage,
    handleCreateFromSidebarMenu,
    handleSelectSearchResult,
    handleSelectWorkspace,
  };
}
