import Collaboration from "@tiptap/extension-collaboration";
import Placeholder from "@tiptap/extension-placeholder";
import StarterKit from "@tiptap/starter-kit";
import { GroveCollaborationCursor } from "@/components/editor/extensions/GroveCollaborationCursor";
import { PersistentCursorPresenceExtension } from "@/components/editor/extensions/PersistentCursorPresenceExtension";
import { LinePresenceExtension } from "@/components/editor/extensions/LinePresenceExtension";
import { DatabaseBlock } from "@/components/editor/extensions/DatabaseBlock";
import { CanvasBlock } from "@/components/editor/extensions/CanvasBlock";
import { MindMapBlock } from "@/components/editor/extensions/MindMapBlock";
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
import { PageLinkExtension } from "@/components/editor/extensions/PageLinkExtension";
import { PageLinkMark } from "@/components/editor/extensions/PageMentionExtension";
import { DbDiagramExtension } from "@/src/components/editor/extensions/DbDiagramExtension";
import { SubPageBlock } from "@/components/editor/extensions/SubPageBlock";
import { BlockActionsExtension } from "@/components/editor/extensions/BlockActionsExtension";
import { TextHighlightMark } from "@/components/editor/extensions/TextHighlightMark";
import { TaskItem, TaskList } from "@/components/editor/extensions/TaskList";
import {
  ApiTesterBlock,
  AudioBlock,
  BookmarkBlock,
  FileDropBlock,
  GroveImageBlock,
  GitHubEmbedBlock,
  GroveTableBlock,
  LinkEmbedBlock,
  ToggleBlock,
  VideoBlock,
  WebClipBlock,
} from "@/components/editor/extensions/GroveInsertionBlocks";
import {
  useJungleCursor,
  type JungleCursorColorKey,
  type JungleCursorVariant,
} from "@/lib/cursor/jungleCursor";
import type * as Y from "yjs";
import type { WebsocketProvider } from "y-websocket";

interface GroveEditorExtensionsOptions {
  ydoc: Y.Doc | null | undefined;
  provider: WebsocketProvider | null | undefined;
  lineIndicatorEnabled: boolean;
  editable: boolean;
  placeholder: string;
  workspaceId?: string;
  pageId?: string;
  sessionUserName?: string;
  sessionUserEmail?: string;
  sessionUserImage?: string | null;
  userColor: (email: string) => string;
  onLinkDatabase: () => void;
  onInsertButton: () => void;
  onInsertPageLink: () => void;
  onInsertPageMention: () => void;
  onSlashCommandChange?: (query: string | null) => void;
  codeBlockExtension?: typeof CodeBlock;
  collaborationUser?: {
    name: string;
    color: string;
    image: string | null;
    cursorColorKey?: JungleCursorColorKey | null;
    cursorVariant?: JungleCursorVariant | null;
  };
}

export function createGroveEditorExtensions({
  ydoc,
  provider,
  lineIndicatorEnabled,
  editable,
  placeholder,
  workspaceId,
  pageId,
  sessionUserName,
  sessionUserEmail,
  sessionUserImage,
  userColor,
  onLinkDatabase,
  onInsertButton,
  onInsertPageLink,
  onInsertPageMention,
  onSlashCommandChange,
  codeBlockExtension = CodeBlock,
  collaborationUser,
}: GroveEditorExtensionsOptions) {
  return [
    StarterKit.configure(ydoc ? { undoRedo: false } : {}),
    Placeholder.configure({ placeholder }),
    TextHighlightMark,
    TaskList,
    TaskItem,
    ToggleBlock,
    ...(ydoc && provider
      ? [
          Collaboration.configure({ document: ydoc }),
          GroveCollaborationCursor.configure({
            awareness: provider.awareness,
            user: collaborationUser ?? {
              name: sessionUserName ?? "Anonymous",
              color: userColor(sessionUserEmail ?? ""),
              image: sessionUserImage ?? null,
            },
          }),
          PersistentCursorPresenceExtension.configure({
            awareness: provider.awareness,
          }),
          ...(lineIndicatorEnabled
            ? [
                LinePresenceExtension.configure({
                  awareness: provider.awareness,
                  localClientId: provider.awareness.clientID,
                }),
              ]
            : []),
        ]
      : []),
    DatabaseBlock.configure({ workspaceId, pageId }),
    CanvasBlock.configure({ workspaceId, pageId }),
    MindMapBlock.configure({ workspaceId, pageId }),
    ButtonBlock,
    codeBlockExtension,
    GroveColumn,
    ColumnLayoutBlock,
    MathBlock,
    LinkedDatabaseBlock.configure({ workspaceId, pageId }),
    GroveTableBlock,
    GroveImageBlock.configure({ pageId }),
    VideoBlock.configure({ pageId }),
    AudioBlock.configure({ pageId }),
    FileDropBlock.configure({ pageId }),
    BookmarkBlock,
    ApiTesterBlock,
    LinkEmbedBlock,
    GitHubEmbedBlock,
    WebClipBlock,
    CustomEmojiNode,
    PersonalEmojiExtension,
    DbDiagramExtension.configure({ workspaceId, pageId }),
    PageLinkExtension,
    PageLinkMark.configure({ workspaceId }),
    SubPageBlock,
    ...(editable ? [BlockActionsExtension] : []),
    ...(editable
      ? [
          SlashCommandExtension.configure({
            workspaceId,
            pageId,
            onLinkDatabase,
            onInsertButton,
            onInsertPageLink: onInsertPageLink,
            onInsertPageMention,
            onSlashCommandChange,
          }),
        ]
      : []),
  ];
}

export function useGroveEditorExtensions(options: GroveEditorExtensionsOptions) {
  const jungleCursor = useJungleCursor();

  return createGroveEditorExtensions({
    ...options,
    collaborationUser: {
      name: options.sessionUserName ?? "Anonymous",
      color: jungleCursor.color ?? options.userColor(options.sessionUserEmail ?? ""),
      image: options.sessionUserImage ?? null,
      cursorColorKey: jungleCursor.colorKey as JungleCursorColorKey,
      cursorVariant: jungleCursor.variant as JungleCursorVariant,
    },
  });
}
