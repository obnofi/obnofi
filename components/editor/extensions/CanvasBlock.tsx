"use client";

import { useCallback, useEffect, useState } from "react";
import { InputRule, Node, mergeAttributes } from "@tiptap/core";
import {
  NodeViewWrapper,
  ReactNodeViewRenderer,
  type ReactNodeViewProps,
} from "@tiptap/react";
import { ExternalLink, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { Canvas } from "@/components/canvas/Canvas";
import type { Page } from "@/types";

interface CanvasBlockExtensionOptions {
  workspaceId?: string;
  pageId?: string;
}

interface CanvasBlockAttrs {
  pageId: string | null;
  workspaceId: string | null;
  parentPageId: string | null;
  autoCreate: boolean;
}

function CanvasBlockView(props: ReactNodeViewProps) {
  const router = useRouter();
  const attrs = props.node.attrs as CanvasBlockAttrs;
  const { pageId, workspaceId, parentPageId, autoCreate } = attrs;
  const [canvasPage, setCanvasPage] = useState<Page | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const loadCanvasPage = useCallback(async () => {
    if (!pageId) {
      setCanvasPage(null);
      return;
    }

    setIsLoading(true);
    const response = await fetch(`/api/pages/${pageId}`);
    if (!response.ok) {
      setCanvasPage(null);
      setIsLoading(false);
      return;
    }

    const page = (await response.json()) as Page;
    setCanvasPage(page);
    setIsLoading(false);
  }, [pageId]);

  useEffect(() => {
    void loadCanvasPage();
  }, [loadCanvasPage]);

  const createCanvasPage = useCallback(async () => {
    if (!workspaceId || !parentPageId || isCreating) {
      return;
    }

    setIsCreating(true);
    const response = await fetch("/api/pages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "Inline Canvas",
        type: "canvas",
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
      autoCreate: false,
    });
  }, [isCreating, parentPageId, props, workspaceId]);

  useEffect(() => {
    if (!props.editor.isEditable || !autoCreate || pageId) {
      return;
    }

    void createCanvasPage();
  }, [autoCreate, createCanvasPage, pageId, props.editor.isEditable]);

  const handleUpdateContent = async (content: object) => {
    if (!canvasPage) {
      return;
    }

    setCanvasPage({ ...canvasPage, content });
    await fetch(`/api/pages/${canvasPage.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });
  };

  return (
    <NodeViewWrapper className="my-4">
      <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-50 not-prose dark:border-zinc-800 dark:bg-zinc-900/70">
        <div className="flex items-center justify-end gap-2 border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
            {workspaceId && canvasPage ? (
              <button
                type="button"
                onClick={() => router.push(`/workspace/${workspaceId}?page=${canvasPage.id}`)}
                className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-100"
              >
                Open
                <ExternalLink className="h-3.5 w-3.5" />
              </button>
            ) : null}
        </div>

        {isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-[#2E7D45]" />
          </div>
        ) : canvasPage ? (
          <div className="h-[420px]">
            <Canvas
              content={canvasPage.content}
              onUpdate={handleUpdateContent}
              compact={true}
            />
          </div>
        ) : (
          <div className="px-4 py-8 text-sm text-zinc-500 dark:text-zinc-400">
            {isCreating
              ? "Creating canvas..."
              : props.editor.isEditable
              ? "Canvas is being prepared."
              : "Canvas preview unavailable."}
          </div>
        )}
      </div>
    </NodeViewWrapper>
  );
}

export const CanvasBlock = Node.create<CanvasBlockExtensionOptions>({
  name: "canvasEmbed",
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
    return [{ tag: "div[data-type='canvas-embed']" }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, { "data-type": "canvas-embed" }),
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(CanvasBlockView);
  },

  addCommands() {
    return {
      insertCanvasEmbed:
        () =>
        ({ commands }) =>
          commands.insertContent({
            type: this.name,
            attrs: {
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
        find: /(?:^|\s)\/canvas$/,
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
    canvasEmbed: {
      insertCanvasEmbed: () => ReturnType;
    };
  }
}
