"use client";

import { InputRule, Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { MindMapBlockView } from "@/components/editor/blocks/MindMapBlockView";
import { shouldStopInlineBlockEvent } from "@/lib/editor/inlineBlockInteractions";

interface MindMapBlockExtensionOptions {
  workspaceId?: string;
  pageId?: string;
}

export const MindMapBlock = Node.create<MindMapBlockExtensionOptions>({
  name: "mindMapEmbed",
  group: "block",
  atom: true,
  selectable: false,
  draggable: true,

  addOptions() {
    return {
      workspaceId: undefined,
      pageId: undefined,
    };
  },

  addAttributes() {
    return {
      pageId: { default: null },
      workspaceId: { default: null },
      parentPageId: { default: null },
      autoCreate: { default: false },
    };
  },

  parseHTML() {
    return [{ tag: "div[data-type='mindmap-embed']" }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, { "data-type": "mindmap-embed" }),
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(MindMapBlockView, {
      stopEvent: ({ event }) => shouldStopInlineBlockEvent(event),
    });
  },

  addCommands() {
    return {
      insertMindMapEmbed:
        () =>
        ({ commands }) =>
          commands.insertContent([
            {
              type: this.name,
              attrs: {
                pageId: null,
                workspaceId: this.options.workspaceId ?? null,
                parentPageId: this.options.pageId ?? null,
                autoCreate: true,
              },
            },
            { type: "paragraph" },
          ]),
    };
  },

  addInputRules() {
    return [
      new InputRule({
        find: /(?:^|\s)\/mind(?:\s|-)?map$/,
        handler: ({ state, range, chain }) => {
          const from = range.from;
          const to = range.to;
          const prefix = state.doc.textBetween(Math.max(0, from - 1), from, "\n", "\0");
          const deleteFrom = prefix === " " ? from - 1 : from;

          chain()
            .deleteRange({ from: deleteFrom, to })
            .insertContent([
              {
                type: this.name,
                attrs: {
                  pageId: null,
                  workspaceId: this.options.workspaceId ?? null,
                  parentPageId: this.options.pageId ?? null,
                  autoCreate: true,
                },
              },
              { type: "paragraph" },
            ])
            .run();
        },
      }),
    ];
  },
});

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    mindMapEmbed: {
      insertMindMapEmbed: () => ReturnType;
    };
  }
}
