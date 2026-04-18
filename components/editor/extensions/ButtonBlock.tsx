"use client";

import { InputRule, Node, mergeAttributes } from "@tiptap/core";
import {
  NodeViewWrapper,
  ReactNodeViewRenderer,
  type ReactNodeViewProps,
} from "@tiptap/react";
import { ExternalLink, Link2 } from "lucide-react";

interface ButtonBlockAttrs {
  label: string;
  url: string;
  variant: "primary" | "secondary";
}

function ButtonBlockView(props: ReactNodeViewProps) {
  const attrs = props.node.attrs as ButtonBlockAttrs;
  const { label, url, variant } = attrs;
  const isEditable = props.editor.isEditable;

  const buttonClassName =
    variant === "secondary"
      ? "border border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
      : "bg-[#2E7D45] text-white hover:bg-[#256a3a]";

  return (
    <NodeViewWrapper className="my-4" data-testid="button-block">
      <div className="not-prose rounded-2xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900/70">
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            data-testid="button-block-preview"
            onClick={() => {
              if (isEditable || !url) {
                return;
              }
              window.open(url, "_blank", "noopener,noreferrer");
            }}
            className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${buttonClassName}`}
          >
            <span>{label || "Button"}</span>
            {url ? <ExternalLink className="h-3.5 w-3.5" /> : null}
          </button>

          {!isEditable && url ? (
            <a
              href={url}
              target="_blank"
              rel="noreferrer"
              className="text-xs text-zinc-500 underline-offset-2 hover:underline dark:text-zinc-400"
            >
              {url}
            </a>
          ) : null}
        </div>

        {isEditable ? (
          <div className="mt-4 grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
            <label className="grid gap-1">
              <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                Label
              </span>
              <input
                data-testid="button-block-label"
                value={label}
                onChange={(event) => props.updateAttributes({ label: event.target.value })}
                placeholder="Button label"
                className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-[#111110] outline-none transition focus:border-[#2E7D45] dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
              />
            </label>

            <label className="grid gap-1">
              <span className="flex items-center gap-1 text-xs font-medium text-zinc-500 dark:text-zinc-400">
                <Link2 className="h-3.5 w-3.5" />
                Link
              </span>
              <input
                data-testid="button-block-url"
                value={url}
                onChange={(event) => props.updateAttributes({ url: event.target.value })}
                placeholder="https://example.com"
                className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-[#111110] outline-none transition focus:border-[#2E7D45] dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
              />
            </label>
          </div>
        ) : null}
      </div>
    </NodeViewWrapper>
  );
}

export const ButtonBlock = Node.create({
  name: "buttonBlock",
  group: "block",
  atom: true,
  selectable: true,
  draggable: true,

  addAttributes() {
    return {
      label: {
        default: "Button",
      },
      url: {
        default: "",
      },
      variant: {
        default: "primary",
      },
    };
  },

  parseHTML() {
    return [{ tag: "div[data-type='button-block']" }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, { "data-type": "button-block" }),
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(ButtonBlockView);
  },

  addCommands() {
    return {
      insertButtonBlock:
        () =>
        ({ commands }) =>
          commands.insertContent({
            type: this.name,
            attrs: {
              label: "Button",
              url: "",
              variant: "primary",
            },
          }),
    };
  },

  addInputRules() {
    return [
      new InputRule({
        find: /(?:^|\s)\/button$/,
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
                label: "Button",
                url: "",
                variant: "primary",
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
    buttonBlock: {
      insertButtonBlock: () => ReturnType;
    };
  }
}
