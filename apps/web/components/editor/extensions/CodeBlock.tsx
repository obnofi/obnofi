"use client";

import { InputRule, Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { CodeBlockView } from "./CodeBlockView";

export const CodeBlock = Node.create({
  name: "codeBlock",
  group: "block",
  atom: true,
  selectable: true,
  draggable: true,

  addAttributes() {
    return {
      language: {
        default: "javascript",
      },
      code: {
        default: "",
      },
      isOpen: {
        default: true,
      },
    };
  },

  parseHTML() {
    return [{ tag: "div[data-type='code-block']" }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, { "data-type": "code-block" }),
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(CodeBlockView);
  },

  addCommands() {
    return {
      insertCodeBlock:
        () =>
        ({ commands }: { commands: { insertContent: (content: unknown) => unknown } }) =>
          commands.insertContent({
            type: this.name,
            attrs: {
              language: "javascript",
              code: "",
              isOpen: true,
            },
          }),
    } as never;
  },

  addInputRules() {
    return [
      new InputRule({
        find: /(?:^|\s)\/code$/,
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
                language: "javascript",
                code: "",
                isOpen: true,
              },
            })
            .run();
        },
      }),
    ];
  },
});
