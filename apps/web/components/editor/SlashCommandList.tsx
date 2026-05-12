"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import type { Editor } from "@tiptap/react";
import { useRouter } from "next/navigation";
import {
  Type,
  Heading1,
  Heading2,
  Heading3,
  Heading4,
  Heading5,
  Heading6,
  List,
  ListOrdered,
  CheckSquare,
  ChevronRight,
  Quote,
  Minus,
  AlertCircle,
  Table,
  BookOpen,
  Image,
  Video,
  Music,
  Paperclip,
  Bookmark,
  Code2,
  GitBranch,
  Table2,
  Kanban,
  LayoutGrid,
  LayoutList,
  Calendar,
  GanttChart,
  PenTool,
  Database,
  Network,
  Zap,
  GitGraph,
  GitPullRequest,
  ChevronDown,
  Sigma,
  Square,
  Link,
  LayoutTemplate,
  Globe,
  HardDrive,
  MessageSquare,
  AtSign,
  FileText,
  CalendarDays,
  Smile,
  BarChart2,
  Columns2,
  Columns3,
  ClipboardList,
} from "lucide-react";
import type { SlashCommandItem } from "@/components/editor/extensions/SlashCommandExtension";
import { CATEGORIES } from "@/components/editor/extensions/SlashCommandExtension";
import { isVisibleSlashCommandItem } from "@/components/editor/extensions/SlashCommandExtension";
import { usePageStore } from "@/store/pageStore";

const iconMap: Record<
  string,
  React.ComponentType<{ className?: string; style?: React.CSSProperties }>
> = {
  Type,
  Heading1,
  Heading2,
  Heading3,
  Heading4,
  Heading5,
  Heading6,
  List,
  ListOrdered,
  CheckSquare,
  ChevronRight,
  Quote,
  Minus,
  AlertCircle,
  Table,
  BookOpen,
  Image,
  Video,
  Music,
  Paperclip,
  Bookmark,
  Code2,
  GitBranch,
  Table2,
  Kanban,
  LayoutGrid,
  LayoutList,
  Calendar,
  GanttChart,
  PenTool,
  Database,
  Network,
  Zap,
  GitGraph,
  GitPullRequest,
  ChevronDown,
  Sigma,
  Square,
  Link,
  LayoutTemplate,
  Globe,
  HardDrive,
  MessageSquare,
  AtSign,
  FileText,
  CalendarDays,
  Smile,
  BarChart2,
  Columns2,
  Columns3,
  ClipboardList,
};

type GroupConfig = {
  id: string;
  category: string;
  title: string;
  description: string;
  icon: string;
  childIds: string[];
};

const SUBMENU_GROUPS: GroupConfig[] = [
  {
    id: "g-headings",
    category: "basic",
    title: "제목",
    description: "1~6 단계 제목",
    icon: "Heading1",
    childIds: ["h1", "h2", "h3", "h4", "h5", "h6"],
  },
  {
    id: "g-lists",
    category: "basic",
    title: "목록",
    description: "글머리, 번호, 체크박스",
    icon: "List",
    childIds: ["bulletList", "orderedList", "taskList", "toggleList"],
  },
  {
    id: "g-db-views",
    category: "database",
    title: "데이터베이스 보기",
    description: "표, 보드, 갤러리, 캘린더 등",
    icon: "Table2",
    childIds: [
      "dbTable",
      "dbBoard",
      "dbGallery",
      "dbList",
      "dbCalendar",
      "dbTimeline",
    ],
  },
  {
    id: "g-toggle-headings",
    category: "advanced",
    title: "토글 제목",
    description: "접을 수 있는 제목",
    icon: "ChevronDown",
    childIds: ["toggleH1", "toggleH2", "toggleH3"],
  },
  {
    id: "g-columns",
    category: "advanced",
    title: "열 레이아웃",
    description: "2열 또는 3열 나란히",
    icon: "Columns2",
    childIds: ["columns2", "columns3"],
  },
  {
    id: "g-templates",
    category: "advanced",
    title: "템플릿",
    description: "회의록, 프로젝트, 주간 양식",
    icon: "LayoutTemplate",
    childIds: ["template-meeting", "template-project", "template-weekly"],
  },
  {
    id: "g-github",
    category: "developer",
    title: "GitHub",
    description: "Gist, 이슈, PR",
    icon: "GitGraph",
    childIds: ["githubGist", "githubIssue"],
  },
];

