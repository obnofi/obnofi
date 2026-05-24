"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import type { Editor } from "@tiptap/react";
import {
  Type, Heading1, Heading2, Heading3, Heading4, Heading5, Heading6,
  List, ListOrdered, CheckSquare, ChevronRight, Quote, Minus, AlertCircle,
  Table, BookOpen, Image, Video, Music, Paperclip, Bookmark, Code2,
  GitBranch, Table2, Kanban, LayoutGrid, LayoutList, Calendar, GanttChart,
  PenTool, Database, Network, Zap, GitGraph, GitPullRequest, ChevronDown,
  Sigma, Square, Link, LayoutTemplate, Globe, HardDrive, MessageSquare,
  AtSign, FileText, CalendarDays, Smile, BarChart2, Columns2, Columns3,
  ClipboardList,
} from "lucide-react";
import type { SlashCommandItem } from "@/components/editor/extensions/SlashCommandExtension";
import {
  buildTree,
  buildFlat,
  type CategorySection,
  type GroupNode,
} from "@/lib/editor/slashCommandListData";
import { useSlashCommandSelect } from "@/lib/editor/slashCommandListUtils";

const iconMap: Record<
  string,
  React.ComponentType<{ className?: string; style?: React.CSSProperties }>
> = {
  Type, Heading1, Heading2, Heading3, Heading4, Heading5, Heading6,
  List, ListOrdered, CheckSquare, ChevronRight, Quote, Minus, AlertCircle,
  Table, BookOpen, Image, Video, Music, Paperclip, Bookmark, Code2,
  GitBranch, Table2, Kanban, LayoutGrid, LayoutList, Calendar, GanttChart,
  PenTool, Database, Network, Zap, GitGraph, GitPullRequest, ChevronDown,
  Sigma, Square, Link, LayoutTemplate, Globe, HardDrive, MessageSquare,
  AtSign, FileText, CalendarDays, Smile, BarChart2, Columns2, Columns3,
  ClipboardList,
};

interface SlashCommandListProps {
  items: SlashCommandItem[];
  command: (item: SlashCommandItem) => void;
  editor: Editor;
  range: { from: number; to: number };
  query?: string;
  workspaceId?: string;
  pageId?: string;
  onLinkDatabase?: () => void;
  onInsertButton?: () => void;
  onInsertPageLink?: () => void;
}

