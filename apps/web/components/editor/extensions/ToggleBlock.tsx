"use client";

import { Node, mergeAttributes } from "@tiptap/core";
import type { NodeViewProps } from "@tiptap/react";
import {
  NodeViewContent,
  NodeViewWrapper,
  ReactNodeViewRenderer,
} from "@tiptap/react";
import { ChevronRight } from "lucide-react";

type ToggleBlockAttrs = {
  summary: string;
  open: boolean;
  blockId?: string | null;
};

function ToggleBlockView({ node, updateAttributes, editor }: NodeViewProps) {
  const attrs = node.attrs as ToggleBlockAttrs;
  const summary = typeof attrs.summary === "string" ? attrs.summary : "";
  const open = Boolean(attrs.open);

  const handleToggle = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    updateAttributes({ open: !open });
  };

  return (
    <NodeViewWrapper className="grove-toggle-block" data-open={open ? "true" : "false"}>
      <details className="grove-toggle-block__details" open={open}>
        <summary
          className="grove-toggle-block__summary"
          contentEditable={false}
          onClick={(event) => event.preventDefault()}
        >
          <button
            type="button"
            aria-label={open ? "접기" : "펼치기"}
            className="grove-toggle-block__chevron"
            onMouseDown={(event) => {
              event.preventDefault();
              event.stopPropagation();
            }}
            onClick={handleToggle}
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          {editor.isEditable ? (
            <input
              type="text"
              value={summary}
              placeholder="토글 제목"
              className="grove-toggle-block__input"
              onMouseDown={(event) => event.stopPropagation()}
              onClick={(event) => event.stopPropagation()}
              onChange={(event) => updateAttributes({ summary: event.currentTarget.value })}
            />
          ) : (
            <span className="grove-toggle-block__label">{summary || "토글"}</span>
          )}
        </summary>
        <div className="grove-toggle-block__body">
          <NodeViewContent className="grove-toggle-block__content" />
        </div>
      </details>
    </NodeViewWrapper>
  );
}

export const ToggleBlock = Node.create({
  name: "toggleBlock",

  group: "block",

  content: "block+",

  defining: true,

  draggable: true,

  addAttributes() {
    return {
      summary: {
        default: "",
        parseHTML: (element) =>
          element.getAttribute("data-summary") ??
          element.querySelector("summary")?.textContent?.trim() ??
          "",
        renderHTML: (attributes) => ({
          "data-summary": typeof attributes.summary === "string" ? attributes.summary : "",
        }),
      },
      open: {
        default: true,
        parseHTML: (element) => element.hasAttribute("open"),
        renderHTML: (attributes) =>
          attributes.open ? { open: "open" } : {},
      },
      blockId: {
        default: null,
      },
    };
  },

  parseHTML() {
    return [{ tag: "details[data-type='toggle-block']" }];
  },

  renderHTML({ HTMLAttributes }) {
    const summary =
      typeof HTMLAttributes["data-summary"] === "string"
        ? HTMLAttributes["data-summary"]
        : "";

    return [
      "details",
      mergeAttributes(HTMLAttributes, { "data-type": "toggle-block" }),
      ["summary", summary || "토글"],
      ["div", { "data-type": "toggle-block-content" }, 0],
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(ToggleBlockView);
  },

  addCommands() {
    return {
      insertToggleBlock:
        (attrs?: { summary?: string; open?: boolean }) =>
        ({ commands }) =>
          commands.insertContent({
            type: this.name,
            attrs: {
              summary: attrs?.summary ?? "",
              open: attrs?.open ?? true,
            },
            content: [{ type: "paragraph" }],
          }),
    };
  },
});

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    toggleBlock: {
      insertToggleBlock: (attrs?: { summary?: string; open?: boolean }) => ReturnType;
    };
  }
}
