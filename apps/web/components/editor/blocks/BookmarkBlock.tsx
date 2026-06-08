"use client";

import { useMemo, useState } from "react";
import { Node, mergeAttributes } from "@tiptap/core";
import {
  NodeViewWrapper,
  ReactNodeViewRenderer,
  type ReactNodeViewProps,
} from "@tiptap/react";
import { Bookmark, ExternalLink, Globe } from "lucide-react";
import { normalizeUrl } from "@/components/toolbar/LinkEmbedModal";

type BookmarkBlockAttrs = {
  url: string;
  title: string;
  note: string;
};

function extractHost(url: string) {
  try {
    return new URL(url).host;
  } catch {
    return "";
  }
}

function BookmarkBlockView(props: ReactNodeViewProps) {
  const attrs = props.node.attrs as BookmarkBlockAttrs;
  const isEditable = props.editor.isEditable;
  const [draftUrl, setDraftUrl] = useState(attrs.url);
  const normalizedUrl = useMemo(() => normalizeUrl(draftUrl), [draftUrl]);
  const host = extractHost(attrs.url);

  return (
    <NodeViewWrapper
      className="not-prose my-4"
      data-testid="bookmark-block"
      contentEditable={false}
      onMouseDown={(event) => event.stopPropagation()}
      onClick={(event) => event.stopPropagation()}
    >
      <div className="grove-bookmark">
        {attrs.url ? (
          <a className="grove-bookmark__card" href={attrs.url} target="_blank" rel="noreferrer">
            <span className="grove-bookmark__icon">
              <Globe className="h-4 w-4" />
            </span>
            <span className="grove-bookmark__body">
              <span className="grove-bookmark__title">{attrs.title || attrs.url}</span>
              <span className="grove-bookmark__meta">{host || attrs.url}</span>
              {attrs.note ? <span className="grove-bookmark__note">{attrs.note}</span> : null}
            </span>
            <ExternalLink className="grove-bookmark__open h-3.5 w-3.5" />
          </a>
        ) : null}

        {isEditable ? (
          <div className="grove-bookmark__editor">
            <div className="grove-insert-block__header">
              <Bookmark className="h-4 w-4" />
              <span>북마크</span>
            </div>
            <input
              className="grove-bookmark__input"
              type="url"
              value={draftUrl}
              placeholder="https://example.com"
              onMouseDown={(event) => event.stopPropagation()}
              onChange={(event) => setDraftUrl(event.target.value)}
              onBlur={() => props.updateAttributes({ url: normalizedUrl ?? "" })}
            />
            <input
              className="grove-bookmark__input"
              type="text"
              value={attrs.title}
              placeholder="제목"
              onMouseDown={(event) => event.stopPropagation()}
              onChange={(event) => props.updateAttributes({ title: event.target.value })}
            />
            <textarea
              className="grove-bookmark__textarea"
              rows={3}
              value={attrs.note}
              placeholder="메모"
              onMouseDown={(event) => event.stopPropagation()}
              onChange={(event) => props.updateAttributes({ note: event.target.value })}
            />
          </div>
        ) : null}
      </div>
    </NodeViewWrapper>
  );
}

export const BookmarkBlock = Node.create({
  name: "bookmarkBlock",
  group: "block",
  atom: true,
  selectable: true,
  draggable: true,

  addAttributes() {
    return {
      url: { default: "" },
      title: { default: "" },
      note: { default: "" },
    };
  },

  parseHTML() {
    return [{ tag: "div[data-type='bookmark-block']" }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["div", mergeAttributes(HTMLAttributes, { "data-type": "bookmark-block" })];
  },

  addNodeView() {
    return ReactNodeViewRenderer(BookmarkBlockView);
  },

  addCommands() {
    return {
      insertBookmarkBlock:
        (attrs?: Partial<BookmarkBlockAttrs>) =>
        ({ commands }) =>
          commands.insertContent([
            {
              type: this.name,
              attrs: {
                url: attrs?.url ?? "",
                title: attrs?.title ?? "",
                note: attrs?.note ?? "",
              },
            },
            { type: "paragraph" },
          ]),
    };
  },
});

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    bookmarkBlock: {
      insertBookmarkBlock: (attrs?: Partial<BookmarkBlockAttrs>) => ReturnType;
    };
  }
}