export function SlashCommandList({
  items,
  editor,
  range,
  query = "",
  workspaceId,
  pageId,
  onLinkDatabase,
  onInsertButton,
  onInsertPageLink,
}: SlashCommandListProps) {
  const isFiltering = query.trim().length > 0;

  const sections: CategorySection[] = useMemo(
    () => (isFiltering ? buildFlat(items) : buildTree(items)),
    [items, isFiltering]
  );

  const rootNodes = useMemo(() => sections.flatMap((s) => s.nodes), [sections]);

  const [rootIndex, setRootIndex] = useState(0);
  const [panel, setPanel] = useState<"root" | "sub">("root");
  const [subIndex, setSubIndex] = useState(0);

  const rootRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const subRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const activeRoot = rootNodes[rootIndex];
  const activeGroup: GroupNode | null =
    activeRoot?.kind === "group" ? activeRoot : null;

  const handleSelect = useSlashCommandSelect({
    editor,
    range,
    workspaceId,
    pageId,
    onLinkDatabase,
    onInsertButton,
    onInsertPageLink,
  });

  // Reset selection when items list changes
  useEffect(() => {
    setRootIndex(0);
    setPanel("root");
    setSubIndex(0);
  }, [items]);

  // Reset subIndex when active group changes
  useEffect(() => {
    setSubIndex(0);
  }, [activeGroup?.group.id]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowUp") {
        e.preventDefault();
        if (panel === "sub" && activeGroup) {
          setSubIndex((prev) =>
            prev <= 0 ? activeGroup.children.length - 1 : prev - 1
          );
        } else {
          setRootIndex((prev) =>
            prev <= 0 ? rootNodes.length - 1 : prev - 1
          );
        }
        return;
      }
      if (e.key === "ArrowDown") {
        e.preventDefault();
        if (panel === "sub" && activeGroup) {
          setSubIndex((prev) =>
            prev >= activeGroup.children.length - 1 ? 0 : prev + 1
          );
        } else {
          setRootIndex((prev) =>
            prev >= rootNodes.length - 1 ? 0 : prev + 1
          );
        }
        return;
      }
      if (e.key === "ArrowRight") {
        if (panel === "root" && activeGroup) {
          e.preventDefault();
          setPanel("sub");
          setSubIndex(0);
        }
        return;
      }
      if (e.key === "ArrowLeft") {
        if (panel === "sub") {
          e.preventDefault();
          setPanel("root");
        }
        return;
      }
      if (e.key === "Enter") {
        e.preventDefault();
        if (panel === "sub" && activeGroup) {
          const child = activeGroup.children[subIndex];
          if (child) handleSelect(child);
        } else if (activeRoot?.kind === "leaf") {
          handleSelect(activeRoot.item);
        } else if (activeGroup) {
          setPanel("sub");
          setSubIndex(0);
        }
        return;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [rootNodes.length, activeGroup, activeRoot, panel, subIndex, handleSelect]);

  // Scroll selection into view
  useEffect(() => {
    rootRefs.current[rootIndex]?.scrollIntoView({ block: "nearest" });
  }, [rootIndex]);

  useEffect(() => {
    if (panel === "sub") {
      subRefs.current[subIndex]?.scrollIntoView({ block: "nearest" });
    }
  }, [subIndex, panel]);

  if (rootNodes.length === 0) return null;

  const renderRow = (
    key: string,
    title: string,
    iconName: string,
    isSelected: boolean,
    isDisabled: boolean,
    rightAdornment: React.ReactNode,
    onMouseEnter: () => void,
    onClick: () => void,
    refCallback: (el: HTMLButtonElement | null) => void
  ) => {
    const Icon = iconMap[iconName];
    return (
      <div key={key} className="px-1">
        <button
          type="button"
          ref={refCallback}
          onMouseEnter={onMouseEnter}
          onClick={onClick}
          data-selected={isSelected ? "true" : undefined}
          style={{
            background: isSelected ? "var(--color-selected)" : undefined,
            color: "var(--color-text-primary)",
          }}
          className={[
            "slash-cmd-row w-full flex items-center gap-2 px-2 py-1 rounded-[6px] text-left",
            isDisabled ? "opacity-50" : "",
          ].join(" ")}
        >
          {Icon ? (
            <Icon
              className="flex-shrink-0 w-3.5 h-3.5"
              style={{ color: "var(--color-text-secondary)" }}
            />
          ) : null}
          <span className="flex-1 truncate text-[13px] leading-5">{title}</span>
          {isDisabled && (
            <span
              className="flex-shrink-0 text-[9px] uppercase tracking-wide"
              style={{ color: "var(--color-text-placeholder)" }}
            >
              준비중
            </span>
          )}
          {rightAdornment}
        </button>
      </div>
    );
  };

  const shortcutBadge = (text: string) => (
    <kbd
      className="flex-shrink-0 text-[10px] font-mono leading-none"
      style={{ color: "var(--color-text-secondary)" }}
    >
      {text}
    </kbd>
  );

  const panelStyle: React.CSSProperties = {
    background: "var(--color-background)",
    borderColor: "var(--color-border)",
  };

  const sectionLabelStyle: React.CSSProperties = {
    color: "var(--color-text-secondary)",
  };

  return (
    <>
      <style>{`
        .slash-cmd-row:hover:not([data-selected="true"]) {
          background: var(--color-hover);
        }
      `}</style>
      <div className="flex items-start gap-1 z-[100000]">
        {/* Main panel */}
        <div
          className="scrollbar-hidden max-h-[20rem] w-60 overflow-y-auto rounded-md border py-1"
          style={panelStyle}
        >
          {sections.map((section) => (
            <div key={section.id}>
              <div
                className="px-3 pt-2 pb-0.5 text-[10px] font-medium uppercase tracking-wide select-none"
                style={sectionLabelStyle}
              >
                {section.label}
              </div>
              {section.nodes.map((node) => {
                const idx = rootNodes.indexOf(node);
                const isSelected = idx === rootIndex;

                if (node.kind === "group") {
                  return renderRow(
                    node.group.id,
                    node.group.title,
                    node.group.icon,
                    isSelected,
                    false,
                    <ChevronRight
                      className="flex-shrink-0 w-3 h-3"
                      style={{ color: "var(--color-text-secondary)" }}
                    />,
                    () => {
                      setRootIndex(idx);
                      setPanel("root");
                    },
                    () => {
                      setRootIndex(idx);
                      setPanel("sub");
                      setSubIndex(0);
                    },
                    (el) => {
                      rootRefs.current[idx] = el;
                    }
                  );
                }

                const item = node.item;
                return renderRow(
                  item.id,
                  item.title,
                  item.icon,
                  isSelected,
                  Boolean(item.isDisabled),
                  item.shortcut ? shortcutBadge(item.shortcut) : null,
                  () => {
                    setRootIndex(idx);
                    setPanel("root");
                  },
                  () => handleSelect(item),
                  (el) => {
                    rootRefs.current[idx] = el;
                  }
                );
              })}
            </div>
          ))}
        </div>

        {/* Submenu panel */}
        {activeGroup && (
          <div
            className="scrollbar-hidden max-h-[20rem] w-56 overflow-y-auto rounded-md border py-1"
            style={panelStyle}
          >
            <div
              className="px-3 pt-2 pb-0.5 text-[10px] font-medium uppercase tracking-wide select-none"
              style={sectionLabelStyle}
            >
              {activeGroup.group.title}
            </div>
            {activeGroup.children.map((child, sIdx) => {
              const isSelected = panel === "sub" && sIdx === subIndex;
              return renderRow(
                child.id,
                child.title,
                child.icon,
                isSelected,
                Boolean(child.isDisabled),
                child.shortcut ? shortcutBadge(child.shortcut) : null,
                () => {
                  setPanel("sub");
                  setSubIndex(sIdx);
                },
                () => handleSelect(child),
                (el) => {
                  subRefs.current[sIdx] = el;
                }
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
