"use client";

import { ExternalLink } from "lucide-react";
import type {
  DatabasePage,
  Page,
} from "@/types";
import { ViewTabs } from "@/components/database/ViewTabs";

interface DatabaseSelectionProps {
  pages: Page[];
  selectedValue: string;
  onChange: (pageId: string) => void;
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
  const showTopBar = Boolean(selection || headerLabel || onOpenDatabase);
  const currentState =
    state ?? (isLoading ? "loading" : databasePage ? "ready" : "empty");

  return (
    <div
      data-testid={containerTestId}
      data-state={currentState}
      className="overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-50 not-prose dark:border-zinc-800 dark:bg-zinc-900/70"
    >
      {showTopBar ? (
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            {headerLabel ? (
              <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                {headerLabel}
              </span>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2">
            {selection ? (
              <select
                data-testid="inline-database-select"
                value={selection.selectedValue}
                onChange={(event) => selection.onChange(event.target.value)}
                className="min-w-48 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-[#111110] outline-none transition focus:border-[#2E7D45] dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
              >
                <option value="">Pick existing</option>
                {selection.pages.map((page) => (
                  <option key={page.id} value={page.id}>
                    {page.title}
                  </option>
                ))}
              </select>
            ) : null}

            {onOpenDatabase ? (
              <button
                type="button"
                onClick={onOpenDatabase}
                className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-100"
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
          <div className="flex items-center justify-between px-4 py-3">
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
                <div className="truncate text-sm font-semibold text-[#111110] dark:text-zinc-100">
                  {databasePage.icon ? `${databasePage.icon} ` : ""}
                  {databasePage.title}
                </div>
              )}
              <div className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                {databasePage.database.rows.length} rows, {databasePage.database.columns.length} columns
              </div>
            </div>
          </div>

          <div className="min-h-0 flex-1 border-t border-zinc-200 dark:border-zinc-800">
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
