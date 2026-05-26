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
 * Handles one-time reconciliation between persisted page content and the
 * collaborative Yjs document after the provider finishes syncing.
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

  // 협업 모드에서는 sync 전에 Yjs에 page content를 선주입하지 않는다.
  // 서버 persisted state가 뒤늦게 도착하면 같은 내용이 CRDT에서 별도 삽입으로 합쳐져
  // 새로고침 후 텍스트가 반복되는 문제가 생길 수 있다.
  // 따라서 sync 완료 뒤 현재 Yjs 문서 상태를 보고 한 번만 reconciliation 한다.
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
    // 협업 모드에서는 비어 있지 않은 Yjs 문서를 DB content로 다시 덮어쓰지 않는다.
    // persisted Yjs가 이미 내용을 갖고 있는데 setContent를 한 번 더 태우면
    // 새로고침 시 동일 문장이 아래에 중복 삽입되는 경우가 있다.
    const shouldRestoreFromPage = isEmpty && dbContent?.content && dbContent.content.length > 0;

    if (shouldRestoreFromPage) {
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
  }, [content, editor, isSynced, ydoc, isApplyingInitialContent]);
}
