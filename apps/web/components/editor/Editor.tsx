"use client";

import { useState, useCallback, useRef, useEffect, useMemo, type CSSProperties, type Ref, type RefObject } from "react";
import { useEditor, EditorContent, type Editor as TiptapEditor } from "@tiptap/react";
import { useCollaboration, userColor } from "@/lib/collaboration/CollaborationContext";
import "tippy.js/dist/tippy.css";
import { useSession } from "next-auth/react";
import { LinkDatabaseModal } from "@/components/editor/extensions/LinkDatabaseModal";
import { ButtonInsertModal } from "@/components/editor/extensions/ButtonInsertModal";
import { PageLinkModal } from "@/components/editor/extensions/PageLinkModal";
import { BlockActionBar } from "@/components/editor/BlockActionBar";
import { CollaboratorBlockAvatars } from "@/components/editor/CollaboratorBlockAvatars";
import { TextHighlightToolbar } from "@/components/editor/TextHighlightToolbar";
import { RemotePageCursors } from "@/components/editor/RemotePageCursors";
import { SlashCommandBroadcast } from "@/components/editor/SlashCommandBroadcast";
import { CursorChat } from "@/components/canvas/CursorChat";
import {
  MossNoteDock,
  type MossNoteDockHandle,
} from "@/components/workspace/MossNoteDock";
import { useEditorContentSync } from "@/hooks/useEditorContentSync";
import { useCursorChat } from "@/hooks/useCursorChat";
import { useGroveEditorExtensions } from "@/hooks/useGroveEditorExtensions";
import { usePageCursorTracking } from "@/hooks/usePageCursorTracking";
import { useJungleCursor } from "@/lib/cursor/jungleCursor";
import type { PageHeadingFontSizes, PageHighlightColor } from "@obnofi/types";
import type { MossNoteAnchor } from "@/lib/moss-notes";
import type { ParrotListeningState } from "@/hooks/useSpeechRecognition";
import type { Editor as TiptapEditorWithCommands } from "@tiptap/core";
import { usePageStore } from "@/store/pageStore";

declare global {
  interface Window {
    __obnofiEditor?: TiptapEditorWithCommands | null;
  }
}

interface EditorProps {
  content: object | null;
  bodyFontSizePt?: number;
  headingFontSizes?: PageHeadingFontSizes;
  highlightColors?: PageHighlightColor[];
  pageUpdatedAt?: string;
  yjsUpdatedAt?: string | null;
  editable?: boolean;
  lineIndicatorEnabled?: boolean;
  /** 에디터 내용 변경 시 호출 — 최신 JSON content 전달 */
  onUpdate?: (content: object) => void;
  /** 변경 발생 알림 (자동저장 트리거용) */
  onEdit?: () => void;
  placeholder?: string;
  workspaceId?: string;
  pageId?: string;
  onContentContainerReady?: (node: HTMLDivElement | null) => void;
  onEditorReady?: (editor: TiptapEditor | null) => void;
  interimTranscript?: string;
  isSpeechListening?: boolean;
  speechListeningState?: ParrotListeningState;
  mossNoteDockRef?: Ref<MossNoteDockHandle>;
  mossNoteSurfaceRef?: RefObject<HTMLElement>;
}

type EditorJsonNode = {
  type?: string;
  attrs?: {
    pageId?: string | null;
    isInlinePage?: boolean;
  };
  content?: EditorJsonNode[];
};

const INLINE_OWNED_PAGE_NODE_TYPES = new Set([
  "canvasEmbed",
  "databaseNode",
  "subPageEmbed",
  "mindMapEmbed",
]);

function collectInlineOwnedPageIds(node: EditorJsonNode | null | undefined, ids: Set<string>) {
  if (!node) {
    return ids;
  }

  if (
    node.type &&
    INLINE_OWNED_PAGE_NODE_TYPES.has(node.type) &&
    node.attrs?.pageId &&
    node.attrs.isInlinePage !== false
  ) {
    ids.add(node.attrs.pageId);
  }

  node.content?.forEach((child) => {
    collectInlineOwnedPageIds(child, ids);
  });

  return ids;
}

