"use client";

import { Node, mergeAttributes } from "@tiptap/core";
import {
  NodeViewWrapper,
  ReactNodeViewRenderer,
  type ReactNodeViewProps,
} from "@tiptap/react";
import { Table2 } from "lucide-react";

type GroveTableAttrs = {
  cells: string[][];
};

function createDefaultTableCells() {
  return [
    ["", "", ""],
    ["", "", ""],
    ["", "", ""],
  ];
}

function GroveTableBlockView(props: ReactNodeViewProps) {
  const attrs = props.node.attrs as GroveTableAttrs;
  const cells = attrs.cells?.length ? attrs.cells : createDefaultTableCells();

  return (
    <NodeViewWrapper
      className="not-prose my-4"
      contentEditable={false}
      onMouseDown={(event) => event.stopPropagation()}
      onClick={(event) => event.stopPropagation()}
    >
      <div className="grove-insert-block">
        <div className="grove-insert-block__header">
          <Table2 className="h-4 w-4" />
        </div>
        <div className="grove-table-block">
          {cells.map((row, rowIndex) => (
            <div className="grove-table-block__row" key={`row-${rowIndex}`}>
              {row.map((cell, columnIndex) => (
                <input
                  key={`${rowIndex}-${columnIndex}`}
                  className="grove-table-block__cell"
                  value={cell}
                  readOnly={!props.editor.isEditable}
                  onMouseDown={(event) => event.stopPropagation()}
                  onChange={(event) => {
                    const nextCells = cells.map((currentRow) => [...currentRow]);
                    nextCells[rowIndex][columnIndex] = event.target.value;
                    props.updateAttributes({ cells: nextCells });
                  }}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </NodeViewWrapper>
  );
}

export const GroveTableBlock = Node.create({
  name: "groveTableBlock",
  group: "block",
  atom: true,
  selectable: true,
  draggable: true,

  addAttributes() {
    return {
      cells: { default: createDefaultTableCells() },
    };
  },

  parseHTML() {
    return [{ tag: "div[data-type='grove-table-block']" }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, { "data-type": "grove-table-block" }),
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(GroveTableBlockView);
  },

  addCommands() {
    return {
      insertGroveTableBlock:
        () =>
        ({ commands }) =>
          commands.insertContent({
            type: this.name,
            attrs: { cells: createDefaultTableCells() },
          }),
    };
  },
});

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    groveTableBlock: {
      insertGroveTableBlock: () => ReturnType;
    };
  }
}