const HIDDEN_ITEM_IDS = new Set(["template"]);

type LeafNode = { kind: "leaf"; item: SlashCommandItem };
type GroupNode = {
  kind: "group";
  group: GroupConfig;
  children: SlashCommandItem[];
};
type TreeNode = LeafNode | GroupNode;

type CategorySection = {
  id: string;
  label: string;
  nodes: TreeNode[];
};

function showToast(message: string) {
  const existing = document.getElementById("slash-cmd-toast");
  if (existing) existing.remove();

  const toast = document.createElement("div");
  toast.id = "slash-cmd-toast";
  Object.assign(toast.style, {
    position: "fixed",
    bottom: "24px",
    left: "50%",
    transform: "translateX(-50%)",
    background: "#18181b",
    color: "#fafafa",
    padding: "8px 16px",
    borderRadius: "8px",
    fontSize: "13px",
    fontWeight: "500",
    zIndex: "100000",
    pointerEvents: "none",
    opacity: "0",
    transition: "opacity 0.15s ease",
    boxShadow: "0 4px 12px rgba(0,0,0,0.25)",
    whiteSpace: "nowrap",
  });
  toast.textContent = message;
  document.body.appendChild(toast);

  requestAnimationFrame(() => {
    toast.style.opacity = "1";
  });

  setTimeout(() => {
    toast.style.opacity = "0";
    setTimeout(() => toast.remove(), 200);
  }, 2200);
}

function buildTree(items: SlashCommandItem[]): CategorySection[] {
  const result: CategorySection[] = [];
  for (const cat of CATEGORIES) {
    const catItems = items.filter(
      (it) => it.category === cat.id && !HIDDEN_ITEM_IDS.has(it.id) && isVisibleSlashCommandItem(it)
    );
    if (catItems.length === 0) continue;

    const catGroups = SUBMENU_GROUPS.filter((g) => g.category === cat.id);
    const childToGroup = new Map<string, GroupConfig>();
    for (const g of catGroups) {
      for (const cid of g.childIds) childToGroup.set(cid, g);
    }

    const emitted = new Set<string>();
    const nodes: TreeNode[] = [];
    for (const item of catItems) {
      const group = childToGroup.get(item.id);
      if (group) {
        if (!emitted.has(group.id)) {
          const children = group.childIds
            .map((cid) => catItems.find((it) => it.id === cid))
            .filter((x): x is SlashCommandItem => Boolean(x));
          nodes.push({ kind: "group", group, children });
          emitted.add(group.id);
        }
        continue;
      }
      nodes.push({ kind: "leaf", item });
    }

    if (nodes.length > 0) {
      result.push({ id: cat.id, label: cat.label, nodes });
    }
  }
  return result;
}

