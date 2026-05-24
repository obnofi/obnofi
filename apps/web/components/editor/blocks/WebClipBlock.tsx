"use client";

import { Node, mergeAttributes } from "@tiptap/core";
import {
  NodeViewWrapper,
  ReactNodeViewRenderer,
  type ReactNodeViewProps,
} from "@tiptap/react";
import { Globe } from "lucide-react";

type WebClipAttrs = {
  url: string;
  note: string;
};

function WebClipBlockView(props: ReactNodeViewProps) {
  const attrs = props.node.attrs as WebClipAttrs;

  return (
    <NodeViewWrapper
      className="not-prose my-4"
      contentEditable={false}
      onMouseDown={(event) => event.stopPropagation()}
      onClick={(event) => event.stopPropagation()}
    >
      <div className="grove-insert-block">
        <div className="grove-insert-block__header">
          <Globe className="h-4 w-4" />
        </div>
        <a className="grove-web-clip__url" href={attrs.url} target="_blank" rel="noreferrer">
          {attrs.url}
        </a>
        <textarea
          className="grove-web-clip__note"
          value={attrs.note}
          readOnly={!props.editor.isEditable}
          rows={3}
          onMouseDown={(event) => event.stopPropagation()}
          onChange={(event) => props.updateAttributes({ note: event.target.value })}
        />
      </div>
    </NodeViewWrapper>
  );
}

export const WebClipBlock = Node.create({
  name: "webClipBlock",
  group: "block",
  atom: true,
  selectable: true,
  draggable: true,

  addAttributes() {
    return {
      url: { default: "" },
      note: { default: "" },
    };
  },

  parseHTML() {
    return [{ tag: "div[data-type='web-clip-block']" }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, { "data-type": "web-clip-block" }),
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(WebClipBlockView);
  },

  addCommands() {
    return {
      insertWebClipBlock:
        (attrs: WebClipAttrs) =>
        ({ commands }) =>
          commands.insertContent({
            type: this.name,
            attrs,
          }),
    };
  },
});

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    webClipBlock: {
      insertWebClipBlock: (attrs: WebClipAttrs) => ReturnType;
    };
  }
}
