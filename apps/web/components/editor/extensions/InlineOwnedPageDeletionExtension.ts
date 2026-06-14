"use client";

import { Extension } from "@tiptap/core";
import type { Node as ProseMirrorNode } from "@tiptap/pm/model";
import { usePageStore } from "@/store/pageStore";

const INLINE_OWNED_PAGE_NODE_NAMES = new Set([
  "canvasEmbed",
  "databaseNode",
  "subPageEmbed",
  "mindMapEmbed",
]);

interface InlineOwnedPageAttrs {
  pageId?: string | null;
  isInlinePage?: boolean;
}

function getOwnedInlinePageId(node: ProseMirrorNode | null | undefined): string | null {
  if (!node || !INLINE_OWNED_PAGE_NODE_NAMES.has(node.type.name)) {
    return null;
  }

  const attrs = node.attrs as InlineOwnedPageAttrs;
  if (!attrs.pageId || attrs.isInlinePage === false) {
    return null;
  }

  return attrs.pageId;
}

export const InlineOwnedPageDeletionExtension = Extension.create({
  name: "inlineOwnedPageDeletion",

  addKeyboardShortcuts() {
    const deleteNodeAndPage = (from: number, to: number, pageId: string) => {
      this.editor.commands.deleteRange({ from, to });
      void usePageStore.getState().deletePage(pageId);
      return true;
    };

    return {
      Backspace: () => {
        const { selection } = this.editor.state;
        const selectedNode = "node" in selection ? (selection.node as ProseMirrorNode | undefined) : undefined;

        if (selectedNode) {
          const pageId = getOwnedInlinePageId(selectedNode);
          if (!pageId) return false;

          return deleteNodeAndPage(selection.from, selection.to, pageId);
        }

        if (!selection.empty) {
          return false;
        }

        const { $from } = selection;
        if (!$from.parent.isTextblock || $from.parentOffset !== 0) {
          return false;
        }

        const previousNode = $from.nodeBefore;
        const pageId = getOwnedInlinePageId(previousNode);
        if (!pageId || !previousNode) {
          return false;
        }

        return deleteNodeAndPage($from.pos - previousNode.nodeSize, $from.pos, pageId);
      },

      Delete: () => {
        const { selection } = this.editor.state;
        const selectedNode = "node" in selection ? (selection.node as ProseMirrorNode | undefined) : undefined;

        if (selectedNode) {
          const pageId = getOwnedInlinePageId(selectedNode);
          if (!pageId) return false;

          return deleteNodeAndPage(selection.from, selection.to, pageId);
        }

        if (!selection.empty) {
          return false;
        }

        const { $from } = selection;
        if (!$from.parent.isTextblock || $from.parentOffset !== $from.parent.content.size) {
          return false;
        }

        const nextNode = $from.nodeAfter;
        const pageId = getOwnedInlinePageId(nextNode);
        if (!pageId || !nextNode) {
          return false;
        }

        return deleteNodeAndPage($from.pos, $from.pos + nextNode.nodeSize, pageId);
      },
    };
  },
});