function buildFlat(items: SlashCommandItem[]): CategorySection[] {
  const result: CategorySection[] = [];
  for (const cat of CATEGORIES) {
    const catItems = items.filter(
      (it) => it.category === cat.id && !HIDDEN_ITEM_IDS.has(it.id)
    );
    if (catItems.length === 0) continue;
    result.push({
      id: cat.id,
      label: cat.label,
      nodes: catItems.map((item) => ({ kind: "leaf" as const, item })),
    });
  }
  return result;
}

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
  const router = useRouter();
  const { createPage } = usePageStore();
  const isFiltering = query.trim().length > 0;

  const sections = useMemo(
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
  const activeGroup = activeRoot?.kind === "group" ? activeRoot : null;

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

  const handleSelect = useCallback(
    (item: SlashCommandItem) => {
      if (item.isDisabled) {
        showToast("준비 중입니다 🚧");
        return;
      }

      const chain = editor.chain().focus().deleteRange(range);

      switch (item.id) {
        case "text":
          chain.setParagraph().run();
          break;
        case "h1":
          chain.setHeading({ level: 1 }).run();
          break;
        case "h2":
          chain.setHeading({ level: 2 }).run();
          break;
        case "h3":
          chain.setHeading({ level: 3 }).run();
          break;
        case "h4":
          chain.setHeading({ level: 4 }).run();
          break;
        case "h5":
          chain.setHeading({ level: 5 }).run();
          break;
        case "h6":
          chain.setHeading({ level: 6 }).run();
          break;
        case "bulletList":
          chain.toggleBulletList().run();
          break;
        case "orderedList":
          chain.toggleOrderedList().run();
          break;
        case "taskList":
          (chain as typeof chain & { toggleTaskList: () => typeof chain })
            .toggleTaskList()
            .run();
          break;
        case "blockquote":
          chain.toggleBlockquote().run();
          break;
        case "divider":
          chain.setHorizontalRule().run();
          break;
        case "codeBlock":
          (chain as typeof chain & { insertCodeBlock: () => typeof chain })
            .insertCodeBlock()
            .run();
          break;
        case "dbTable":
          chain.insertDatabaseEmbed().run();
          break;
        case "canvas":
          chain.insertCanvasEmbed().run();
          break;
        case "dbDiagram":
          (chain as typeof chain & { insertDbDiagram: () => typeof chain })
            .insertDbDiagram()
            .run();
          break;
        case "columns2":
          chain.insertColumnLayout({ columns: 2 }).run();
          break;
        case "columns3":
          chain.insertColumnLayout({ columns: 3 }).run();
          break;
        case "math":
          chain.insertMathBlock().run();
          break;
        case "button":
          chain.run();
          onInsertButton?.();
          return;

        case "linkDatabase":
          chain.run();
          onLinkDatabase?.();
          break;
        case "pageLink":
        case "pageMention":
          chain.run();
          onInsertPageLink?.();
          return;
        case "template-meeting":
          chain.run();
          editor.commands.insertContent(
            `<h1>회의록</h1><p><strong>일시:</strong> </p><p><strong>참석자:</strong> </p><h2>안건</h2><ul><li><p></p></li></ul><h2>메모</h2><p></p><h2>액션 아이템</h2><ul><li><p></p></li></ul>`
          );
          break;
        case "template-project":
          chain.run();
          editor.commands.insertContent(
            `<h1>프로젝트 브리프</h1><h2>개요</h2><p></p><h2>목표</h2><ul><li><p></p></li></ul><h2>범위</h2><p></p><h2>결과물</h2><ul><li><p></p></li></ul><h2>일정</h2><p></p>`
          );
          break;
        case "template-weekly":
          chain.run();
          editor.commands.insertContent(
            `<h1>주간 플래너</h1><h2>이번 주 목표</h2><ul><li><p></p></li></ul><h2>월</h2><p></p><h2>화</h2><p></p><h2>수</h2><p></p><h2>목</h2><p></p><h2>금</h2><p></p><h2>회고</h2><p></p>`
          );
          break;
        case "subPage":
          chain.run();
          (async () => {
            if (!workspaceId || !pageId) return;
            const newPage = await createPage({
              title: "새 페이지",
              type: "document",
              parentId: pageId,
              workspaceId,
            });
            if (newPage) {
              editor.commands.insertSubPageEmbed({
                pageId: newPage.id,
                workspaceId,
                parentPageId: pageId,
              });
              router.push(`/workspace/${workspaceId}?page=${newPage.id}`);
            }
          })();
          return;
        default:
          chain.run();
      }
    },
    [editor, range, workspaceId, pageId, createPage, router, onLinkDatabase, onInsertButton, onInsertPageLink]
  );

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
          <span className="flex-1 truncate text-[13px] leading-5">
            {title}
          </span>
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
