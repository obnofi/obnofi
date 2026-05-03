"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import type { Editor as TiptapEditor } from "@tiptap/react";
import {
  ChevronRight,
  Plus,
  FileText,
  Palette,
  Sparkles,
  Loader2,
  Database,
} from "lucide-react";
import { usePageStore } from "@/store/pageStore";
import { Page, PageType } from "@obnofi/types";
import { useUIStore } from "@/store/useUIStore";
import { GrovePageCanopy } from "@/components/workspace/GrovePageCanopy";
import { PageTitleBlock } from "@/components/workspace/PageTitleBlock";
import { TableOfContents } from "@/components/workspace/TableOfContents";
import { CollaborationProvider } from "@/lib/collaboration/CollaborationContext";
import { CollaborationAvatars } from "@/components/workspace/CollaborationAvatars";
import { SaveStatusIndicator } from "@/components/workspace/SaveStatusIndicator";
import { useAutoSave } from "@/hooks/useAutoSave";
import {
  creatablePageDescriptions,
  creatablePageLabels,
  creatablePageTypes,
  createPageTitles,
} from "@/lib/pageCreation";
import { exportPageAsHtml, exportPageAsPdf } from "@/lib/exportPage";
import type { PageExportFormat } from "@/components/workspace/PageSettingsMenu";

// Dynamically import heavy components
const Editor = dynamic(() => import("@/components/editor/Editor").then(mod => mod.Editor), {
  loading: () => <div className="flex h-[200px] items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-[var(--color-accent)]" /></div>,
  ssr: false
});

const PageSettingsMenu = dynamic(() => import("@/components/workspace/PageSettingsMenu").then(mod => mod.PageSettingsMenu), {
  ssr: false
});

const ClearingBoard = dynamic(() => import("@/components/canvas/ClearingBoard").then(mod => mod.ClearingBoard), {
  loading: () => <div className="flex h-full items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-[var(--color-accent)]" /></div>,
  ssr: false
});

const DatabaseWorkspace = dynamic(() => import("@/components/database/DatabaseWorkspace").then(mod => mod.DatabaseWorkspace), {
  loading: () => <div className="flex h-full items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-[var(--color-accent)]" /></div>
});

const DatabaseViewModal = dynamic(() => import("@/components/database/DatabaseViewModal").then(mod => mod.DatabaseViewModal), {
  ssr: false
});

const GroveSideTab = dynamic(() => import("@/components/workspace/GroveSideTab").then(mod => mod.GroveSideTab), {
  ssr: false
});

interface WorkspacePageProps {
  workspaceId: string;
  pageId: string;
  initialPage?: Page;
  initialPages?: Page[];
}

const typeIcons: Record<PageType, React.ReactNode> = {
  document: <FileText className="w-4 h-4" />,
  canvas: <Palette className="w-4 h-4" />,
  database: <Database className="w-4 h-4" />,
};

