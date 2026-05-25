import { useCallback, useEffect, useRef, useState } from "react";
import type { Page, PropertyType, ViewType } from "@obnofi/types";
import type { ReactNodeViewProps } from "@tiptap/react";

type GroveSurfaceView = Extract<ViewType, "table" | "gallery" | "board" | "calendar">;

export interface DatabaseNodeAttrs {
  databaseId: string | null;
  pageId: string | null;
  workspaceId: string | null;
  parentPageId: string | null;
  autoCreate: boolean;
  viewType: GroveSurfaceView;
  columns: Array<{ id: string; name: string; type: PropertyType; width?: number }>;
  rows: string[];
  filters: Array<{ id: string; value: unknown }>;
  sorts: Array<{ id: string; desc: boolean }>;
}

export function useDatabaseBlockData(
  attrs: DatabaseNodeAttrs,
  propsRef: React.MutableRefObject<ReactNodeViewProps>,
  attrsRef: React.MutableRefObject<DatabaseNodeAttrs>
) {
  const { workspaceId, parentPageId, autoCreate, pageId, databaseId } = attrs;
  const [databasePages, setDatabasePages] = useState<Page[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const isCreatingRef = useRef(false);
  const hasLoadedPages = useRef(false);
  const [shouldLoadPages, setShouldLoadPages] = useState(false);

  const updateDatabaseBlockAttrs = useCallback(
    (nextAttrs: Partial<DatabaseNodeAttrs>) => {
      const currentProps = propsRef.current;
      if (!currentProps.editor.isEditable || currentProps.editor.isDestroyed) return;
      const position = currentProps.getPos();
      if (typeof position !== "number") return;
      const currentNode = currentProps.editor.state.doc.nodeAt(position);
      if (currentNode?.type.name !== currentProps.node.type.name) return;
      try {
        currentProps.updateAttributes(nextAttrs);
      } catch (error) {
        if (error instanceof RangeError && error.message.includes("No node at given position")) return;
        throw error;
      }
    },
    [propsRef]
  );

  const loadDatabasePages = useCallback(async () => {
    if (!workspaceId || hasLoadedPages.current) return;
    hasLoadedPages.current = true;
    const response = await fetch(`/api/pages?workspaceId=${workspaceId}`);
    if (!response.ok) { hasLoadedPages.current = false; return; }
    const pages = (await response.json()) as Page[];
    setDatabasePages(pages.filter((page) => page.type === "database"));
  }, [workspaceId]);

  useEffect(() => {
    if (shouldLoadPages && !hasLoadedPages.current) {
      void loadDatabasePages();
    }
  }, [shouldLoadPages, loadDatabasePages]);

  const handleSelectionOpen = useCallback(() => {
    setShouldLoadPages(true);
  }, []);

  const createDatabasePage = useCallback(async () => {
    if (!workspaceId || !parentPageId || isCreatingRef.current) return;
    isCreatingRef.current = true;
    setIsCreating(true);
    const response = await fetch("/api/pages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Grove Catalog", type: "database", parentId: parentPageId, workspaceId }),
    });
    isCreatingRef.current = false;
    setIsCreating(false);
    if (!response.ok) return;
    const createdPage = (await response.json()) as Page;
    updateDatabaseBlockAttrs({
      pageId: createdPage.id,
      databaseId: createdPage.databaseId ?? null,
      autoCreate: false,
    });
    await loadDatabasePages();
  }, [loadDatabasePages, parentPageId, updateDatabaseBlockAttrs, workspaceId]);

  useEffect(() => {
    if (!propsRef.current.editor.isEditable || !autoCreate || pageId) return;
    void createDatabasePage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoCreate, pageId]);

  const selectedValue = (() => {
    if (pageId) return pageId;
    if (databaseId) return databasePages.find((c) => c.databaseId === databaseId)?.id ?? "";
    return "";
  })();

  return {
    databasePages,
    isCreating,
    selectedValue,
    updateDatabaseBlockAttrs,
    loadDatabasePages,
    createDatabasePage,
    handleSelectionOpen,
  };
}
