"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { InputRule, Node, mergeAttributes } from "@tiptap/core";
import {
  NodeViewWrapper,
  ReactNodeViewRenderer,
  type ReactNodeViewProps,
} from "@tiptap/react";
import { useRouter } from "next/navigation";
import { DatabasePageCard } from "@/components/database/DatabasePageCard";
import { Page } from "@/types";

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
  const [isCreating, setIsCreating] = useState(false);

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

  useEffect(() => {
    void loadDatabasePages();
  }, [loadDatabasePages]);

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

  return (
    <NodeViewWrapper className="my-4">
      <DatabasePageCard
        pageId={pageId}
        containerTestId="inline-database-embed"
        loadingTestId="inline-database-loading"
        readyTestId="inline-database-ready"
        emptyTestId="inline-database-empty"
        onOpenRow={(rowId) => router.push(`/workspace/${workspaceId}?page=${rowId}`)}
        selection={
          props.editor.isEditable
            ? {
                pages: databasePages,
                selectedValue,
                onChange: (nextPageId) => {
                  const nextPage = databasePages.find(
                    (candidate) => candidate.id === nextPageId
                  );

                  props.updateAttributes({
                    pageId: nextPage?.id ?? null,
                    databaseId: nextPage?.databaseId ?? null,
                    autoCreate: false,
                  });
                },
                onCreate: () => {
                  void createDatabasePage();
                },
              }
            : undefined
        }
        onOpenDatabase={
          workspaceId && pageId
            ? () => router.push(`/workspace/${workspaceId}?page=${pageId}`)
            : undefined
        }
        emptyMessage={
          isCreating
            ? "Creating database..."
            : props.editor.isEditable
            ? "Database is being prepared."
            : "Database preview unavailable."
        }
        state={
          pageId ? undefined : isCreating ? "creating" : "empty"
        }
      />
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
