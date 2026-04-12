"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { DatabaseBlock } from "@/components/editor/extensions/DatabaseBlock";
import { CanvasBlock } from "@/components/editor/extensions/CanvasBlock";

interface EditorProps {
  content: object | null;
  editable?: boolean;
  onUpdate?: (content: object) => void;
  placeholder?: string;
  workspaceId?: string;
  pageId?: string;
}

export function Editor({
  content,
  editable = true,
  onUpdate,
  placeholder = "Type something...",
  workspaceId,
  pageId,
}: EditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder,
      }),
      DatabaseBlock.configure({
        workspaceId,
        pageId,
      }),
      CanvasBlock.configure({
        workspaceId,
        pageId,
      }),
    ],
    content: content || {
      type: "doc",
      content: [{ type: "paragraph" }],
    },
    editable,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        "data-testid": "workspace-editor-input",
        "aria-label": "Document editor",
      },
    },
    onUpdate: ({ editor }) => {
      if (onUpdate) {
        onUpdate(editor.getJSON());
      }
    },
  });

  if (!editor) {
    return null;
  }

  return (
    <div
      data-testid="workspace-editor"
      className={`editor prose prose-zinc dark:prose-invert max-w-none ${
        editable ? "cursor-text" : ""
      }`}
    >
      <EditorContent
        editor={editor}
        className="[&_.ProseMirror]:outline-none [&_.ProseMirror]:min-h-[200px] [&_.ProseMirror-focused]:outline-none [&_.ProseMirror-placeholder]:text-zinc-400 [&_.ProseMirror-placeholder]:before:content-[attr(data-placeholder)] [&_.ProseMirror-placeholder]:before:pointer-events-none"
      />
    </div>
  );
}
