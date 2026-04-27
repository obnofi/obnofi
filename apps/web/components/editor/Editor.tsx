"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import "tippy.js/dist/tippy.css";
import { DatabaseBlock } from "@/components/editor/extensions/DatabaseBlock";
import { CanvasBlock } from "@/components/editor/extensions/CanvasBlock";
import { ButtonBlock } from "@/components/editor/extensions/ButtonBlock";
import { CodeBlock } from "@/components/editor/extensions/CodeBlock";
import {
  ColumnLayoutBlock,
  GroveColumn,
} from "@/components/editor/extensions/ColumnLayoutBlock";
import { LinkedDatabaseBlock } from "@/components/editor/extensions/LinkedDatabaseBlock";
import { MathBlock } from "@/components/editor/extensions/MathBlock";
import { SlashCommandExtension } from "@/components/editor/extensions/SlashCommandExtension";
import {
  CustomEmojiNode,
  PersonalEmojiExtension,
} from "@/components/editor/extensions/PersonalEmojiExtension";
import { LinkDatabaseModal } from "@/components/editor/extensions/LinkDatabaseModal";
import { ButtonInsertModal } from "@/components/editor/extensions/ButtonInsertModal";
import { PageLinkModal } from "@/components/editor/extensions/PageLinkModal";
import { PageLinkExtension } from "@/components/editor/extensions/PageLinkExtension";
import { PageLinkMark } from "@/components/editor/extensions/PageMentionExtension";
import { DbDiagramExtension } from "@/src/components/editor/extensions/DbDiagramExtension";
import { SubPageBlock } from "@/components/editor/extensions/SubPageBlock";
import { BlockActionsExtension } from "@/components/editor/extensions/BlockActionsExtension";
import { BlockActionBar } from "@/components/editor/BlockActionBar";
import { SpeechRecognitionButton } from "@/components/editor/SpeechRecognitionButton";
import { SpeechInputIndicator } from "@/components/editor/SpeechInputIndicator";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import type { Editor as TiptapEditor } from "@tiptap/core";

interface EditorProps {
  content: object | null;
  editable?: boolean;
  onUpdate?: (content: object) => void;
  placeholder?: string;
  workspaceId?: string;
  pageId?: string;
  onContentContainerReady?: (node: HTMLDivElement | null) => void;
}

