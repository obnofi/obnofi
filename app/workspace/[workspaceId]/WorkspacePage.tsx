"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  MoreHorizontal,
  FileText,
  Palette,
  Database,
  Loader2,
  Plus,
} from "lucide-react";
import { Editor } from "@/components/editor/Editor";
import { Canvas } from "@/components/canvas/Canvas";
import { DatabaseWorkspace } from "@/components/database/DatabaseWorkspace";
import { SharePopover } from "@/components/share/SharePopover";
import { Sidebar } from "@/components/sidebar/Sidebar";
import { usePageStore } from "@/store/pageStore";
import { PageType } from "@/types";

interface WorkspacePageProps {
  workspaceId: string;
  pageId: string;
}

const typeIcons: Record<PageType, React.ReactNode> = {
  document: <FileText className="w-4 h-4" />,
  canvas: <Palette className="w-4 h-4" />,
  database: <Database className="w-4 h-4" />,
};

export function WorkspacePage({ workspaceId, pageId }: WorkspacePageProps) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [pendingChildType, setPendingChildType] = useState<PageType | null>(null);

  const {
    currentPage,
    fetchPage,
    fetchPages,
    updatePage,
    createPage,
    setCurrentPage,
  } = usePageStore();

  useEffect(() => {
    fetchPages(workspaceId);
  }, [workspaceId, fetchPages]);

  useEffect(() => {
    const loadPage = async () => {
      setIsLoading(true);
      await fetchPage(pageId);
      setIsLoading(false);
    };
    loadPage();
  }, [pageId, fetchPage]);

  useEffect(() => {
    if (currentPage) {
      setTitle(currentPage.title);
    }
  }, [currentPage]);

  const handleTitleChange = async (newTitle: string) => {
    setTitle(newTitle);
    await updatePage(pageId, { title: newTitle });
  };

  const handleContentUpdate = async (content: object) => {
    await updatePage(pageId, { content });
  };

  useEffect(() => {
    const handleShareUpdate = (e: Event) => {
      const { isPublic, shareId } = (e as CustomEvent).detail;
      if (currentPage) {
        setCurrentPage({ ...currentPage, isPublic, shareId });
      }
    };
    window.addEventListener("share-update", handleShareUpdate);
    return () => window.removeEventListener("share-update", handleShareUpdate);
  }, [currentPage, setCurrentPage]);

  useEffect(() => {
    const handleCreateChild = (e: Event) => {
      const type = (e as CustomEvent).detail as PageType;
      handleCreateChildPage(type);
    };
    window.addEventListener("create-child", handleCreateChild);
    return () => window.removeEventListener("create-child", handleCreateChild);
  }, []);

  useEffect(() => {
    const handleSelectChild = (e: Event) => {
      const childPageId = (e as CustomEvent).detail as string;
      router.push(`/workspace/${workspaceId}?page=${childPageId}`);
    };
    window.addEventListener("select-child", handleSelectChild);
    return () => window.removeEventListener("select-child", handleSelectChild);
  }, [workspaceId, router]);

  const handleCreateChildPage = async (type: PageType) => {
    const titles: Record<PageType, string> = {
      document: "New Page",
      canvas: "New Canvas",
      database: "New Database",
    };

    setPendingChildType(type);

    const newPage = await createPage({
      title: titles[type],
      type,
      parentId: pageId,
      workspaceId,
    });

    setPendingChildType(null);

    if (newPage) {
      router.push(`/workspace/${workspaceId}?page=${newPage.id}`);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-screen">
        <Sidebar workspaceId={workspaceId} currentPageId={pageId} />
        <div className="flex-1 flex items-center justify-center bg-white dark:bg-[#111110]">
          <div className="w-8 h-8 border-2 border-zinc-300 border-t-[#2E7D45] rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (!currentPage) {
    return (
      <div className="flex h-screen">
        <Sidebar workspaceId={workspaceId} currentPageId={pageId} />
        <div className="flex-1 flex items-center justify-center text-zinc-500 bg-white dark:bg-[#111110]">
          Page not found
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen">
      <Sidebar workspaceId={workspaceId} currentPageId={pageId} />

      <div className="flex-1 flex flex-col bg-white dark:bg-[#111110] overflow-hidden">
        {/* Header */}
        <header className="flex items-center justify-between px-4 py-2 border-b border-zinc-200 dark:border-zinc-800 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-zinc-400">
              {typeIcons[currentPage.type]}
            </span>
            <span className="text-sm text-zinc-500 dark:text-zinc-400">
              {currentPage.type === "database"
                ? "Database"
                : currentPage.type === "canvas"
                ? "Canvas"
                : "Document"}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <SharePopover
              pageId={pageId}
              isPublic={currentPage.isPublic}
              shareId={currentPage.shareId}
              onShareUpdateAction="share-update"
            />
            <button className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md transition-colors">
              <MoreHorizontal className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
            </button>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-hidden">
          {currentPage.type === "document" && (
            <div className="h-full overflow-y-auto">
              <div className="mx-auto max-w-4xl px-4 py-8 sm:px-8 sm:py-12">
                <input
                  type="text"
                  value={title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder="Untitled"
                  className="mb-6 w-full border-none bg-transparent text-3xl font-bold text-[#111110] outline-none placeholder:text-zinc-300 dark:text-zinc-100 dark:placeholder:text-zinc-600 sm:mb-8 sm:text-4xl"
                />
                <div className="mb-6 rounded-2xl border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-900/60 sm:hidden">
                  <div className="mb-3 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">
                    <Plus className="h-3.5 w-3.5" />
                    Add to doc
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {([
                      {
                        type: "database",
                        label: "Database",
                        description: "Table with rows",
                        icon: <Database className="h-4 w-4" />,
                      },
                      {
                        type: "canvas",
                        label: "Canvas",
                        description: "Sketch board",
                        icon: <Palette className="h-4 w-4" />,
                      },
                    ] as const).map((action) => {
                      const isPending = pendingChildType === action.type;

                      return (
                        <button
                          key={action.type}
                          type="button"
                          onClick={() => void handleCreateChildPage(action.type)}
                          disabled={pendingChildType !== null}
                          className="flex min-h-24 flex-col items-start justify-between rounded-xl border border-zinc-200 bg-white p-3 text-left transition hover:border-[#2E7D45] hover:bg-[#F4FBF6] disabled:cursor-wait disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-950 dark:hover:border-[#2E7D45] dark:hover:bg-zinc-900"
                        >
                          <div className="flex w-full items-center justify-between text-[#2E7D45]">
                            <span className="rounded-lg bg-[#E8F3EC] p-2 dark:bg-[#173520]">
                              {action.icon}
                            </span>
                            {isPending ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : null}
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-[#111110] dark:text-zinc-100">
                              {action.label}
                            </div>
                            <div className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                              {action.description}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
                <Editor
                  content={currentPage.content}
                  editable={true}
                  onUpdate={handleContentUpdate}
                  placeholder="Type something..."
                  workspaceId={workspaceId}
                  pageId={pageId}
                />
              </div>
            </div>
          )}

          {currentPage.type === "canvas" && (
            <Canvas
              content={currentPage.content}
              onUpdate={handleContentUpdate}
            />
          )}

          {currentPage.type === "database" && (
            <DatabaseWorkspace pageId={pageId} workspaceId={workspaceId} />
          )}
        </main>
      </div>
    </div>
  );
}
