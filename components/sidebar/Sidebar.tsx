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
  Clock,
} from "lucide-react";
import { SiteLogo } from "@/components/branding/SiteLogo";
import { usePageStore, PageTreeNode } from "@/store/pageStore";
import { PageType } from "@/types";

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
  canvas: "Clearing",
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
        className={`group flex items-center gap-1.5 py-1 rounded cursor-pointer transition-colors ${
          isActive
            ? "bg-[var(--color-selected)] text-[var(--color-text-primary)]"
            : "text-[var(--color-text-primary)] hover:bg-[var(--color-hover)]"
        }`}
        style={{ paddingLeft: `${level * 14 + 8}px`, paddingRight: "8px" }}
        onClick={() => onSelect(node.id)}
      >
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (hasChildren) onToggle(node.id);
          }}
          className={`p-0.5 rounded transition-transform shrink-0 ${
            hasChildren ? "opacity-100" : "opacity-0"
          } ${isExpanded ? "rotate-90" : ""}`}
        >
          <ChevronRight className="w-3 h-3 text-[var(--color-text-secondary)]" />
        </button>

        <span className="text-[var(--color-text-secondary)] shrink-0">
          {node.icon || typeIcons[node.type]}
        </span>

        <span className="flex-1 text-[13px] truncate">{node.title || "Untitled"}</span>
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
  const recentPages = [...pages]
    .sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    )
    .slice(0, 4);

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

  const handleCreatePage = async (type: PageType) => {
    const titles: Record<PageType, string> = {
      document: "New Page",
      canvas: "New Clearing",
      database: "New Database",
    };

    const newPage = await createPage({
      title: titles[type],
      type,
      parentId: null,
      workspaceId,
    });

    if (newPage) {
      setShowNewPageMenu(false);
      router.push(`/workspace/${workspaceId}?page=${newPage.id}`);
    }
  };

  if (isCollapsed) {
    return (
      <div className="w-12 border-r border-[var(--color-border)] bg-[var(--color-surface)] flex flex-col items-center py-3 gap-3">
        <button
          onClick={() => setIsCollapsed(false)}
          className="p-2 hover:bg-[var(--color-hover)] rounded transition-colors"
        >
          <ChevronRight className="w-4 h-4 text-[var(--color-text-secondary)]" />
        </button>
      </div>
    );
  }

  return (
    <div
      data-testid="workspace-sidebar"
      className="w-60 border-r border-[var(--color-border)] bg-[var(--color-surface)] flex flex-col h-full overflow-hidden"
    >
      {/* Workspace Switcher */}
      <div className="flex items-center gap-2 px-3 py-3">
        <div className="w-[22px] h-[22px] bg-[var(--color-accent)] rounded flex items-center justify-center shrink-0">
          <span className="text-white text-[12px] font-semibold leading-none">A</span>
        </div>
        <span className="flex-1 text-[14px] font-medium text-[var(--color-text-primary)] truncate">
          obnofi
        </span>
        <button
          onClick={() => setIsCollapsed(true)}
          className="p-1 hover:bg-[var(--color-hover)] rounded transition-colors shrink-0"
        >
          <ChevronLeft className="w-4 h-4 text-[var(--color-text-secondary)]" />
        </button>
      </div>

      {/* Quick Actions */}
      <div className="px-2 flex flex-col">
        <div className="flex items-center gap-2 px-2 py-1 rounded cursor-pointer text-[var(--color-text-secondary)] hover:bg-[var(--color-hover)] transition-colors">
          <Search className="w-4 h-4 shrink-0" />
          <span className="text-[13px]">Search</span>
        </div>

        <button className="flex items-center gap-2 px-2 py-1 rounded text-[var(--color-text-secondary)] hover:bg-[var(--color-hover)] transition-colors w-full text-left">
          <Settings className="w-4 h-4 shrink-0" />
          <span className="text-[13px]">Settings</span>
        </button>

        <div className="relative">
          <button
            onClick={() => setShowNewPageMenu(!showNewPageMenu)}
            className="flex items-center gap-2 px-2 py-1 rounded text-[var(--color-text-secondary)] hover:bg-[var(--color-hover)] transition-colors w-full text-left"
          >
            <Plus className="w-4 h-4 shrink-0" />
            <span className="text-[13px]">New page</span>
          </button>

          {showNewPageMenu && (
            <div className="absolute top-full left-0 right-0 z-[99999] mt-1 rounded border border-[var(--color-border)] bg-[var(--color-surface)] py-1 shadow-lg">
              {(["document", "canvas", "database"] as PageType[]).map((type) => (
                <button
                  key={type}
                  onClick={() => handleCreatePage(type)}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[var(--color-text-primary)] hover:bg-[var(--color-hover)] transition-colors"
                >
                  {typeIcons[type]}
                  {typeLabels[type]}
                </button>
              ))}
            </div>
          )}
        </div>

        <Link
          href={`/workspace/${workspaceId}/graph`}
          data-testid="graph-view-link"
          className="flex items-center gap-2 px-2 py-1 rounded text-[var(--color-text-secondary)] hover:bg-[var(--color-hover)] transition-colors"
        >
          <Orbit className="w-4 h-4 text-[var(--color-accent)] shrink-0" />
          <span className="text-[13px]">Graph View</span>
        </Link>
      </div>

      {/* Divider */}
      <div className="h-px bg-[var(--color-border)] mx-2 my-2" />

      {/* Page Tree */}
      <div className="flex-1 overflow-y-auto px-2 min-h-0">
        {pageTree.length > 0 ? (
          <div>
            <div className="flex items-center justify-between px-2 py-1 mb-0.5">
              <span className="text-[11px] font-medium text-[var(--color-text-secondary)] uppercase tracking-wide">
                Private
              </span>
              <button
                onClick={() => setShowNewPageMenu(!showNewPageMenu)}
                className="p-0.5 rounded hover:bg-[var(--color-hover)] transition-colors"
              >
                <Plus className="w-3.5 h-3.5 text-[var(--color-text-secondary)]" />
              </button>
            </div>
            {pageTree.map((node) => (
              <PageTreeItem
                key={node.id}
                node={node}
                level={0}
                currentPageId={currentPageId}
                onSelect={handleSelect}
                onToggle={handleToggle}
                expanded={expanded}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-[var(--color-text-secondary)] text-[13px]">
            No pages yet
          </div>
        )}
      </div>

      {/* Recent */}
      {recentPages.length > 0 && (
        <div className="border-t border-[var(--color-border)] px-2 py-2 shrink-0">
          <div className="px-2 py-1 mb-0.5">
            <span className="text-[11px] font-medium text-[var(--color-text-secondary)] uppercase tracking-wide">
              Recent
            </span>
          </div>
          {recentPages.map((page) => (
            <button
              key={page.id}
              onClick={() => handleSelect(page.id)}
              className="flex items-center gap-2 px-2 py-1 rounded text-[var(--color-text-secondary)] hover:bg-[var(--color-hover)] transition-colors w-full text-left"
            >
              <Clock className="w-3.5 h-3.5 shrink-0" />
              <span className="text-[13px] truncate">{page.title || "Untitled"}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