export function Editor({
  content,
  editable = true,
  onUpdate,
  placeholder = "Type something...",
  workspaceId,
  pageId,
  onContentContainerReady,
}: EditorProps) {
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [isButtonModalOpen, setIsButtonModalOpen] = useState(false);
  const [isPageLinkModalOpen, setIsPageLinkModalOpen] = useState(false);
  const editorRef = useRef<TiptapEditor | null>(null);
  const editorShellRef = useRef<HTMLDivElement | null>(null);
  const onUpdateRef = useRef(onUpdate);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSpeechFinalResult = useCallback((text: string) => {
    editorRef.current?.chain().focus().insertContent(text).run();
  }, []);

  const { interimTranscript, isListening, isSupported, start, stop } =
    useSpeechRecognition({ onFinalResult: handleSpeechFinalResult });

  useEffect(() => {
    onUpdateRef.current = onUpdate;
  }, [onUpdate]);

  const handleDatabaseSelect = useCallback(
    (databaseId: string, selectedPageId: string) => {
      const editor = editorRef.current;
      if (!editor) return;

      editor
        .chain()
        .focus()
        .insertContent({
          type: "linkedDatabaseEmbed",
          attrs: {
            databaseId,
            pageId: selectedPageId,
            workspaceId: workspaceId ?? null,
          },
        })
        .run();
    },
    [workspaceId]
  );

  const handleOpenLinkModal = useCallback(() => {
    setIsLinkModalOpen(true);
  }, []);

  const handleOpenButtonModal = useCallback(() => {
    setIsButtonModalOpen(true);
  }, []);

  const handleOpenPageLinkModal = useCallback(() => {
    setIsPageLinkModalOpen(true);
  }, []);

  const handleButtonInsert = useCallback((label: string, url: string) => {
    editorRef.current?.commands.insertButtonBlock({ label, url });
  }, []);

  const handlePageLinkInsert = useCallback(
    (selectedPageId: string, selectedPageTitle: string) => {
      editorRef.current?.commands.insertPageLink({
        pageId: selectedPageId,
        pageTitle: selectedPageTitle,
        workspaceId: workspaceId ?? "",
      });
    },
    [workspaceId]
  );

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
      ButtonBlock,
      CodeBlock,
      GroveColumn,
      ColumnLayoutBlock,
      MathBlock,
      LinkedDatabaseBlock.configure({
        workspaceId,
        pageId,
      }),
      CustomEmojiNode,
      PersonalEmojiExtension,
      DbDiagramExtension.configure({
        workspaceId,
        pageId,
      }),
      PageLinkExtension,
      PageLinkMark.configure({ workspaceId }),
      SubPageBlock,
      ...(editable ? [BlockActionsExtension] : []),
      SlashCommandExtension.configure({
        workspaceId,
        pageId,
        onLinkDatabase: handleOpenLinkModal,
        onInsertButton: handleOpenButtonModal,
        onInsertPageLink: handleOpenPageLinkModal,
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
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = setTimeout(() => {
        onUpdateRef.current?.(editor.getJSON());
      }, 500);
    },
  });

  editorRef.current = editor ?? null;

  if (!editor) {
    return null;
  }

  return (
    <>
      <div
        data-testid="workspace-editor"
        ref={(node) => {
          editorShellRef.current = node;
          onContentContainerReady?.(node);
        }}
        className={`editor prose max-w-none text-[#111110] dark:prose-invert dark:text-zinc-100 [&:focus-within]:outline-none [&_*]:focus-visible:outline-none ${
          editable ? "cursor-text" : ""
        }`}
      >
        {/* not-prose: Tailwind Typography 스타일이 툴바에 영향주지 않도록 격리 */}
        {editable && (
          <div className="not-prose flex justify-end pb-1">
            <SpeechRecognitionButton
              isListening={isListening}
              isSupported={isSupported}
              onToggle={isListening ? stop : start}
            />
          </div>
        )}
        <EditorContent
          editor={editor}
          className="[&_.ProseMirror]:min-h-[200px] [&_.ProseMirror]:text-[#111110] [&_.ProseMirror]:outline-none dark:[&_.ProseMirror]:text-zinc-100 [&_.ProseMirror-focused]:outline-none [&_.ProseMirror-focused]:ring-0 [&_.ProseMirror-focused]:border-transparent [&_.ProseMirror-placeholder]:text-zinc-400 [&_.ProseMirror-placeholder]:before:content-[attr(data-placeholder)] [&_.ProseMirror-placeholder]:before:pointer-events-none"
        />
        {editable ? (
          <BlockActionBar editor={editor} container={editorShellRef.current} />
        ) : null}
        <SpeechInputIndicator
          isListening={isListening}
          interimTranscript={interimTranscript}
        />
      </div>

      <LinkDatabaseModal
        isOpen={isLinkModalOpen}
        onClose={() => setIsLinkModalOpen(false)}
        onSelect={handleDatabaseSelect}
        workspaceId={workspaceId ?? ""}
      />
      <ButtonInsertModal
        isOpen={isButtonModalOpen}
        onClose={() => setIsButtonModalOpen(false)}
        onConfirm={handleButtonInsert}
      />
      <PageLinkModal
        isOpen={isPageLinkModalOpen}
        onClose={() => setIsPageLinkModalOpen(false)}
        onSelect={handlePageLinkInsert}
        workspaceId={workspaceId ?? ""}
      />
    </>
  );
}
