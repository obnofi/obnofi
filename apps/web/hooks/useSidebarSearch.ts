"use client";

import { useState, useEffect } from "react";
import type { SearchMode, PageSearchResult } from "@/lib/sidebarPageTree";

interface UseSidebarSearchOptions {
  workspaceId: string;
}

export function useSidebarSearch({ workspaceId }: UseSidebarSearchOptions) {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchMode, setSearchMode] = useState<SearchMode>("title_content");
  const [searchResults, setSearchResults] = useState<PageSearchResult[]>([]);
  const [isSearchLoading, setIsSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  // ── Global ⌘K shortcut ──────────────────────────────────────────────────────
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

  // ── Debounced search fetch ──────────────────────────────────────────────────
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
          setSearchError(
            error instanceof Error ? error.message : "검색 결과를 불러오지 못했습니다."
          );
        }
      } finally {
        if (!cancelled) setIsSearchLoading(false);
      }
    }, 180);

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [isSearchOpen, searchMode, searchQuery, workspaceId]);

  const handleOpenSearch = () => setIsSearchOpen(true);
  const handleCloseSearch = () => setIsSearchOpen(false);

  return {
    isSearchOpen,
    searchQuery,
    setSearchQuery,
    searchMode,
    setSearchMode,
    searchResults,
    isSearchLoading,
    searchError,
    handleOpenSearch,
    handleCloseSearch,
  };
}
