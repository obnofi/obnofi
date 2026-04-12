"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Search,
  Settings,
  FileText,
  Palette,
  Database,
  Orbit,
  ChevronDown,
  MoreHorizontal,
  Trash2,
} from "lucide-react";
import { usePageStore, PageTreeNode } from "@/store/pageStore";
import { Page, PageType } from "@/types";

interface SidebarProps {
  workspaceId: string;
  currentPageId?: string;
}

const typeIcons: Record<PageType, React.ReactNode> = {
  document: <FileText className="w-4 h-4" />,
  canvas: <Palette className="w-4 h-4" />,
  database: <Database className="w-4 h-4" />,
};

const typeLabels: Record<PageType, string> = {
  document: "Document",
  canvas: "Canvas",
  database: "Database",
};

function PageTreeItem({
  node,
  level,
  currentPageId,
  onSelect,
  onToggle,
  expanded,
}: {
  node: PageTreeNode;
  level: number;
  currentPageId?: string;
  onSelect: (pageId: string) => void;
  onToggle: (pageId: string) => void;
  expanded: Set<string>;
}) {
  const isExpanded = expanded.has(node.id);
  const isActive = node.id === currentPageId;
  const hasChildren = node.children.length > 0;

  return (
    <div>
      <div
        className={`group flex items-center gap-1 px-2 py-1.5 rounded-md cursor-pointer transition-colors ${
          isActive
            ? "bg-zinc-100 dark:bg-zinc-800 text-[#111110] dark:text-zinc-100"
            : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
        }`}
        style={{ paddingLeft: `${level * 12 + 8}px` }}
        onClick={() => onSelect(node.id)}
      >
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggle(node.id);
          }}
          className={`p-0.5 rounded hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-transform ${
            hasChildren ? "opacity-100" : "opacity-0"
          } ${isExpanded ? "rotate-90" : ""}`}
        >
          <ChevronRight className="w-3 h-3" />
        </button>

        <span className="text-zinc-400 dark:text-zinc-500">
          {node.icon || typeIcons[node.type]}
        </span>

        <span className="flex-1 text-sm truncate">{node.title || "Untitled"}</span>
      </div>

      {isExpanded &&
        node.children.map((child) => (
          <PageTreeItem
            key={child.id}
            node={child}
            level={level + 1}
            currentPageId={currentPageId}
            onSelect={onSelect}
            onToggle={onToggle}
            expanded={expanded}
          />
        ))}
    </div>
  );
}

export function Sidebar({ workspaceId, currentPageId }: SidebarProps) {
  const router = useRouter();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [showNewPageMenu, setShowNewPageMenu] = useState(false);

  const { pages, fetchPages, createPage, getPageTree } = usePageStore();

  useEffect(() => {
    fetchPages(workspaceId);
  }, [workspaceId, fetchPages]);

  const pageTree = getPageTree();

  const handleToggle = (pageId: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(pageId)) {
        next.delete(pageId);
      } else {
        next.add(pageId);
      }
      return next;
    });
  };

  const handleSelect = (pageId: string) => {
    router.push(`/workspace/${workspaceId}?page=${pageId}`);
  };

  const handleCreatePage = async (type: PageType, parentId?: string) => {
    const titles: Record<PageType, string> = {
      document: "New Page",
      canvas: "New Canvas",
      database: "New Database",
    };

    const newPage = await createPage({
      title: titles[type],
      type,
      parentId: parentId || null,
      workspaceId,
    });

    if (newPage) {
      setShowNewPageMenu(false);
      if (parentId) {
        setExpanded((prev) => new Set(prev).add(parentId));
      }
      router.push(`/workspace/${workspaceId}?page=${newPage.id}`);
    }
  };

  if (isCollapsed) {
    return (
      <div className="w-12 border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#111110] flex flex-col items-center py-4 gap-4">
        <button
          onClick={() => setIsCollapsed(false)}
          className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md transition-colors"
        >
          <ChevronRight className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
        </button>
      </div>
    );
  }

  return (
    <div
      data-testid="workspace-sidebar"
      className="w-64 border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#111110] flex flex-col h-full"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-[#2E7D45] flex items-center justify-center">
            <span className="text-white text-xs font-bold">O</span>
          </div>
          <span className="font-medium text-sm text-[#111110] dark:text-zinc-100">
            {workspaceId}
          </span>
        </div>
        <button
          onClick={() => setIsCollapsed(true)}
          className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md transition-colors"
        >
          <ChevronLeft className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
        </button>
      </div>

      {/* Search */}
      <div className="px-3 py-2">
        <div className="flex items-center gap-2 px-3 py-2 bg-zinc-100 dark:bg-zinc-800 rounded-md">
          <Search className="w-4 h-4 text-zinc-400" />
          <input
            type="text"
            placeholder="Search"
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-zinc-400 text-[#111110] dark:text-zinc-100"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="px-3 pb-2">
        <div className="mb-2">
          <Link
            href={`/workspace/${workspaceId}/graph`}
            data-testid="graph-view-link"
            className="flex w-full items-center gap-2 rounded-md border border-zinc-200 px-3 py-2 text-sm font-medium text-[#111110] transition hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-800"
          >
            <Orbit className="w-4 h-4 text-[#2E7D45]" />
            Graph View
          </Link>
        </div>

        <div className="relative">
          <button
            onClick={() => setShowNewPageMenu(!showNewPageMenu)}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-white bg-[#2E7D45] hover:bg-[#256a3a] rounded-md transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Page
          </button>

          {showNewPageMenu && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-md shadow-lg z-50 py-1">
              {(["document", "canvas", "database"] as PageType[]).map(
                (type) => (
                  <button
                    key={type}
                    onClick={() => handleCreatePage(type)}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
                  >
                    {typeIcons[type]}
                    {typeLabels[type]}
                  </button>
                )
              )}
            </div>
          )}
        </div>
      </div>

      {/* Page Tree */}
      <div className="flex-1 overflow-y-auto px-2 py-2">
        {pageTree.length === 0 ? (
          <div className="text-center py-8 text-zinc-400 text-sm">
            No pages yet
          </div>
        ) : (
          pageTree.map((node) => (
            <PageTreeItem
              key={node.id}
              node={node}
              level={0}
              currentPageId={currentPageId}
              onSelect={handleSelect}
              onToggle={handleToggle}
              expanded={expanded}
            />
          ))
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-zinc-200 dark:border-zinc-800 p-2">
        <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md transition-colors">
          <Settings className="w-4 h-4" />
          Settings
        </button>
      </div>
    </div>
  );
}