function isCursorChatShortcutBlocked(
  activeElement: Element | null,
  editorShell: HTMLDivElement | null
) {
  if (!activeElement) {
    return false;
  }

  if (activeElement.getAttribute("data-testid") === "workspace-page-title") {
    return false;
  }

  if (
    activeElement.closest(
      "input, textarea, select, button, dialog, [role='dialog'], [contenteditable='true'], [data-grove-dropdown-portal='true']"
    )
  ) {
    return true;
  }

  if (editorShell?.contains(activeElement)) {
    return true;
  }

  if (
    activeElement.closest(
      "[data-testid^='db-cell-'], [data-testid='workspace-editor-input']"
    )
  ) {
    return true;
  }

  return false;
}

export function Editor({
  content,
  bodyFontSizePt = 12,
  headingFontSizes = { h1: 30, h2: 23, h3: 18, h4: 16, h5: 14 },
  highlightColors = ["yellow", "green", "blue", "pink"],
  pageUpdatedAt,
  yjsUpdatedAt,
  editable = true,
  lineIndicatorEnabled = false,
  onUpdate,
  onEdit,
  placeholder = "Type something...",
  workspaceId,
  pageId,
  onContentContainerReady,
  onEditorReady,
  mossNoteDockRef,
  mossNoteSurfaceRef,
}: EditorProps) {
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [isButtonModalOpen, setIsButtonModalOpen] = useState(false);
  const [isPageLinkModalOpen, setIsPageLinkModalOpen] = useState(false);
  const [isPageMentionModalOpen, setIsPageMentionModalOpen] = useState(false);
  const editorRef = useRef<TiptapEditor | null>(null);
  const editorShellRef = useRef<HTMLDivElement | null>(null);
  const onUpdateRef = useRef(onUpdate);
  const onEditRef = useRef(onEdit);
  const jungleCursor = useJungleCursor();
  const deletePage = usePageStore((state) => state.deletePage);
  const previousDocumentRef = useRef<EditorJsonNode | null>(
    (content as EditorJsonNode | null) ?? null
  );
  const lastDeletionKeyRef = useRef<{ key: "Backspace" | "Delete"; at: number } | null>(null);

  const { data: session } = useSession();
  const { ydoc, provider, isSynced, awarenessStates, localUserId, updateCursor } = useCollaboration();
  const localClientId = provider?.awareness.clientID ?? null;

  const handleEditorShellRef = useCallback(
    (node: HTMLDivElement | null) => {
      editorShellRef.current = node;
      onContentContainerReady?.(node);
    },
    [onContentContainerReady]
  );

  useEffect(() => { onUpdateRef.current = onUpdate; }, [onUpdate]);
  useEffect(() => { onEditRef.current = onEdit; }, [onEdit]);
  useEffect(() => { onEditorReady?.(editorRef.current); }, [onEditorReady]);
  const isApplyingInitialContent = useRef(false);

  const handleOpenLinkModal = useCallback(() => setIsLinkModalOpen(true), []);
  const handleOpenButtonModal = useCallback(() => setIsButtonModalOpen(true), []);
  const handleOpenPageLinkModal = useCallback(() => setIsPageLinkModalOpen(true), []);
  const handleOpenPageMentionModal = useCallback(() => setIsPageMentionModalOpen(true), []);

  const handleSlashCommandChange = useCallback(
    (query: string | null) => {
      if (!provider) return;
      provider.awareness.setLocalStateField(
        "slashCommand",
        query !== null ? { query } : null
      );
    },
    [provider]
  );

  const extensions = useGroveEditorExtensions({
    ydoc,
    provider,
    lineIndicatorEnabled,
    editable,
    placeholder,
    workspaceId,
    pageId,
    sessionUserName: session?.user?.name ?? undefined,
    sessionUserEmail: session?.user?.email ?? undefined,
    sessionUserImage: session?.user?.image ?? null,
    userColor,
    onLinkDatabase: handleOpenLinkModal,
    onInsertButton: handleOpenButtonModal,
    onInsertPageLink: handleOpenPageLinkModal,
    onInsertPageMention: handleOpenPageMentionModal,
    onSlashCommandChange: provider ? handleSlashCommandChange : undefined,
  });

  const handleDatabaseSelect = useCallback(
    (databaseId: string, selectedPageId: string) => {
      editorRef.current
        ?.chain()
        .focus()
        .insertContent({
          type: "linkedDatabaseEmbed",
          attrs: { databaseId, pageId: selectedPageId, workspaceId: workspaceId ?? null },
        })
        .run();
    },
    [workspaceId]
  );

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

  const handlePageMentionInsert = useCallback(
    (selectedPageId: string, selectedPageTitle: string) => {
      editorRef.current?.commands.insertPageMention({
        pageId: selectedPageId,
        pageTitle: selectedPageTitle,
      });
    },
    []
  );

  const getMossNoteAnchor = useCallback((): MossNoteAnchor => {
    const activeEditor = editorRef.current;
    if (!activeEditor) return { kind: "page" };
    const { from, to, empty } = activeEditor.state.selection;
    if (empty) return { kind: "page" };
    const quote = activeEditor.state.doc.textBetween(from, to, " ").trim();
    if (!quote) return { kind: "page" };
    return { kind: "selection", quote, from, to };
  }, []);

  const revealMossNoteAnchor = useCallback((anchor: MossNoteAnchor) => {
    const activeEditor = editorRef.current;
    if (!activeEditor || anchor.kind !== "selection") return;
    const docSize = activeEditor.state.doc.content.size;
    const from = Math.max(1, Math.min(anchor.from ?? 1, docSize));
    const to = Math.max(from, Math.min(anchor.to ?? from, docSize));
    activeEditor.chain().focus().setTextSelection({ from, to }).scrollIntoView().run();
  }, []);

  const editor = useEditor({
    extensions,
    content: ydoc
      ? undefined
      : content || { type: "doc", content: [{ type: "paragraph" }] },
    editable,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        "data-testid": "workspace-editor-input",
        "aria-label": "Document editor",
      },
      handleKeyDown: (_view, event) => {
        if (event.key === "Backspace" || event.key === "Delete") {
          lastDeletionKeyRef.current = { key: event.key, at: Date.now() };
        }
        return false;
      },
    },
    onUpdate: ({ editor }) => {
      if (isApplyingInitialContent.current) return;
      const json = editor.getJSON();
      const previousJson = previousDocumentRef.current;
      const lastDeletionKey = lastDeletionKeyRef.current;

      if (previousJson && lastDeletionKey && Date.now() - lastDeletionKey.at < 1500) {
        const previousPageIds = collectInlineOwnedPageIds(previousJson, new Set<string>());
        const nextPageIds = collectInlineOwnedPageIds(json as EditorJsonNode, new Set<string>());

        previousPageIds.forEach((pageId) => {
          if (!nextPageIds.has(pageId)) {
            void deletePage(pageId);
          }
        });
      }

      previousDocumentRef.current = json as EditorJsonNode;
      onUpdateRef.current?.(json);
      onEditRef.current?.();
    },
  });

  editorRef.current = editor ?? null;

  useEditorContentSync({
    editor,
    content,
    pageUpdatedAt,
    yjsUpdatedAt,
    ydoc: ydoc ?? null,
    isSynced,
    isApplyingInitialContent,
  });

  useEffect(() => {
    onEditorReady?.(editor ?? null);
    return () => onEditorReady?.(null);
  }, [editor, onEditorReady]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.__obnofiEditor = editor ?? null;
    return () => {
      if (window.__obnofiEditor === editor) {
        window.__obnofiEditor = null;
      }
    };
  }, [editor]);

  useEffect(() => {
    if (!editor) {
      previousDocumentRef.current = (content as EditorJsonNode | null) ?? null;
      return;
    }

    previousDocumentRef.current = editor.getJSON() as EditorJsonNode;
  }, [content, editor, pageId, pageUpdatedAt, yjsUpdatedAt]);

  useEffect(() => {
    return () => {
      const shell = editorShellRef.current;
      if (!shell) return;
      shell
        .querySelectorAll(".collaboration-cursor__caret")
        .forEach((node) => node.remove());
    };
  }, []);

  const { localPageCursor, remotePageCursors, handlePagePointerMove, clearPagePointer } = usePageCursorTracking({
    ydoc,
    provider,
    pageId,
    localUserId,
    awarenessStates,
    updateCursor,
    editorShellRef,
  });
  const {
    draft: cursorChatDraft,
    isFadingOut: isCursorChatFadingOut,
    isOpen: isCursorChatOpen,
    maxLength: cursorChatMaxLength,
    message: cursorChatMessage,
    openCursorChat,
    resetCursorChat,
    submitCursorChat,
    updateDraft: updateCursorChatDraft,
  } = useCursorChat(provider);

  const localCursorChatPosition = useMemo(() => {
    if (localPageCursor) return localPageCursor;
    const shell = editorShellRef.current;
    if (!shell) return null;
    return {
      x: Math.min(24, shell.clientWidth),
      y: Math.min(24, shell.clientHeight),
    };
  }, [localPageCursor]);

  useEffect(() => {
    if (!editable || !provider || !pageId) {
      return;
    }

    const handleGlobalCursorChatTrigger = (event: globalThis.KeyboardEvent) => {
      if (event.defaultPrevented || event.repeat || event.key !== "/") return;
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (isCursorChatShortcutBlocked(document.activeElement, editorShellRef.current)) return;

      event.preventDefault();
      openCursorChat();
    };

    document.addEventListener("keydown", handleGlobalCursorChatTrigger);
    return () => {
      document.removeEventListener("keydown", handleGlobalCursorChatTrigger);
    };
  }, [editable, openCursorChat, pageId, provider]);

  if (!editor) return null;

  return (
    <>
      <div
        data-testid="workspace-editor"
        ref={handleEditorShellRef}
        style={
          {
            "--grove-body-font-size": `${bodyFontSizePt}pt`,
            "--grove-h1-font-size": `${headingFontSizes.h1}pt`,
            "--grove-h2-font-size": `${headingFontSizes.h2}pt`,
            "--grove-h3-font-size": `${headingFontSizes.h3}pt`,
            "--grove-h4-font-size": `${headingFontSizes.h4}pt`,
            "--grove-h5-font-size": `${headingFontSizes.h5}pt`,
            cursor: jungleCursor.cursorCss,
          } as CSSProperties
        }
        className={`editor relative prose max-w-none text-[#111110] dark:prose-invert dark:text-zinc-100 [&:focus-within]:outline-none [&_*]:focus-visible:outline-none ${
          editable ? "cursor-text" : ""
        } ${lineIndicatorEnabled && ydoc ? "pl-4" : ""}`}
        onPointerMove={handlePagePointerMove}
        onPointerLeave={clearPagePointer}
      >
        <EditorContent
          editor={editor}
          className="[&_.ProseMirror]:min-h-[200px] [&_.ProseMirror]:text-[#111110] [&_.ProseMirror]:outline-none dark:[&_.ProseMirror]:text-zinc-100 [&_.ProseMirror-focused]:outline-none [&_.ProseMirror-focused]:ring-0 [&_.ProseMirror-focused]:border-transparent [&_.ProseMirror-placeholder]:text-zinc-400 [&_.ProseMirror-placeholder]:before:content-[attr(data-placeholder)] [&_.ProseMirror-placeholder]:before:pointer-events-none"
        />
        {editable ? (
          <BlockActionBar editor={editor} container={editorShellRef.current} />
        ) : null}
        {editable ? (
          <TextHighlightToolbar editor={editor} colors={highlightColors} />
        ) : null}
        {ydoc && provider ? (
          <CollaboratorBlockAvatars editor={editor} container={editorShellRef.current} />
        ) : null}
        <RemotePageCursors states={remotePageCursors} />
        {ydoc && provider ? (
          <SlashCommandBroadcast
            awarenessStates={awarenessStates}
            localClientId={localClientId}
          />
        ) : null}
        {localCursorChatPosition && (isCursorChatOpen || cursorChatMessage) ? (
          <CursorChat
            color={jungleCursor.color}
            cursor={localCursorChatPosition}
            draft={cursorChatDraft}
            isFadingOut={isCursorChatFadingOut}
            isEditing={isCursorChatOpen}
            maxLength={cursorChatMaxLength}
            message={cursorChatMessage}
            onCancel={resetCursorChat}
            onChange={updateCursorChatDraft}
            onSubmit={submitCursorChat}
          />
        ) : null}
      </div>

      {editable && pageId ? (
        <MossNoteDock
          ref={mossNoteDockRef}
          pageId={pageId}
          surfaceRef={mossNoteSurfaceRef ?? editorShellRef}
          getAnchor={getMossNoteAnchor}
          onRevealAnchor={revealMossNoteAnchor}
        />
      ) : null}

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
      <PageLinkModal
        isOpen={isPageMentionModalOpen}
        onClose={() => setIsPageMentionModalOpen(false)}
        onSelect={handlePageMentionInsert}
        workspaceId={workspaceId ?? ""}
        mode="pageMention"
      />
    </>
  );
}
