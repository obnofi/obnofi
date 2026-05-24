"use client";

import { Node, mergeAttributes } from "@tiptap/core";
import {
  NodeViewWrapper,
  ReactNodeViewRenderer,
  type ReactNodeViewProps,
} from "@tiptap/react";
import { FileText } from "lucide-react";

type FileDropAttrs = {
  files: Array<{ name: string; size: number; type: string }>;
};

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function FileDropBlockView(props: ReactNodeViewProps) {
  const attrs = props.node.attrs as FileDropAttrs;
  const files = attrs.files ?? [];

  return (
    <NodeViewWrapper
      className="not-prose my-4"
      contentEditable={false}
      onMouseDown={(event) => event.stopPropagation()}
      onClick={(event) => event.stopPropagation()}
    >
      <div className="grove-insert-block">
        <div className="grove-insert-block__header">
          <FileText className="h-4 w-4" />
        </div>
        {files.length ? (
          <div className="grove-file-list">
            {files.map((file, index) => (
              <div className="grove-file-list__item" key={`${file.name}-${index}`}>
                <span className="truncate">{file.name}</span>
                <span>{formatFileSize(file.size)}</span>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </NodeViewWrapper>
  );
}

export const FileDropBlock = Node.create({
  name: "fileDropBlock",
  group: "block",
  atom: true,
  selectable: true,
  draggable: true,

  addAttributes() {
    return {
      files: { default: [] },
    };
  },

  parseHTML() {
    return [{ tag: "div[data-type='file-drop-block']" }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, { "data-type": "file-drop-block" }),
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(FileDropBlockView);
  },

  addCommands() {
    return {
      insertFileDropBlock:
        (attrs?: FileDropAttrs) =>
        ({ commands }) =>
          commands.insertContent({
            type: this.name,
            attrs: { files: attrs?.files ?? [] },
          }),
    };
  },
});

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    fileDropBlock: {
      insertFileDropBlock: (attrs?: FileDropAttrs) => ReturnType;
    };
  }
}
