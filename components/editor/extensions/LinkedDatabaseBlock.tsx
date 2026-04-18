"use client";

import { Node, mergeAttributes } from "@tiptap/core";
import {
  NodeViewWrapper,
  ReactNodeViewRenderer,
  type ReactNodeViewProps,
} from "@tiptap/react";
import { useRouter } from "next/navigation";
import { DatabaseTableCard } from "@/components/database/DatabaseTableCard";
import { useDatabasePage } from "@/hooks/useDatabasePage";

interface LinkedDatabaseBlockExtensionOptions {
  workspaceId?: string;
  pageId?: string;
}

interface LinkedDatabaseBlockAttrs {
  databaseId: string | null;
  pageId: string | null;
  workspaceId: string | null;
}

function LinkedDatabaseBlockView(props: ReactNodeViewProps) {
  const router = useRouter();
  const attrs = props.node.attrs as LinkedDatabaseBlockAttrs;
  const { pageId, workspaceId } = attrs;
  const {
    databasePage,
    isLoading,
    setDatabasePage,
  } = useDatabasePage(pageId);

  return (
    <NodeViewWrapper className="my-4">
      <DatabaseTableCard
        containerTestId="linked-database-embed"
        loadingTestId="linked-database-loading"
        readyTestId="linked-database-ready"
        emptyTestId="linked-database-empty"
        databasePage={databasePage}
        isLoading={isLoading}
        onDatabaseChange={setDatabasePage}
        onOpenRow={(rowId) => router.push(`/workspace/${workspaceId}?page=${rowId}`)}
        headerLabel="연결된 데이터베이스"
        onOpenDatabase={
          workspaceId && databasePage
            ? () => router.push(`/workspace/${workspaceId}?page=${databasePage.id}`)
            : undefined
        }
        emptyMessage="데이터베이스를 불러올 수 없습니다."
      />
    </NodeViewWrapper>
  );
}

export const LinkedDatabaseBlock = Node.create<LinkedDatabaseBlockExtensionOptions>({
  name: "linkedDatabaseEmbed",
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
    };
  },

  parseHTML() {
    return [{ tag: "div[data-type='linked-database-embed']" }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, { "data-type": "linked-database-embed" }),
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(LinkedDatabaseBlockView);
  },

  addCommands() {
    return {
      insertLinkedDatabaseEmbed:
        (attrs?: { databaseId?: string; pageId?: string }) =>
        ({ commands }) =>
          commands.insertContent({
            type: this.name,
            attrs: {
              databaseId: attrs?.databaseId ?? null,
              pageId: attrs?.pageId ?? null,
              workspaceId: this.options.workspaceId ?? null,
            },
          }),
    };
  },
});

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    linkedDatabaseEmbed: {
      insertLinkedDatabaseEmbed: (attrs?: { databaseId?: string; pageId?: string }) => ReturnType;
    };
  }
}