export function WorkspacePage({ 
  workspaceId, 
  pageId,
  initialPage,
  initialPages
}: WorkspacePageProps) {
  const router = useRouter();
  const {
    currentPage,
    pages,
    fetchPage,
    fetchPages,
    updatePage,
    createPage,
    setCurrentPage,
    setPages,
    getPageTree,
    getPageTrail,
  } = usePageStore();
  const isDatabaseModalOpen = useUIStore((state) => state.databaseModal.isOpen);
  const isGroveSideTabOpen = useUIStore((state) => state.groveSideTab.isOpen);

  const [title, setTitle] = useState(initialPage?.title || "");
  const [isLoading, setIsLoading] = useState(!initialPage);
  const editorInstanceRef = useRef<TiptapEditor | null>(null);

  // 최신 editor content를 ref에 보관 — useAutoSave가 getContent()로 접근
  const latestContentRef = useRef<object>(
    initialPage?.content ?? { type: "doc", content: [{ type: "paragraph" }] }
  );
  const handleEditorUpdate = useCallback((content: object) => {
    latestContentRef.current = content;
  }, []);

  const { scheduleSave, save } = useAutoSave({
    pageId,
    getContent: () => editorInstanceRef.current?.getJSON() ?? latestContentRef.current,
    debounceMs: 5000,
    intervalMs: 45000,
    onSaved: (content) => {
      // 저장 성공 후 pageStore도 최신 상태로 갱신
      setCurrentPage((page) => (page ? { ...page, content } : page));
    },
  });
  const [pendingChildType, setPendingChildType] = useState<PageType | null>(null);
  const [expandedPages, setExpandedPages] = useState<Set<string>>(new Set());
  const [groveContentElement, setGroveContentElement] = useState<HTMLDivElement | null>(null);

  // Initialize store with pre-fetched data
  useEffect(() => {
    if (initialPage) {
      setCurrentPage(initialPage);
    }
    if (initialPages) {
      // workspaceId를 함께 전달 — layout이 같은 워크스페이스에 대한 중복 fetch를 스킵하도록.
      setPages(initialPages, workspaceId);
    }
  }, [initialPage, initialPages, workspaceId, setCurrentPage, setPages]);

  useEffect(() => {
    // initialPages가 없을 때만 fetch (SSR로 이미 받은 경우 중복 방지)
    if (!initialPages) fetchPages(workspaceId);
  }, [workspaceId, fetchPages, initialPages]);

  useEffect(() => {
    if (initialPage?.id === pageId) return;

    const loadPage = async () => {
      setIsLoading(true);
      await fetchPage(pageId);
      setIsLoading(false);
    };
    loadPage();
  }, [pageId, fetchPage, initialPage]);

  useEffect(() => {
    if (currentPage) {
      setTitle(currentPage.title);
      latestContentRef.current =
        currentPage.content ?? { type: "doc", content: [{ type: "paragraph" }] };
    }
  }, [currentPage]);

  const handleTitleChange = async (newTitle: string) => {
    setTitle(newTitle);
    await updatePage(pageId, { title: newTitle });
  };

  const handlePageChromeUpdate = async (input: Partial<Pick<Page, "icon" | "coverImage">>) => {
    await updatePage(pageId, input);
  };

  const handleHeadingFontSizesChange = useCallback((headingFontSizes: Page["headingFontSizes"]) => {
    setCurrentPage((page) => (page ? { ...page, headingFontSizes } : page));
  }, [setCurrentPage]);

  const handleHighlightColorsChange = useCallback((highlightColors: Page["highlightColors"]) => {
    setCurrentPage((page) => (page ? { ...page, highlightColors } : page));
  }, [setCurrentPage]);

  const handleToggleExpand = (pageId: string) => {
    setExpandedPages(prev => {
      const next = new Set(prev);
      if (next.has(pageId)) {
        next.delete(pageId);
      } else {
        next.add(pageId);
      }
      return next;
    });
  };

  const handleSelectPage = (selectedPageId: string) => {
    router.push(`/workspace/${workspaceId}?page=${selectedPageId}`);
  };

  const handleExportPage = useCallback(
    (format: PageExportFormat) => {
      if (!currentPage || currentPage.type !== "document") return;
      const params = {
        editor: editorInstanceRef.current,
        contentElement: groveContentElement,
        page: {
          title: currentPage.title,
          icon: currentPage.icon,
          coverImage: currentPage.coverImage,
          type: currentPage.type,
        },
      };
      if (format === "pdf") exportPageAsPdf(params);
      else exportPageAsHtml(params);
    },
    [currentPage, groveContentElement]
  );

  useEffect(() => {
    setExpandedPages((prev) => {
      const next = new Set(prev);
      next.add(pageId);

      let page = pages.find((item) => item.id === pageId);
      while (page?.parentId) {
        next.add(page.parentId);
        page = pages.find((item) => item.id === page?.parentId);
      }

      return next;
    });
  }, [pageId, pages]);

  const handleCreateChildPage = async (type: PageType) => {
    setPendingChildType(type);

    const newPage = await createPage({
      title: createPageTitles[type],
      type,
      parentId: pageId,
      workspaceId,
    });

    setPendingChildType(null);

    if (newPage) {
      router.push(`/workspace/${workspaceId}?page=${newPage.id}`);
    }
  };

  const recentPages = useMemo(
    () =>
      [...pages]
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
        .slice(0, 4),
    [pages]
  );

  const pageTree = useMemo(() => getPageTree(), [pages]); // eslint-disable-line react-hooks/exhaustive-deps
  const pageTrail = useMemo(() => {
    if (!pageId) {
      return [];
    }

    const trail = getPageTrail(pageId);

    if (currentPage) {
      return trail.map((page) => (page.id === currentPage.id ? currentPage : page));
    }

    return trail;
  }, [currentPage, getPageTrail, pageId, pages]);

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center bg-[var(--color-background)]">
        <div className="w-8 h-8 border-2 border-[var(--color-border)] border-t-[var(--color-accent)] rounded-full animate-spin" />
      </div>
    );
  }

  if (!currentPage) {
    return (
      <div className="flex h-full items-center justify-center text-[var(--color-text-secondary)] bg-[var(--color-background)]">
        Page not found
      </div>
    );
  }

  return (
    <CollaborationProvider
      key={pageId}
      pageId={pageId}
      active={currentPage.type === "document"}
    >
      {/* Top Bar */}
      <header className="h-12 border-b border-[var(--color-border)] flex items-center justify-between px-4 shrink-0 bg-[var(--color-background)]">
        <div className="flex min-w-0 items-center gap-1 text-[14px]">
          {pageTrail.map((page, index) => {
            const isCurrent = page.id === currentPage.id;

            return (
              <span key={page.id} className="flex min-w-0 items-center gap-1">
                {index > 0 ? (
                  <ChevronRight className="h-3.5 w-3.5 shrink-0 text-[var(--color-text-placeholder)]" />
                ) : null}
                <button
                  type="button"
                  onClick={() => {
                    if (!isCurrent) {
                      handleSelectPage(page.id);
                    }
                  }}
                  disabled={isCurrent}
                  className={`inline-flex min-w-0 max-w-[180px] items-center gap-1.5 rounded px-1.5 py-1 transition ${
                    isCurrent
                      ? "cursor-default text-[var(--color-text-primary)]"
                      : "text-[var(--color-text-secondary)] hover:bg-[var(--color-hover)] hover:text-[var(--color-text-primary)]"
                  }`}
                  title={page.title || "Untitled"}
                >
                  <span className="shrink-0 text-[var(--color-text-secondary)]">
                    {page.icon ? <span>{page.icon}</span> : typeIcons[page.type]}
                  </span>
                  <span className="truncate">{page.title || "Untitled"}</span>
                </button>
              </span>
            );
          })}
        </div>
        <div className="flex items-center gap-2">
          <SaveStatusIndicator onRetry={() => void save()} />
          <CollaborationAvatars />
          <button className="flex h-8 w-8 items-center justify-center rounded-md text-[var(--color-text-secondary)] transition hover:bg-[var(--color-hover)] hover:text-[var(--color-text-primary)]">
            <Sparkles className="h-4 w-4" />
          </button>
          <PageSettingsMenu
            pageId={pageId}
            workspaceId={workspaceId}
            pageType={currentPage.type}
            headingFontSizes={currentPage.headingFontSizes}
            highlightColors={currentPage.highlightColors}
            isPublic={currentPage.isPublic}
            shareId={currentPage.shareId}
            onShareUpdate={(isPublic, shareId) => {
              setCurrentPage((page) =>
                page ? { ...page, isPublic, shareId } : page
              );
            }}
            onHeadingFontSizesChange={handleHeadingFontSizesChange}
            onHighlightColorsChange={handleHighlightColorsChange}
            onExport={
              currentPage.type === "document" ? handleExportPage : undefined
            }
          />
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-hidden bg-[var(--color-background)]">
        {currentPage.type === "document" && (
          <div className="h-full overflow-y-auto">
            {currentPage.coverImage ? (
              <div className="w-full px-0 pt-0">
                <GrovePageCanopy
                  page={currentPage}
                  onUpdate={handlePageChromeUpdate}
                  hideControls={true}
                />
              </div>
            ) : null}

            <div className="max-w-4xl mx-auto px-12 py-8">
              {!currentPage.coverImage ? (
                <GrovePageCanopy
                  page={currentPage}
                  onUpdate={handlePageChromeUpdate}
                />
              ) : (
                <GrovePageCanopy
                  page={currentPage}
                  onUpdate={handlePageChromeUpdate}
                  hideCover={true}
                />
              )}

              <PageTitleBlock
                value={title}
                onChange={(nextTitle) => void handleTitleChange(nextTitle)}
                placeholder="Untitled"
                size="page"
                testId="workspace-page-title"
              />

              {/* Mobile Add Buttons */}
              <div className="mb-6 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3 sm:hidden">
                <div className="mb-3 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.2em] text-[var(--color-text-secondary)]">
                  <Plus className="h-3.5 w-3.5" />Add to doc
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {creatablePageTypes.map((type) => {
                    const icon =
                      type === "document" ? (
                        <FileText className="h-4 w-4" />
                      ) : type === "canvas" ? (
                        <Palette className="h-4 w-4" />
                      ) : (
                        <Database className="h-4 w-4" />
                      );
                    const isPending = pendingChildType === type;
                    return (
                      <button
                        key={type}
                        type="button"
                        onClick={() => void handleCreateChildPage(type)}
                        disabled={pendingChildType !== null}
                        className="flex min-h-24 flex-col items-start justify-between rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-3 text-left transition hover:border-[#2E7D45] hover:bg-[var(--color-accent-subtle)] disabled:cursor-wait disabled:opacity-60"
                      >
                        <div className="flex w-full items-center justify-between text-[#2E7D45]">
                          <span className="rounded-lg bg-[#E8F3EC] p-2">{icon}</span>
                          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-[var(--color-text-primary)]">
                            {creatablePageLabels[type]}
                          </div>
                          <div className="mt-1 text-xs text-[var(--color-text-secondary)]">
                            {creatablePageDescriptions[type]}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Editor */}
              <Editor
                key={pageId}
                content={currentPage.content}
                bodyFontSizePt={currentPage.bodyFontSizePt}
                headingFontSizes={currentPage.headingFontSizes}
                highlightColors={currentPage.highlightColors}
                pageUpdatedAt={currentPage.updatedAt}
                yjsUpdatedAt={currentPage.yjsUpdatedAt}
                editable={true}
                onUpdate={handleEditorUpdate}
                onEdit={scheduleSave}
                placeholder="Type something..."
                workspaceId={workspaceId}
                pageId={pageId}
                onContentContainerReady={setGroveContentElement}
                onEditorReady={(editor) => {
                  editorInstanceRef.current = editor;
                }}
              />
            </div>
            <TableOfContents container={groveContentElement} />
          </div>
        )}

        {currentPage.type === "canvas" && (
          <div className="h-full">
            <ClearingBoard
              embedded={true}
              roomSlug={currentPage.id}
              title={currentPage.title || "Jungle Clearing"}
            />
          </div>
        )}

        {currentPage.type === "database" && (
          <DatabaseWorkspace pageId={pageId} workspaceId={workspaceId} />
        )}
      </div>

      {/* Database View Modal - available on all pages */}
      {isDatabaseModalOpen && <DatabaseViewModal />}
      {isGroveSideTabOpen && <GroveSideTab workspaceId={workspaceId} />}
    </CollaborationProvider>
  );
}
