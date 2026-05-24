"use client";

import { Node, mergeAttributes } from "@tiptap/core";
import {
  NodeViewWrapper,
  ReactNodeViewRenderer,
  type ReactNodeViewProps,
} from "@tiptap/react";
import { ExternalLink, Globe } from "lucide-react";

type LinkEmbedAttrs = {
  url: string;
};

function LinkEmbedBlockView(props: ReactNodeViewProps) {
  const attrs = props.node.attrs as LinkEmbedAttrs;
  const url = attrs.url;

  return (
    <NodeViewWrapper
      className="not-prose my-4"
      contentEditable={false}
      onMouseDown={(event) => event.stopPropagation()}
      onClick={(event) => event.stopPropagation()}
    >
      <a className="grove-link-embed" href={url} target="_blank" rel="noreferrer">
        <Globe className="h-4 w-4" />
        <span className="min-w-0 flex-1 truncate">{url}</span>
        <ExternalLink className="h-3.5 w-3.5" />
      </a>
    </NodeViewWrapper>
  );
}

export const LinkEmbedBlock = Node.create({
  name: "linkEmbedBlock",
  group: "block",
  atom: true,
  selectable: true,
  draggable: true,

  addAttributes() {
    return {
      url: { default: "" },
    };
  },

  parseHTML() {
    return [{ tag: "a[data-type='link-embed-block']" }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "a",
      mergeAttributes(HTMLAttributes, { "data-type": "link-embed-block" }),
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(LinkEmbedBlockView);
  },

  addCommands() {
    return {
      insertLinkEmbedBlock:
        (attrs: LinkEmbedAttrs) =>
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
    linkEmbedBlock: {
      insertLinkEmbedBlock: (attrs: LinkEmbedAttrs) => ReturnType;
    };
  }
}
