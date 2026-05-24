import { Extension } from "@tiptap/core";
import Suggestion from "@tiptap/suggestion";
import { createSlashSuggestion } from "./SlashSuggestion";
import { getSlashCommandItems } from "@/lib/editor/slashCommandData";

export type { SlashCommandItem, SlashCommandCategory } from "@/lib/editor/slashCommandTypes";
export {
  SUPPORTED_BASIC_MARKDOWN_COMMAND_IDS,
  CATEGORIES,
  slashCommands,
  isVisibleSlashCommandItem,
  getSlashCommandItems,
} from "@/lib/editor/slashCommandData";

export const SlashCommandExtension = Extension.create({
  name: "slashCommand",

  addOptions() {
    return {
      workspaceId: undefined as string | undefined,
      pageId: undefined as string | undefined,
      onLinkDatabase: undefined as (() => void) | undefined,
      onInsertButton: undefined as (() => void) | undefined,
      onInsertPageLink: undefined as (() => void) | undefined,
    };
  },

  addProseMirrorPlugins() {
    const { workspaceId, pageId, onLinkDatabase, onInsertButton, onInsertPageLink } = this.options;
    return [
      Suggestion({
        editor: this.editor,
        char: "/",
        allowSpaces: false,
        startOfLine: false,
        items: ({ query }) => getSlashCommandItems(query),
        render: createSlashSuggestion(workspaceId, pageId, onLinkDatabase, onInsertButton, onInsertPageLink),
      }),
    ];
  },
});
