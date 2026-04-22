"use client";

import { Node, mergeAttributes } from "@tiptap/core";
import {
  NodeViewContent,
  NodeViewWrapper,
  ReactNodeViewRenderer,
  type ReactNodeViewProps,
} from "@tiptap/react";

type ColumnLayoutAttrs = {
  columns: 2 | 3;
};

function ColumnLayoutView(props: ReactNodeViewProps) {
  const attrs = props.node.attrs as ColumnLayoutAttrs;
  const columnCount = attrs.columns === 3 ? 3 : 2;

  return (
    <NodeViewWrapper
      className="not-prose grove-column-layout my-4"
      data-column-count={columnCount}
      data-testid={`grove-column-layout-${columnCount}`}
    >
      <NodeViewContent className="grove-column-layout__content" />
    </NodeViewWrapper>
  );
}

function ColumnView() {
  return (
    <NodeViewWrapper
      className="grove-column"
      data-testid="grove-column"
    >
      <NodeViewContent className="grove-column__content" />
    </NodeViewWrapper>
  );
}

function createColumnContent(columnCount: 2 | 3) {
  return Array.from({ length: columnCount }, () => ({
    type: "groveColumn",
    content: [
      {
        type: "paragraph",
      },
    ],
  }));
}

export const GroveColumn = Node.create({
  name: "groveColumn",
  group: "block",
  content: "block+",
  isolating: true,

  parseHTML() {
    return [{ tag: "div[data-type='grove-column']" }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, { "data-type": "grove-column" }),
      0,
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(ColumnView);
  },
});

export const ColumnLayoutBlock = Node.create({
  name: "columnLayout",
  group: "block",
  content: "groveColumn{2,3}",
  isolating: true,
  selectable: true,
  draggable: true,

  addAttributes() {
    return {
      columns: {
        default: 2,
        parseHTML: (element) => {
          const value = element.getAttribute("data-columns");
          return value === "3" ? 3 : 2;
        },
        renderHTML: (attributes) => ({
          "data-columns": attributes.columns === 3 ? "3" : "2",
        }),
      },
    };
  },

  parseHTML() {
    return [{ tag: "div[data-type='column-layout']" }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, { "data-type": "column-layout" }),
      0,
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(ColumnLayoutView);
  },

  addCommands() {
    return {
      insertColumnLayout:
        (attrs?: { columns?: 2 | 3 }) =>
        ({ commands }) => {
          const columns = attrs?.columns === 3 ? 3 : 2;

          return commands.insertContent({
            type: this.name,
            attrs: { columns },
            content: createColumnContent(columns),
          });
        },
    };
  },
});

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    columnLayout: {
      insertColumnLayout: (attrs?: { columns?: 2 | 3 }) => ReturnType;
    };
  }
}
