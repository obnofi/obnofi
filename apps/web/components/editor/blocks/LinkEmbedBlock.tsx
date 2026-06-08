"use client";

import { useEffect, useMemo, useState } from "react";
import { Node, mergeAttributes } from "@tiptap/core";
import {
  NodeViewWrapper,
  ReactNodeViewRenderer,
  type ReactNodeViewProps,
} from "@tiptap/react";
import { ExternalLink, Globe, HardDrive, MessageSquare } from "lucide-react";
import { normalizeUrl } from "@/components/toolbar/LinkEmbedModal";

type LinkEmbedVariant = "embed" | "googleDrive" | "tweet";

type LinkEmbedAttrs = {
  url: string;
  variant: LinkEmbedVariant;
};

const LINK_EMBED_VARIANTS: Record<
  LinkEmbedVariant,
  {
    label: string;
    placeholder: string;
    icon: typeof Globe;
    hint: string;
  }
> = {
  embed: {
    label: "링크 임베드",
    placeholder: "https://example.com",
    icon: Globe,
    hint: "일반 URL을 카드처럼 임베드합니다.",
  },
  googleDrive: {
    label: "Google Drive",
    placeholder: "https://drive.google.com/file/d/...",
    icon: HardDrive,
    hint: "Drive 파일 또는 문서 링크를 임베드합니다.",
  },
  tweet: {
    label: "Tweet",
    placeholder: "https://x.com/... 또는 https://twitter.com/...",
    icon: MessageSquare,
    hint: "X/Twitter 게시물 링크를 임베드합니다.",
  },
};

function getLinkEmbedMeta(url: string, variant: LinkEmbedVariant) {
  try {
    const parsed = new URL(url);
    if (variant === "googleDrive") {
      return parsed.host.replace(/^www\./, "");
    }
    if (variant === "tweet") {
      const parts = parsed.pathname.split("/").filter(Boolean);
      const handle = parts[0] ? `@${parts[0]}` : parsed.host;
      return `${handle} · ${parsed.host.replace(/^www\./, "")}`;
    }
    return parsed.host.replace(/^www\./, "");
  } catch {
    return url;
  }
}

function LinkEmbedBlockView(props: ReactNodeViewProps) {
  const attrs = props.node.attrs as LinkEmbedAttrs;
  const variant = attrs.variant ?? "embed";
  const variantConfig = LINK_EMBED_VARIANTS[variant];
  const Icon = variantConfig.icon;
  const isEditable = props.editor.isEditable;
  const [draftUrl, setDraftUrl] = useState(attrs.url);
  const normalizedDraftUrl = useMemo(() => normalizeUrl(draftUrl), [draftUrl]);
  const meta = getLinkEmbedMeta(attrs.url, variant);

  useEffect(() => {
    setDraftUrl(attrs.url);
  }, [attrs.url]);

  return (
    <NodeViewWrapper
      className="not-prose my-4"
      contentEditable={false}
      onMouseDown={(event) => event.stopPropagation()}
      onClick={(event) => event.stopPropagation()}
    >
      <div className="grove-link-embed-block" data-testid={`link-embed-block-${variant}`}>
        {attrs.url ? (
          <a className="grove-link-embed" href={attrs.url} target="_blank" rel="noreferrer">
            <span className="grove-link-embed__icon">
              <Icon className="h-4 w-4" />
            </span>
            <span className="grove-link-embed__body">
              <span className="grove-link-embed__title">
                {variantConfig.label}
              </span>
              <span className="grove-link-embed__meta">{meta}</span>
              <span className="grove-link-embed__url">{attrs.url}</span>
            </span>
            <ExternalLink className="grove-link-embed__open h-3.5 w-3.5" />
          </a>
        ) : null}

        {isEditable ? (
          <div className="grove-link-embed__editor">
            <div className="grove-insert-block__header">
              <Icon className="h-4 w-4" />
              <span>{variantConfig.label}</span>
            </div>
            <input
              data-testid={`link-embed-input-${variant}`}
              className="grove-link-embed__input"
              type="url"
              value={draftUrl}
              placeholder={variantConfig.placeholder}
              onMouseDown={(event) => event.stopPropagation()}
              onChange={(event) => setDraftUrl(event.target.value)}
              onBlur={() => props.updateAttributes({ url: normalizedDraftUrl ?? "" })}
            />
            <p className="grove-link-embed__hint">{variantConfig.hint}</p>
          </div>
        ) : null}
      </div>
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
      variant: { default: "embed" },
    };
  },

  parseHTML() {
    return [{ tag: "div[data-type='link-embed-block']" }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, { "data-type": "link-embed-block" }),
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(LinkEmbedBlockView);
  },

  addCommands() {
    return {
      insertLinkEmbedBlock:
        (attrs?: Partial<LinkEmbedAttrs>) =>
        ({ commands }) =>
          commands.insertContent([
            {
              type: this.name,
              attrs: {
                url: attrs?.url ?? "",
                variant: attrs?.variant ?? "embed",
              },
            },
            { type: "paragraph" },
          ]),
      insertGoogleDriveBlock:
        (attrs?: Partial<LinkEmbedAttrs>) =>
        ({ commands }) =>
          commands.insertContent([
            {
              type: this.name,
              attrs: {
                url: attrs?.url ?? "",
                variant: "googleDrive",
              },
            },
            { type: "paragraph" },
          ]),
      insertTweetBlock:
        (attrs?: Partial<LinkEmbedAttrs>) =>
        ({ commands }) =>
          commands.insertContent([
            {
              type: this.name,
              attrs: {
                url: attrs?.url ?? "",
                variant: "tweet",
              },
            },
            { type: "paragraph" },
          ]),
    };
  },
});

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    linkEmbedBlock: {
      insertLinkEmbedBlock: (attrs?: Partial<LinkEmbedAttrs>) => ReturnType;
      insertGoogleDriveBlock: (attrs?: Partial<LinkEmbedAttrs>) => ReturnType;
      insertTweetBlock: (attrs?: Partial<LinkEmbedAttrs>) => ReturnType;
    };
  }
}
