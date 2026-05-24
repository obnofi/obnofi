"use client";

import { useState, useMemo } from "react";
import { Plus, Search, Grid3X3, List } from "lucide-react";
import { Page, PageType } from "@obnofi/types";
import { creatablePageLabels, creatablePageTypes } from "@/lib/pageCreation";
import { typeIcons } from "@/lib/databaseViewUtils";
import { DatabaseViewTable } from "./DatabaseViewTable";
import { DatabaseViewGrid } from "./DatabaseViewGrid";

interface DatabaseViewProps {
  databasePage: Page;
  childPages: Page[];
  onCreateChildAction: string;
  onSelectChildAction: string;
}

type ViewMode = "table" | "grid";
type SortField = "title" | "type" | "updatedAt";
type SortDirection = "asc" | "desc";

export function DatabaseView({
  childPages,
  onCreateChildAction,
  onSelectChildAction,
}: DatabaseViewProps) {
  const handleCreateChild = (type: PageType) => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent(onCreateChildAction, { detail: type }));
    }
  };

  const handleSelectChild = (pageId: string) => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent(onSelectChildAction, { detail: pageId }));
    }
  };

  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState<SortField>("updatedAt");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [showNewMenu, setShowNewMenu] = useState(false);

  const filteredAndSortedPages = useMemo(() => {
    let result = [...childPages];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter((p) => p.title.toLowerCase().includes(query));
    }

    result.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case "title": comparison = a.title.localeCompare(b.title); break;
        case "type": comparison = a.type.localeCompare(b.type); break;
        case "updatedAt": comparison = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime(); break;
      }
      return sortDirection === "asc" ? comparison : -comparison;
    });

    return result;
  }, [childPages, searchQuery, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-md">
            <Search className="w-4 h-4 text-zinc-400" />
            <input
              name="row-filter"
              type="text"
              placeholder="Filter..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent text-sm outline-none placeholder:text-zinc-400 text-[#111110] dark:text-zinc-100 w-40"
            />
          </div>

          <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800 rounded-md p-1">
            <button
              onClick={() => setViewMode("table")}
              className={`p-1.5 rounded transition-colors ${
                viewMode === "table"
                  ? "bg-white dark:bg-zinc-700 shadow-sm"
                  : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
              }`}
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded transition-colors ${
                viewMode === "grid"
                  ? "bg-white dark:bg-zinc-700 shadow-sm"
                  : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
              }`}
            >
              <Grid3X3 className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="relative">
          <button
            onClick={() => setShowNewMenu(!showNewMenu)}
            className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-white bg-[#2E7D45] hover:bg-[#256a3a] rounded-md transition-colors"
          >
            <Plus className="w-4 h-4" />
            New
          </button>

          {showNewMenu && (
            <div className="absolute top-full right-0 z-[99999] mt-1 w-40 rounded-md border border-zinc-200 bg-white py-1 shadow-lg dark:border-zinc-700 dark:bg-zinc-800">
              {creatablePageTypes.map((type) => (
                <button
                  key={type}
                  onClick={() => { handleCreateChild(type); setShowNewMenu(false); }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
                >
                  <span>{typeIcons[type]}</span>
                  {creatablePageLabels[type]}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      {viewMode === "table" ? (
        <DatabaseViewTable
          pages={filteredAndSortedPages}
          sortField={sortField}
          searchQuery={searchQuery}
          onSelectChild={handleSelectChild}
          onSort={handleSort}
        />
      ) : (
        <div className="flex-1 overflow-auto p-4">
          <DatabaseViewGrid
            pages={filteredAndSortedPages}
            searchQuery={searchQuery}
            onSelectChild={handleSelectChild}
          />
        </div>
      )}
    </div>
  );
}
