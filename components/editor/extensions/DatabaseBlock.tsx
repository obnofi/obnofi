"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { InputRule, Node, mergeAttributes } from "@tiptap/core";
import {
  NodeViewWrapper,
  ReactNodeViewRenderer,
  type ReactNodeViewProps,
} from "@tiptap/react";
import { ExternalLink, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { TableView } from "@/components/database/TableView";
import { DatabasePage, Page, PropertyValueData, type ColumnType } from "@/types";

interface DatabaseBlockExtensionOptions {
  workspaceId?: string;
  pageId?: string;
}

interface DatabaseBlockAttrs {
  databaseId: string | null;
  pageId: string | null;
  workspaceId: string | null;
  parentPageId: string | null;
  autoCreate: boolean;
}

function DatabaseBlockView(props: ReactNodeViewProps) {
  const router = useRouter();
  const attrs = props.node.attrs as DatabaseBlockAttrs;
  const { databaseId, pageId, workspaceId, parentPageId, autoCreate } = attrs;
  const [databasePages, setDatabasePages] = useState<Page[]>([]);
  const [databasePage, setDatabasePage] = useState<DatabasePage | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const loadDatabasePages = useCallback(async () => {
    if (!workspaceId) {
      return;
    }

    const response = await fetch(`/api/pages?workspaceId=${workspaceId}`);
    if (!response.ok) {
      return;
    }

    const pages = (await response.json()) as Page[];
    setDatabasePages(pages.filter((page) => page.type === "database"));
  }, [workspaceId]);

  const loadDatabasePage = useCallback(async () => {
    if (!pageId) {
      setDatabasePage(null);
      return;
    }

    setIsLoading(true);
    const response = await fetch(`/api/pages/${pageId}?view=full`);
    if (!response.ok) {
      setDatabasePage(null);
      setIsLoading(false);
      return;
    }

    const page = (await response.json()) as DatabasePage;
    setDatabasePage(page);
    setIsLoading(false);
  }, [pageId]);

  useEffect(() => {
    void loadDatabasePages();
  }, [loadDatabasePages]);

  useEffect(() => {
    void loadDatabasePage();
  }, [loadDatabasePage]);

  const createDatabasePage = useCallback(async () => {
    if (!workspaceId || !parentPageId || isCreating) {
      return;
    }

    setIsCreating(true);
    const response = await fetch("/api/pages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "Inline Database",
        type: "database",
        parentId: parentPageId,
        workspaceId,
      }),
    });

    setIsCreating(false);

    if (!response.ok) {
      return;
    }

    const createdPage = (await response.json()) as Page;
    props.updateAttributes({
      pageId: createdPage.id,
      databaseId: createdPage.databaseId ?? null,
      autoCreate: false,
    });
    await loadDatabasePages();
  }, [isCreating, parentPageId, props, workspaceId, loadDatabasePages]);

  useEffect(() => {
    if (!props.editor.isEditable || !autoCreate || pageId) {
      return;
    }

    void createDatabasePage();
  }, [autoCreate, createDatabasePage, pageId, props.editor.isEditable]);

  const selectedValue = useMemo(() => {
    if (pageId) {
      return pageId;
    }

    if (databaseId) {
      return (
        databasePages.find((candidate) => candidate.databaseId === databaseId)?.id ?? ""
      );
    }

    return "";
  }, [databaseId, databasePages, pageId]);

  const handleCreateRow = async () => {
    if (!databasePage) {
      return;
    }

    await fetch(`/api/databases/${databasePage.database.id}/rows`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Untitled" }),
    });

    await loadDatabasePage();
  };

  const handleCreateColumn = async (input: { name: string; type: ColumnType }) => {
    if (!databasePage) {
      return;
    }

    await fetch(`/api/databases/${databasePage.database.id}/columns`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });

    await loadDatabasePage();
  };

  const handleUpdateRowTitle = async (rowId: string, title: string) => {
    await fetch(`/api/pages/${rowId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title }),
    });

    setDatabasePage((current) => {
      if (!current) {
        return current;
      }

      return {
        ...current,
        database: {
          ...current.database,
          rows: current.database.rows.map((row) =>
            row.id === rowId ? { ...row, title } : row
          ),
        },
      };
    });
  };

  const handleUpdatePropertyValue = async (
    rowId: string,
    columnId: string,
    value: PropertyValueData
  ) => {
    const response = await fetch("/api/property-values", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        pageId: rowId,
        columnId,
        value,
      }),
    });

    if (!response.ok) {
      return;
    }

    const updatedPropertyValue = await response.json();

    setDatabasePage((current) => {
      if (!current) {
        return current;
      }

      return {
        ...current,
        database: {
          ...current.database,
          rows: current.database.rows.map((row) => {
            if (row.id !== rowId) {
              return row;
            }

            const propertyValues = row.propertyValues ?? [];
            const existingIndex = propertyValues.findIndex(
              (propertyValue) => propertyValue.columnId === columnId
            );

            if (existingIndex === -1) {
              return {
                ...row,
                propertyValues: [...propertyValues, updatedPropertyValue],
              };
            }

            return {
              ...row,
              propertyValues: propertyValues.map((propertyValue, index) =>
                index === existingIndex ? updatedPropertyValue : propertyValue
              ),
            };
          }),
        },
      };
    });
  };

  return (
    <NodeViewWrapper className="my-4">
      <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-50 not-prose dark:border-zinc-800 dark:bg-zinc-900/70">
        <div className="flex flex-wrap items-center justify-end gap-2 border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
            {props.editor.isEditable ? (
              <select
                value={selectedValue}
                onChange={(event) => {
                  const nextPage = databasePages.find(
                    (candidate) => candidate.id === event.target.value
                  );

                  props.updateAttributes({
                    pageId: nextPage?.id ?? null,
                    databaseId: nextPage?.databaseId ?? null,
                    autoCreate: false,
                  });
                }}
                className="min-w-48 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-[#111110] outline-none transition focus:border-[#2E7D45] dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
              >
                <option value="">Pick existing</option>
                {databasePages.map((page) => (
                  <option key={page.id} value={page.id}>
                    {page.title}
                  </option>
                ))}
              </select>
            ) : null}

            {workspaceId && databasePage ? (
              <button
                type="button"
                onClick={() => router.push(`/workspace/${workspaceId}?page=${databasePage.id}`)}
                className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-100"
              >
                Open
                <ExternalLink className="h-3.5 w-3.5" />
              </button>
            ) : null}
        </div>

        {isLoading ? (
          <div className="flex h-56 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-[#2E7D45]" />
          </div>
        ) : databasePage ? (
          <div className="flex max-h-[380px] flex-col">
            <div className="flex items-center justify-between px-4 py-3">
              <div>
                <div className="text-sm font-semibold text-[#111110] dark:text-zinc-100">
                  {databasePage.title}
                </div>
                <div className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                  {databasePage.database.rows.length} rows, {databasePage.database.columns.length} columns
                </div>
              </div>
            </div>
            <div className="min-h-0 flex-1 border-t border-zinc-200 dark:border-zinc-800">
              <TableView
                columns={databasePage.database.columns}
                rows={databasePage.database.rows}
                onCreateRow={handleCreateRow}
                onCreateColumn={handleCreateColumn}
                onOpenRow={(rowId) => router.push(`/workspace/${workspaceId}?page=${rowId}`)}
                onUpdateRowTitle={handleUpdateRowTitle}
                onUpdatePropertyValue={handleUpdatePropertyValue}
                compact={true}
              />
            </div>
          </div>
        ) : (
          <div className="px-4 py-8 text-sm text-zinc-500 dark:text-zinc-400">
            {isCreating
              ? "Creating database..."
              : props.editor.isEditable
              ? "Database is being prepared."
              : "Database preview unavailable."}
          </div>
        )}
      </div>
    </NodeViewWrapper>
  );
}

export const DatabaseBlock = Node.create<DatabaseBlockExtensionOptions>({
  name: "databaseEmbed",
  group: "block",
  atom: true,
  selectable: true,
  draggable: true,

  addOptions() {
    return {
      workspaceId: undefined,
      pageId: undefined,
    };
  },

  addAttributes() {
    return {
      databaseId: {
        default: null,
      },
      pageId: {
        default: null,
      },
      workspaceId: {
        default: null,
      },
      parentPageId: {
        default: null,
      },
      autoCreate: {
        default: false,
      },
    };
  },

  parseHTML() {
    return [{ tag: "div[data-type='database-embed']" }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, { "data-type": "database-embed" }),
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(DatabaseBlockView);
  },

  addCommands() {
    return {
      insertDatabaseEmbed:
        () =>
        ({ commands }) =>
          commands.insertContent({
            type: this.name,
            attrs: {
              databaseId: null,
              pageId: null,
              workspaceId: this.options.workspaceId ?? null,
              parentPageId: this.options.pageId ?? null,
              autoCreate: true,
            },
          }),
    };
  },

  addInputRules() {
    return [
      new InputRule({
        find: /(?:^|\s)\/database$/,
        handler: ({ state, range, chain }) => {
          const from = range.from;
          const to = range.to;

          const prefix = state.doc.textBetween(Math.max(0, from - 1), from, "\n", "\0");
          const deleteFrom = prefix === " " ? from - 1 : from;

          chain()
            .deleteRange({ from: deleteFrom, to })
            .insertContent({
              type: this.name,
              attrs: {
                databaseId: null,
                pageId: null,
                workspaceId: this.options.workspaceId ?? null,
                parentPageId: this.options.pageId ?? null,
                autoCreate: true,
              },
            })
            .run();
        },
      }),
    ];
  },
});

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    databaseEmbed: {
      insertDatabaseEmbed: () => ReturnType;
    };
  }
}
