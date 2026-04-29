import { Extension } from "@tiptap/core";
import { yCursorPlugin } from "@tiptap/y-tiptap";
import type { Awareness } from "y-protocols/awareness";

export interface GroveCollaborationCursorOptions {
  awareness: Awareness;
  user: { name: string; color: string };
}

// CollaborationCursor replacement that uses @tiptap/y-tiptap's yCursorPlugin.
// @tiptap/extension-collaboration-cursor uses the y-prosemirror plugin key,
// which is a different object from @tiptap/y-tiptap's key, causing a crash on init.
export const GroveCollaborationCursor =
  Extension.create<GroveCollaborationCursorOptions>({
    name: "groveCollaborationCursor",

    addOptions() {
      return {
        awareness: undefined as unknown as Awareness,
        user: { name: "Anonymous", color: "#958DF1" },
      };
    },

    addProseMirrorPlugins() {
      const { awareness, user } = this.options;
      return [
        yCursorPlugin(awareness, {
          cursorBuilder: (cursorUser: { name?: string; color?: string }) => {
            const name = cursorUser?.name ?? user.name;
            const color = cursorUser?.color ?? user.color;

            const caret = document.createElement("span");
            caret.classList.add("collaboration-cursor__caret");
            caret.setAttribute("style", `border-color: ${color}`);

            const label = document.createElement("div");
            label.classList.add("collaboration-cursor__label");
            label.setAttribute("style", `background-color: ${color}`);
            label.textContent = name;

            caret.appendChild(label);
            return caret;
          },
        }),
      ];
    },
  });
