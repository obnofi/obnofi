import { useEffect, useRef } from "react";
import type { Editor as TiptapEditor } from "@tiptap/react";
import type * as Y from "yjs";

function tiptapDocumentsMatch(a: object | null, b: object | null) {
  return JSON.stringify(a) === JSON.stringify(b);
}

interface UseEditorContentSyncOptions {
  editor: TiptapEditor | null;
  content: object | null;
  pageUpdatedAt?: string;
  yjsUpdatedAt?: string | null;
  ydoc: Y.Doc | null;
  isSynced: boolean;
  isApplyingInitialContent: React.MutableRefObject<boolean>;
}

/**
 * Handles seeding TipTap/Yjs content from the database page content on
 * initial mount — covering both the pre-sync window and the post-sync
 * reconciliation step.
 *
 * Returns refs that extension code can read to know whether a setContent
 * call is in-flight (used to suppress spurious onUpdate callbacks).
 */
export function useEditorContentSync({
  editor,
  content,
  pageUpdatedAt,
  yjsUpdatedAt,
  ydoc,
  isSynced,
  isApplyingInitialContent,
}: UseEditorContentSyncOptions) {
  const initialContentApplied = useRef(false);

  // 협업 문서가 비어 있거나 ws-server가 persisted Yjs를 복원하지 못한 경우,
  // page content를 먼저 Yjs 문서에 심어 문서가 빈 화면으로 열리지 않게 한다.
  useEffect(() => {
    if (!ydoc || initialContentApplied.current) return;
    if (!editor || !content) return;

    const pageUpdatedAtMs = pageUpdatedAt ? new Date(pageUpdatedAt).getTime() : 0;
    const yjsUpdatedAtMs = yjsUpdatedAt ? new Date(yjsUpdatedAt).getTime() : 0;
    const shouldSeedFromPage = !yjsUpdatedAt || pageUpdatedAtMs > yjsUpdatedAtMs;

    if (!shouldSeedFromPage) {
      return;
    }

    const editorJson = editor.getJSON() as {
      content?: Array<{ type?: string; content?: unknown[] }>;
    };
    const docContent = editorJson.content ?? [];
    const isEmpty =
      docContent.length === 0 ||
      (docContent.length === 1 &&
        docContent[0]?.type === "paragraph" &&
        !docContent[0]?.content?.length);

    const dbContent = content as { content?: unknown[] };
    if (!isEmpty || !dbContent.content?.length) {
      return;
    }

    initialContentApplied.current = true;
    isApplyingInitialContent.current = true;
    editor.commands.setContent(content);
    setTimeout(() => {
      isApplyingInitialContent.current = false;
    }, 0);
  }, [content, editor, pageUpdatedAt, ydoc, yjsUpdatedAt, isApplyingInitialContent]);

  // 협업 모드: sync 완료 후 Yjs 문서가 비어있으면 DB content로 초기화
  useEffect(() => {
    if (!isSynced || !ydoc || initialContentApplied.current) return;
    if (!editor || !content) return;

    const editorJson = editor.getJSON();
    if (tiptapDocumentsMatch(editorJson as object, content)) {
      initialContentApplied.current = true;
      return;
    }

    const docContent = editorJson.content ?? [];
    const isEmpty =
      docContent.length === 0 ||
      (docContent.length === 1 &&
        docContent[0].type === "paragraph" &&
        !docContent[0].content?.length);

    const dbContent = content as { content?: unknown[] };
    const pageUpdatedAtMs = pageUpdatedAt ? new Date(pageUpdatedAt).getTime() : 0;
    const yjsUpdatedAtMs = yjsUpdatedAt ? new Date(yjsUpdatedAt).getTime() : 0;
    const shouldRestoreFromPage =
      pageUpdatedAtMs > yjsUpdatedAtMs ||
      (isEmpty && dbContent?.content && dbContent.content.length > 0);

    if (shouldRestoreFromPage && dbContent?.content && dbContent.content.length > 0) {
      initialContentApplied.current = true;
      isApplyingInitialContent.current = true;
      editor.commands.setContent(content);
      setTimeout(() => {
        isApplyingInitialContent.current = false;
      }, 0);
    } else {
      initialContentApplied.current = true;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [content, editor, isSynced, pageUpdatedAt, ydoc, yjsUpdatedAt, isApplyingInitialContent]);
}
