import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";
import type { Awareness } from "y-protocols/awareness";

const pluginKey = new PluginKey<DecorationSet>("linePresence");

const REFRESH_META = "linePresenceRefresh";

interface AwarenessUser {
  color?: string;
}

interface AwarenanceCursorData {
  anchor?: number;
  head?: number;
}

export interface LinePresenceOptions {
  awareness: Awareness | null;
  localClientId: number | null;
}

function buildDecorations(
  doc: import("@tiptap/pm/model").Node,
  awareness: Awareness,
  localClientId: number | null
): DecorationSet {
  const decorations: Decoration[] = [];

  const states = awareness.getStates() as Map<
    number,
    { user?: AwarenessUser; cursor?: AwarenanceCursorData | null }
  >;

  states.forEach((state, clientId) => {
    if (clientId === localClientId) return;
    const cursor = state.cursor;
    const user = state.user;
    if (!cursor || !user?.color) return;

    const pos = Math.min(cursor.anchor ?? 0, cursor.head ?? 0);
    const safePos = Math.max(0, Math.min(pos, doc.content.size - 1));

    try {
      const $pos = doc.resolve(safePos);
      const depth = Math.min(1, $pos.depth);
      if (depth < 1) return;
      const nodeStart = $pos.before(depth);
      const node = $pos.node(depth);
      if (!node) return;

      decorations.push(
        Decoration.node(nodeStart, nodeStart + node.nodeSize, {
          class: "line-presence-block",
          style: `--line-presence-color: ${user.color}`,
        })
      );
    } catch {
      // 범위를 벗어난 포지션은 무시
    }
  });

  return DecorationSet.create(doc, decorations);
}

export const LinePresenceExtension = Extension.create<LinePresenceOptions>({
  name: "linePresence",

  addOptions() {
    return {
      awareness: null,
      localClientId: null,
    };
  },

  addProseMirrorPlugins() {
    const { awareness, localClientId } = this.options;
    if (!awareness) return [];

    return [
      new Plugin({
        key: pluginKey,
        state: {
          init(_config, state) {
            return buildDecorations(state.doc, awareness, localClientId);
          },
          apply(tr, old, _oldState, newState) {
            if (tr.getMeta(REFRESH_META) || tr.docChanged) {
              return buildDecorations(newState.doc, awareness, localClientId);
            }
            return old;
          },
        },
        props: {
          decorations(state) {
            return pluginKey.getState(state);
          },
        },
        view(editorView) {
          const onAwarenessChange = () => {
            const tr = editorView.state.tr.setMeta(REFRESH_META, true);
            editorView.dispatch(tr);
          };
          awareness.on("change", onAwarenessChange);
          return {
            destroy() {
              awareness.off("change", onAwarenessChange);
            },
          };
        },
      }),
    ];
  },
});
