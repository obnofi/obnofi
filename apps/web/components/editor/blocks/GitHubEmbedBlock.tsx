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
  GITHUB_EMBED_VARIANTS,
  getGitHubEmbedMeta,
  parseGitHubEmbedUrl,
  type GitHubEmbedAttrs,
  type GitHubEmbedVariant,
} from "@/lib/editor/githubEmbedUtils";

function GitHubEmbedBlockView(props: ReactNodeViewProps) {
  const attrs = props.node.attrs as GitHubEmbedAttrs;
  const variant = attrs.variant ?? "githubEmbed";
  const variantConfig = GITHUB_EMBED_VARIANTS[variant];
  const [draftUrl, setDraftUrl] = useState(attrs.url ?? "");
  const parsedDraft = useMemo(
    () => parseGitHubEmbedUrl(draftUrl, variant),
    [draftUrl, variant]
  );
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
              data-testid={`github-embed-input-${variant}`}
              className="grove-github-embed__input"
              placeholder={variantConfig.placeholder}
              value={draftUrl}
              onMouseDown={(event) => event.stopPropagation()}
              onChange={(event) => setDraftUrl(event.target.value)}
            />
            <button
              className="grove-github-embed__button"
              data-testid={`github-embed-submit-${variant}`}
              type="submit"
              disabled={!parsedDraft}
            >
              {variantConfig.actionLabel}
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
      variant: { default: "githubEmbed" },
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
          const variant = attrs?.variant ?? "githubEmbed";
          const parsedAttrs = attrs?.url ? parseGitHubEmbedUrl(attrs.url, variant) : null;

          return commands.insertContent({
            type: this.name,
            attrs: parsedAttrs ?? { variant, ...(attrs ?? {}) },
          });
        },
      insertGitHubGistBlock:
        () =>
        ({ commands }) =>
          commands.insertContent({
            type: this.name,
            attrs: { variant: "githubGist" },
          }),
      insertGitHubIssueBlock:
        () =>
        ({ commands }) =>
          commands.insertContent({
            type: this.name,
            attrs: { variant: "githubIssue" },
          }),
      insertGitHubPullBlock:
        () =>
        ({ commands }) =>
          commands.insertContent({
            type: this.name,
            attrs: { variant: "githubPull" },
          }),
    };
  },

  addInputRules() {
    return [
      new InputRule({
        find: /(?:^|\s)\/github$/,
        handler: ({ state, range, chain }) => {
          const from = range.from;
          const to = range.to;
          const prefix = state.doc.textBetween(Math.max(0, from - 1), from, "\n", "\0");
          const deleteFrom = prefix === " " ? from - 1 : from;

          chain()
            .deleteRange({ from: deleteFrom, to })
            .insertContent({
              type: this.name,
              attrs: { variant: "githubEmbed" satisfies GitHubEmbedVariant },
            })
            .run();
        },
      }),
      new InputRule({
        find: /(?:^|\s)\/gist$/,
        handler: ({ state, range, chain }) => {
          const from = range.from;
          const to = range.to;
          const prefix = state.doc.textBetween(Math.max(0, from - 1), from, "\n", "\0");
          const deleteFrom = prefix === " " ? from - 1 : from;

          chain()
            .deleteRange({ from: deleteFrom, to })
            .insertContent({
              type: this.name,
              attrs: { variant: "githubGist" satisfies GitHubEmbedVariant },
            })
            .run();
        },
      }),
      new InputRule({
        find: /(?:^|\s)\/issue$/,
        handler: ({ state, range, chain }) => {
          const from = range.from;
          const to = range.to;
          const prefix = state.doc.textBetween(Math.max(0, from - 1), from, "\n", "\0");
          const deleteFrom = prefix === " " ? from - 1 : from;

          chain()
            .deleteRange({ from: deleteFrom, to })
            .insertContent({
              type: this.name,
              attrs: { variant: "githubIssue" satisfies GitHubEmbedVariant },
            })
            .run();
        },
      }),
      new InputRule({
        find: /(?:^|\s)\/pr$/,
        handler: ({ state, range, chain }) => {
          const from = range.from;
          const to = range.to;
          const prefix = state.doc.textBetween(Math.max(0, from - 1), from, "\n", "\0");
          const deleteFrom = prefix === " " ? from - 1 : from;

          chain()
            .deleteRange({ from: deleteFrom, to })
            .insertContent({
              type: this.name,
              attrs: { variant: "githubPull" satisfies GitHubEmbedVariant },
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
      insertGitHubGistBlock: () => ReturnType;
      insertGitHubIssueBlock: () => ReturnType;
      insertGitHubPullBlock: () => ReturnType;
    };
  }
}
