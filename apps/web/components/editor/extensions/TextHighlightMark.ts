import { Mark, mergeAttributes } from "@tiptap/core";
import type { PageHighlightColor } from "@obnofi/types";
import {
  PAGE_HIGHLIGHT_BG_COLORS,
  PAGE_HIGHLIGHT_TEXT_COLORS,
} from "@/lib/highlightColors";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    textHighlight: {
      setTextHighlight: (attributes: { color: PageHighlightColor }) => ReturnType;
      unsetTextHighlight: () => ReturnType;
    };
  }
}

export const TextHighlightMark = Mark.create({
  name: "textHighlight",

  addAttributes() {
    return {
      color: {
        default: "yellow",
        parseHTML: (element) => element.getAttribute("data-highlight-color") ?? "yellow",
        renderHTML: (attributes) => ({
          "data-highlight-color": attributes.color,
          style: `background-color: ${
            PAGE_HIGHLIGHT_BG_COLORS[attributes.color as PageHighlightColor] ?? PAGE_HIGHLIGHT_BG_COLORS.yellow
          }; color: ${
            PAGE_HIGHLIGHT_TEXT_COLORS[attributes.color as PageHighlightColor] ?? PAGE_HIGHLIGHT_TEXT_COLORS.yellow
          };`,
        }),
      },
    };
  },

  parseHTML() {
    return [{ tag: "span[data-highlight-color]" }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "span",
      mergeAttributes(
        {
          class: "grove-text-highlight",
        },
        HTMLAttributes
      ),
      0,
    ];
  },

  addCommands() {
    return {
      setTextHighlight:
        (attributes) =>
        ({ commands }) =>
          commands.setMark(this.name, attributes),
      unsetTextHighlight:
        () =>
        ({ commands }) =>
          commands.unsetMark(this.name),
    };
  },
});
