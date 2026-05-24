"use client";

import { Page } from "@obnofi/types";
import { typeIcons, typeLabels, formatDate } from "@/lib/databaseViewUtils";

interface DatabaseViewGridProps {
  pages: Page[];
  searchQuery: string;
  onSelectChild: (pageId: string) => void;
}

export function DatabaseViewGrid({ pages, searchQuery, onSelectChild }: DatabaseViewGridProps) {
  if (pages.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-zinc-400 dark:text-zinc-600">
        {searchQuery ? "No pages match your search" : "No pages in this database"}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {pages.map((page) => (
        <div
          key={page.id}
          onClick={() => onSelectChild(page.id)}
          className="p-4 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg hover:border-[#2E7D45] dark:hover:border-[#2E7D45] cursor-pointer transition-colors group"
        >
          <div className="text-3xl mb-3">{page.icon || typeIcons[page.type]}</div>
          <h3 className="font-medium text-[#111110] dark:text-zinc-100 mb-1 truncate">
            {page.title || "Untitled"}
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            {typeLabels[page.type]} • {formatDate(page.updatedAt)}
          </p>
        </div>
      ))}
    </div>
  );
}
