import { Extension } from "@tiptap/core";
import { yCursorPlugin } from "@tiptap/y-tiptap";
import type { Awareness } from "y-protocols/awareness";

export interface GroveCollaborationCursorOptions {
  awareness: Awareness;
  user: { name: string; color: string; image?: string | null };
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
        user: { name: "Anonymous", color: "#958DF1", image: null },
      };
    },

    addProseMirrorPlugins() {
      const { awareness, user } = this.options;
      return [
        yCursorPlugin(awareness, {
          cursorBuilder: (cursorUser: { name?: string; color?: string; image?: string | null }) => {
            const name = cursorUser?.name ?? user.name;
            const color = cursorUser?.color ?? user.color;
            const image = cursorUser?.image ?? user.image ?? null;

            const caret = document.createElement("span");
            caret.classList.add("collaboration-cursor__caret");
            caret.setAttribute("style", `border-color: ${color}`);

            const badge = document.createElement("div");
            badge.classList.add("collaboration-cursor__badge");
            badge.setAttribute("style", `--cursor-color: ${color}`);
            badge.setAttribute("title", name);

            if (image) {
              const avatar = document.createElement("img");
              avatar.classList.add("collaboration-cursor__avatar");
              avatar.setAttribute("src", image);
              avatar.setAttribute("alt", name);
              badge.appendChild(avatar);
            } else {
              const initials = document.createElement("span");
              initials.classList.add("collaboration-cursor__initial");
              initials.textContent = name.charAt(0).toUpperCase();
              badge.appendChild(initials);
            }

            const label = document.createElement("div");
            label.classList.add("collaboration-cursor__label");
            label.textContent = name;

            badge.appendChild(label);
            caret.appendChild(badge);
            return caret;
          },
        }),
      ];
    },
  });
