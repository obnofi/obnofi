"use client";

import { useMemo, useState } from "react";
import { InputRule, Node, mergeAttributes } from "@tiptap/core";
import {
  NodeViewWrapper,
  ReactNodeViewRenderer,
  type ReactNodeViewProps,
} from "@tiptap/react";
import { ExternalLink, GitGraph } from "lucide-react";
import {
  getGitHubEmbedMeta,
  parseGitHubEmbedUrl,
  type GitHubEmbedAttrs,
} from "@/lib/editor/githubEmbedUtils";

function GitHubEmbedBlockView(props: ReactNodeViewProps) {
  const attrs = props.node.attrs as GitHubEmbedAttrs;
  const [draftUrl, setDraftUrl] = useState(attrs.url ?? "");
  const parsedDraft = useMemo(() => parseGitHubEmbedUrl(draftUrl), [draftUrl]);
  const hasUrl = Boolean(attrs.url);
  const isEditable = props.editor.isEditable;
  const meta = getGitHubEmbedMeta(attrs);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!parsedDraft) return;
    props.updateAttributes(parsedDraft);
  };

  return (
    <NodeViewWrapper
      className="not-prose my-4"
      contentEditable={false}
      onMouseDown={(event) => event.stopPropagation()}
      onClick={(event) => event.stopPropagation()}
    >
      <div className="grove-github-embed" data-testid="github-embed-block">
        {hasUrl ? (
          <a
            className="grove-github-embed__card"
            href={attrs.url}
            target="_blank"
            rel="noreferrer"
          >
            <span className="grove-github-embed__icon">
              <GitGraph className="h-4 w-4" />
            </span>
            <span className="grove-github-embed__body">
              <span className="grove-github-embed__title">{attrs.title || attrs.url}</span>
              <span className="grove-github-embed__meta">{meta}</span>
            </span>
            <ExternalLink className="grove-github-embed__open h-3.5 w-3.5" />
          </a>
        ) : isEditable ? (
          <form className="grove-github-embed__form" onSubmit={handleSubmit}>
            <span className="grove-github-embed__icon" aria-hidden="true">
              <GitGraph className="h-4 w-4" />
            </span>
            <input
              aria-label="GitHub URL"
              className="grove-github-embed__input"
              placeholder="GitHub 링크 붙여넣기"
              value={draftUrl}
              onMouseDown={(event) => event.stopPropagation()}
              onChange={(event) => setDraftUrl(event.target.value)}
            />
            <button
              className="grove-github-embed__button"
              type="submit"
              disabled={!parsedDraft}
            >
              임베드
            </button>
          </form>
        ) : null}
      </div>
    </NodeViewWrapper>
  );
}

export const GitHubEmbedBlock = Node.create({
  name: "githubEmbedBlock",
  group: "block",
  atom: true,
  selectable: true,
  draggable: true,

  addAttributes() {
    return {
      url: { default: "" },
      kind: { default: "unknown" },
      owner: { default: "" },
      repo: { default: "" },
      number: { default: "" },
      gistId: { default: "" },
      title: { default: "" },
    };
  },

  parseHTML() {
    return [{ tag: "div[data-type='github-embed-block']" }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, { "data-type": "github-embed-block" }),
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(GitHubEmbedBlockView);
  },

  addCommands() {
    return {
      insertGitHubEmbedBlock:
        (attrs?: Partial<GitHubEmbedAttrs>) =>
        ({ commands }) => {
          const parsedAttrs = attrs?.url ? parseGitHubEmbedUrl(attrs.url) : null;

          return commands.insertContent({
            type: this.name,
            attrs: parsedAttrs ?? attrs ?? {},
          });
        },
    };
  },

  addInputRules() {
    return [
      new InputRule({
        find: /(?:^|\s)\/(?:github|gist|pr)$/,
        handler: ({ state, range, chain }) => {
          const from = range.from;
          const to = range.to;
          const prefix = state.doc.textBetween(Math.max(0, from - 1), from, "\n", "\0");
          const deleteFrom = prefix === " " ? from - 1 : from;

          chain()
            .deleteRange({ from: deleteFrom, to })
            .insertContent({
              type: this.name,
              attrs: {},
            })
            .run();
        },
      }),
    ];
  },
});

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    githubEmbedBlock: {
      insertGitHubEmbedBlock: (attrs?: Partial<GitHubEmbedAttrs>) => ReturnType;
    };
  }
}
