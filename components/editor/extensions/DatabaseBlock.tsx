"use client";

import { useEffect, useMemo, useState } from "react";
import { InputRule, Node, mergeAttributes } from "@tiptap/core";
import {
  NodeViewWrapper,
  ReactNodeViewRenderer,
  type ReactNodeViewProps,
} from "@tiptap/react";
import { ExternalLink, Table2 } from "lucide-react";
import type { DatabasePage, Page, PropertyValueData } from "@/types";

interface DatabaseBlockExtensionOptions {
  workspaceId?: string;
}

interface DatabaseBlockAttrs {
  databaseId: string | null;
  pageId: string | null;
  workspaceId: string | null;
}

function DatabaseBlockView(props: ReactNodeViewProps) {
  const attrs = props.node.attrs as DatabaseBlockAttrs;
  const { databaseId, pageId, workspaceId } = attrs;
  const [databasePages, setDatabasePages] = useState<Page[]>([]);
  const [databasePage, setDatabasePage] = useState<DatabasePage | null>(null);

  useEffect(() => {
    if (!workspaceId) {
      return;
    }

    const loadDatabasePages = async () => {
      const response = await fetch(`/api/pages?workspaceId=${workspaceId}`);
      if (!response.ok) {
        return;
      }

      const pages = (await response.json()) as Page[];
      setDatabasePages(pages.filter((page) => page.type === "database"));
    };

    void loadDatabasePages();
  }, [workspaceId]);

  useEffect(() => {
    if (!pageId) {
      setDatabasePage(null);
      return;
    }

    const loadDatabasePage = async () => {
      const response = await fetch(`/api/pages/${pageId}?view=full`);
      if (!response.ok) {
        setDatabasePage(null);
        return;
      }

      const page = (await response.json()) as DatabasePage;
      setDatabasePage(page);
    };

    void loadDatabasePage();
  }, [pageId]);

  const selectedValue = useMemo(() => {
    if (pageId) {
      return pageId;
    }

    if (databaseId) {
      const matchedPage = databasePages.find(
        (candidate) => candidate.databaseId === databaseId
      );

      return matchedPage?.id ?? "";
    }

    return "";
  }, [databaseId, databasePages, pageId]);

  return (
    <NodeViewWrapper className="my-4">
      <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 not-prose dark:border-zinc-800 dark:bg-zinc-900/70">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 rounded-lg bg-white p-2 text-[#2E7D45] shadow-sm dark:bg-zinc-950">
              <Table2 className="h-4 w-4" />
            </div>
            <div>
              <div className="text-sm font-medium text-[#111110] dark:text-zinc-100">
                Embedded database
              </div>
              <p className="mt-1 text-xs leading-5 text-zinc-500 dark:text-zinc-400">
                Type <code>/database</code> to insert this block, then pick a database page.
              </p>
            </div>
          </div>

          {props.editor.isEditable && (
            <select
              value={selectedValue}
              onChange={(event) => {
                const nextPage = databasePages.find(
                  (candidate) => candidate.id === event.target.value
                );

                props.updateAttributes({
                  pageId: nextPage?.id ?? null,
                  databaseId: nextPage?.databaseId ?? null,
                });
              }}
              className="min-w-56 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-[#111110] outline-none transition focus:border-[#2E7D45] dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
            >
              <option value="">Select database</option>
              {databasePages.map((page) => (
                <option key={page.id} value={page.id}>
                  {page.title}
                </option>
              ))}
            </select>
          )}
        </div>

        {databasePage ? (
          <div className="mt-4 overflow-hidden rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
            <div className="flex items-center justify-between border-b border-zinc-200 px-3 py-2 dark:border-zinc-800">
              <div>
                <div className="text-sm font-medium text-[#111110] dark:text-zinc-100">
                  {databasePage.title}
                </div>
                <div className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                  {databasePage.database.rows.length} rows, {databasePage.database.columns.length} columns
                </div>
              </div>
              {workspaceId && (
                <a
                  href={`/workspace/${workspaceId}?page=${databasePage.id}`}
                  className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-100"
                >
                  Open
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              )}
            </div>

            <div className="overflow-auto">
              <table className="min-w-full border-separate border-spacing-0 text-sm">
                <thead>
                  <tr>
                    <th className="border-b border-r border-zinc-200 px-3 py-2 text-left text-xs font-medium uppercase tracking-wide text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
                      Title
                    </th>
                    {databasePage.database.columns.slice(0, 3).map((column) => (
                      <th
                        key={column.id}
                        className="border-b border-r border-zinc-200 px-3 py-2 text-left text-xs font-medium uppercase tracking-wide text-zinc-500 dark:border-zinc-800 dark:text-zinc-400"
                      >
                        {column.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {databasePage.database.rows.slice(0, 5).map((row) => (
                    <tr key={row.id}>
                      <td className="border-b border-r border-zinc-200 px-3 py-2 text-[#111110] dark:border-zinc-800 dark:text-zinc-100">
                        {row.title || "Untitled"}
                      </td>
                      {databasePage.database.columns.slice(0, 3).map((column) => {
                        const propertyValue = row.propertyValues?.find(
                          (value) => value.columnId === column.id
                        );
                        return (
                          <td
                            key={column.id}
                            className="border-b border-r border-zinc-200 px-3 py-2 text-zinc-600 dark:border-zinc-800 dark:text-zinc-400"
                          >
                            {formatPropertyValue(propertyValue?.value) || "—"}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="mt-4 rounded-lg border border-dashed border-zinc-300 px-4 py-6 text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
            {databasePages.length > 0
              ? "Choose a database to embed a compact read-only table preview."
              : "No database pages are available in this workspace yet."}
          </div>
        )}
      </div>
    </NodeViewWrapper>
  );
}

function formatPropertyValue(value: PropertyValueData | undefined) {
  if (!value) {
    return "";
  }

  if ("value" in value) {
    return value.value === null ? "" : String(value.value);
  }

  if ("optionId" in value) {
    return value.optionId ?? "";
  }

  if ("optionIds" in value) {
    return value.optionIds.join(", ");
  }

  if ("userId" in value) {
    return value.userId ?? "";
  }

  return "";
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
