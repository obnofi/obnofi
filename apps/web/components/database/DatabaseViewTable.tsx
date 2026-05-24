"use client";

import { ArrowUpDown, MoreHorizontal } from "lucide-react";
import { Page } from "@obnofi/types";
import { typeIcons, typeLabels, formatDate } from "@/lib/databaseViewUtils";

type SortField = "title" | "type" | "updatedAt";

interface DatabaseViewTableProps {
  pages: Page[];
  sortField: SortField;
  searchQuery: string;
  onSelectChild: (pageId: string) => void;
  onSort: (field: SortField) => void;
}

export function DatabaseViewTable({
  pages,
  sortField,
  searchQuery,
  onSelectChild,
  onSort,
}: DatabaseViewTableProps) {
  return (
    <div className="flex-1 overflow-auto">
      <table className="w-full">
        <thead className="bg-zinc-50 dark:bg-zinc-900 sticky top-0">
          <tr>
            <th
              className="px-4 py-2 text-left text-sm font-medium text-zinc-600 dark:text-zinc-400 cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800"
              onClick={() => onSort("title")}
            >
              <div className="flex items-center gap-1">
                Name
                {sortField === "title" && <ArrowUpDown className="w-3 h-3" />}
              </div>
            </th>
            <th
              className="px-4 py-2 text-left text-sm font-medium text-zinc-600 dark:text-zinc-400 cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800 w-32"
              onClick={() => onSort("type")}
            >
              <div className="flex items-center gap-1">
                Type
                {sortField === "type" && <ArrowUpDown className="w-3 h-3" />}
              </div>
            </th>
            <th
              className="px-4 py-2 text-left text-sm font-medium text-zinc-600 dark:text-zinc-400 cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800 w-40"
              onClick={() => onSort("updatedAt")}
            >
              <div className="flex items-center gap-1">
                Last Edited
                {sortField === "updatedAt" && <ArrowUpDown className="w-3 h-3" />}
              </div>
            </th>
            <th className="px-4 py-2 w-10" />
          </tr>
        </thead>
        <tbody>
          {pages.length === 0 ? (
            <tr>
              <td colSpan={4} className="px-4 py-12 text-center text-zinc-400 dark:text-zinc-600">
                {searchQuery ? "No pages match your search" : "No pages in this database"}
              </td>
            </tr>
          ) : (
            pages.map((page) => (
              <tr
                key={page.id}
                className="border-b border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 cursor-pointer transition-colors"
                onClick={() => onSelectChild(page.id)}
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{page.icon || typeIcons[page.type]}</span>
                    <span className="text-sm text-[#111110] dark:text-zinc-100">
                      {page.title || "Untitled"}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className="text-sm text-zinc-500 dark:text-zinc-400">
                    {typeLabels[page.type]}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className="text-sm text-zinc-500 dark:text-zinc-400">
                    {formatDate(page.updatedAt)}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={(e) => e.stopPropagation()}
                    className="p-1 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded transition-colors"
                  >
                    <MoreHorizontal className="w-4 h-4 text-zinc-400" />
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
