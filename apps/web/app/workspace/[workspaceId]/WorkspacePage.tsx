"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
import { ImportFromUrlControl } from "@/components/workspace/ImportFromUrlControl";
import { useAutoSave } from "@/hooks/useAutoSave";
import {
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
  initialPages?: Page[];
}

interface WorkspacePageInnerProps {
  workspaceId: string;
  pageId: string;
}

const typeIcons: Record<PageType, React.ReactNode> = {
  document: <FileText className="w-4 h-4" />,
  canvas: <Palette className="w-4 h-4" />,
  database: <Database className="w-4 h-4" />,
};

// pageId는 URL search param에서 읽는다. server component(page.tsx)는 searchParams를
// 받지 않으므로 페이지 클릭 시 SSR이 재실행되지 않고, 본문 fetch만 클라이언트에서 일어난다.
export function WorkspacePage({ workspaceId, initialPages }: WorkspacePageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlPageId = searchParams.get("page");
  const setPages = usePageStore((state) => state.setPages);
  const storePages = usePageStore((state) => state.pages);

  // SSR로 받은 페이지 목록을 store에 한 번 주입 — 같은 워크스페이스 내에서는 layout의
  // fetchPages가 중복 호출되지 않는다 (initializedWorkspaceId 체크).
  useEffect(() => {
    if (initialPages) setPages(initialPages, workspaceId);
  }, [initialPages, workspaceId, setPages]);

  // pageId가 URL에 없으면 첫 페이지로 자동 이동.
  useEffect(() => {
    if (urlPageId) return;
    const fallbackId = initialPages?.[0]?.id ?? storePages[0]?.id;
    if (fallbackId) {
      router.replace(`/workspace/${workspaceId}?page=${fallbackId}`);
    }
  }, [urlPageId, initialPages, storePages, workspaceId, router]);

  if (!urlPageId) {
    const hasPages =
      (initialPages && initialPages.length > 0) || storePages.length > 0;
    if (hasPages) {
      // redirect가 commit되기 전까지의 짧은 빈 프레임
      return null;
    }
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 bg-[var(--color-background)] text-[var(--color-text-secondary)]">
        <span className="text-[15px]">페이지가 없습니다</span>
        <span className="text-[13px]">사이드바에서 새 페이지를 만들어 시작하세요</span>
      </div>
    );
  }

  return <WorkspacePageInner workspaceId={workspaceId} pageId={urlPageId} />;
}

function WorkspacePageInner({ workspaceId, pageId }: WorkspacePageInnerProps) {
  const router = useRouter();
  const {
    currentPage,
    pages,
    fetchPage,
    updatePage,
    createPage,
    setCurrentPage,
    getPageTrail,
  } = usePageStore();
  const isDatabaseModalOpen = useUIStore((state) => state.databaseModal.isOpen);
  const isGroveSideTabOpen = useUIStore((state) => state.groveSideTab.isOpen);

  const [title, setTitle] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const editorInstanceRef = useRef<TiptapEditor | null>(null);

  // 최신 editor content를 ref에 보관 — useAutoSave가 getContent()로 접근
  const latestContentRef = useRef<object>({ type: "doc", content: [{ type: "paragraph" }] });
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
  const [, setExpandedPages] = useState<Set<string>>(new Set());
  const [groveContentElement, setGroveContentElement] = useState<HTMLDivElement | null>(null);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    fetchPage(pageId).finally(() => {
      if (!cancelled) setIsLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [pageId, fetchPage]);

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

  const pageTrail = useMemo(() => {
    if (!pageId) {
      return [];
    }

    const trail = getPageTrail(pageId);

    if (currentPage) {
      return trail.map((page) => (page.id === currentPage.id ? currentPage : page));
    }

    return trail;
  }, [currentPage, getPageTrail, pageId]);

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
          {currentPage.type === "document" ? <CollaborationAvatars /> : null}
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
                        </div>
                      </button>
                    );
                  })}
                </div>
                <div className="mt-2">
                  <ImportFromUrlControl
                    workspaceId={workspaceId}
                    parentId={pageId}
                    className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-[13px] text-[var(--color-text-primary)] transition-colors hover:bg-[var(--color-hover)]"
                  />
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
