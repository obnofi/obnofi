"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, ExternalLink, Plus } from "lucide-react";
import type {
  DatabasePage,
  Page,
} from "@/types";
import { ViewTabs } from "@/components/database/ViewTabs";

interface DatabaseSelectionProps {
  pages: Page[];
  selectedValue: string;
  onChange: (pageId: string) => void;
  onCreate?: () => void;
}

interface DatabaseTableCardProps {
  databasePage: DatabasePage | null;
  isLoading: boolean;
  onDatabaseChange: (databasePage: DatabasePage) => void;
  onOpenRow: (rowId: string) => void;
  onTitleChange?: (title: string) => void | Promise<void>;
  selection?: DatabaseSelectionProps;
  headerLabel?: string;
  onOpenDatabase?: () => void;
  emptyMessage: string;
  loadingTestId: string;
  readyTestId: string;
  emptyTestId: string;
  containerTestId: string;
  compact?: boolean;
  maxContentHeightClass?: string;
  state?: "loading" | "ready" | "creating" | "empty";
}

export function DatabaseTableCard({
  databasePage,
  isLoading,
  onDatabaseChange,
  onOpenRow,
  onTitleChange,
  selection,
  headerLabel,
  onOpenDatabase,
  emptyMessage,
  loadingTestId,
  readyTestId,
  emptyTestId,
  containerTestId,
  compact = true,
  maxContentHeightClass = "max-h-[380px]",
  state,
}: DatabaseTableCardProps) {
  const [isSelectionOpen, setIsSelectionOpen] = useState(false);
  const selectionMenuRef = useRef<HTMLDivElement>(null);
  const showTopBar = Boolean(selection || headerLabel || onOpenDatabase);
  const currentState =
    state ?? (isLoading ? "loading" : databasePage ? "ready" : "empty");

  useEffect(() => {
    if (!isSelectionOpen) {
      return;
    }

    const handleClickOutside = (event: MouseEvent) => {
      if (
        selectionMenuRef.current &&
        !selectionMenuRef.current.contains(event.target as Node)
      ) {
        setIsSelectionOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isSelectionOpen]);

  const selectedPage = selection?.pages.find(
    (page) => page.id === selection.selectedValue
  );

  return (
    <div
      data-testid={containerTestId}
      data-state={currentState}
      className="overflow-hidden rounded-xl border border-gray-200 bg-white not-prose shadow-sm dark:border-zinc-800 dark:bg-zinc-950"
    >
      {showTopBar ? (
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-200 px-4 py-3 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            {headerLabel ? (
              <span className="text-xs font-medium uppercase tracking-wide text-gray-400 dark:text-zinc-400">
                {headerLabel}
              </span>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2">
            {selection ? (
              <div className="relative" ref={selectionMenuRef}>
                <button
                  type="button"
                  data-testid="inline-database-select"
                  onClick={() => setIsSelectionOpen((current) => !current)}
                  className="inline-flex min-w-48 items-center justify-between gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-[#111110] outline-none transition hover:bg-gray-50 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:hover:bg-zinc-900"
                >
                  <span className="truncate">
                    {selectedPage?.title ?? "데이터베이스 선택"}
                  </span>
                  <ChevronDown className="h-4 w-4 shrink-0 text-gray-400" />
                </button>

                {isSelectionOpen ? (
                  <div className="absolute right-0 top-full z-[99999] mt-1 min-w-56 rounded-lg border border-gray-200 bg-white py-1 shadow-lg dark:border-zinc-800 dark:bg-zinc-900">
                    <button
                      type="button"
                      onClick={() => {
                        selection.onCreate?.();
                        setIsSelectionOpen(false);
                      }}
                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-gray-700 transition hover:bg-gray-100 dark:text-zinc-200 dark:hover:bg-zinc-800"
                    >
                      <Plus className="h-4 w-4" />
                      데이터베이스 추가
                    </button>
                    <div className="my-1 border-t border-gray-100 dark:border-zinc-800" />
                    {selection.pages.map((page) => (
                      <button
                        key={page.id}
                        type="button"
                        onClick={() => {
                          selection.onChange(page.id);
                          setIsSelectionOpen(false);
                        }}
                        className="flex w-full items-center px-3 py-2 text-left text-sm text-gray-700 transition hover:bg-gray-100 dark:text-zinc-200 dark:hover:bg-zinc-800"
                      >
                        <span className="truncate">{page.title}</span>
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
            ) : null}

            {onOpenDatabase ? (
              <button
                type="button"
                onClick={onOpenDatabase}
                className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-gray-600 transition hover:bg-gray-100 hover:text-gray-900 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-100"
              >
                Open
                <ExternalLink className="h-3.5 w-3.5" />
              </button>
            ) : null}
          </div>
        </div>
      ) : null}

      {isLoading ? (
        <div data-testid={loadingTestId} className="flex h-56 items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-300 border-t-[#2E7D45]" />
        </div>
      ) : databasePage ? (
        <div data-testid={readyTestId} className={`flex min-h-0 flex-col ${maxContentHeightClass}`}>
          <div className="flex items-center justify-between px-4 py-4">
            <div className="min-w-0">
              {onTitleChange ? (
                <input
                  type="text"
                  value={databasePage.title}
                  onChange={(event) => onTitleChange(event.target.value)}
                  className="w-full border-none bg-transparent text-[40px] font-bold text-[#111110] outline-none placeholder:text-gray-300 dark:text-zinc-100 dark:placeholder:text-zinc-600"
                  placeholder="Untitled"
                />
              ) : (
                <div className="truncate text-sm font-semibold text-gray-900 dark:text-zinc-100">
                  {databasePage.icon ? `${databasePage.icon} ` : ""}
                  {databasePage.title}
                </div>
              )}
              <div className="mt-1 text-xs text-gray-500 dark:text-zinc-400">
                {databasePage.database.rows.length} rows, {databasePage.database.columns.length} columns
              </div>
            </div>
          </div>

          <div className="min-h-0 flex-1 border-t border-gray-200 dark:border-zinc-800">
            <ViewTabs
              databasePage={databasePage}
              onDatabaseChange={onDatabaseChange}
              onOpenRow={onOpenRow}
              compact={compact}
            />
          </div>
        </div>
      ) : (
        <div data-testid={emptyTestId} className="px-4 py-8 text-sm text-zinc-500 dark:text-zinc-400">
          {emptyMessage}
        </div>
      )}
    </div>
  );
}
