import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";
import {
  relativePositionToAbsolutePosition,
  ySyncPluginKey,
} from "@tiptap/y-tiptap";
import type { Awareness } from "y-protocols/awareness";
import * as Y from "yjs";

const pluginKey = new PluginKey<DecorationSet>("linePresence");

const REFRESH_META = "linePresenceRefresh";

interface AwarenessUser {
  color?: string;
}

interface AwarenessRelativePositionJson {
  type?: unknown;
  tname?: unknown;
  item?: unknown;
  assoc?: unknown;
}

interface AwarenessCursorData {
  anchor?: AwarenessRelativePositionJson | null;
  head?: AwarenessRelativePositionJson | null;
}

export interface LinePresenceOptions {
  awareness: Awareness | null;
  localClientId: number | null;
}

function buildDecorations(
  editorState: import("@tiptap/pm/state").EditorState,
  awareness: Awareness,
  localClientId: number | null
): DecorationSet {
  const decorations: Decoration[] = [];
  const ystate = ySyncPluginKey.getState(editorState);

  if (
    !ystate?.doc ||
    !ystate.binding ||
    !ystate.type ||
    ystate.snapshot != null ||
    ystate.prevSnapshot != null
  ) {
    return DecorationSet.empty;
  }

  const states = awareness.getStates() as Map<
    number,
    { user?: AwarenessUser; cursor?: AwarenessCursorData | null }
  >;

  states.forEach((awarenessState, clientId) => {
    if (clientId === localClientId) return;
    const cursor = awarenessState.cursor;
    const user = awarenessState.user;
    if (!cursor || !user?.color) return;

    let head: number | null = null;
    let anchor: number | null = null;

    try {
      if (cursor.head) {
        head = relativePositionToAbsolutePosition(
          ystate.doc as Y.Doc,
          ystate.type,
          Y.createRelativePositionFromJSON(cursor.head),
          ystate.binding.mapping
        );
      }
      if (cursor.anchor) {
        anchor = relativePositionToAbsolutePosition(
          ystate.doc as Y.Doc,
          ystate.type,
          Y.createRelativePositionFromJSON(cursor.anchor),
          ystate.binding.mapping
        );
      }
    } catch {
      return;
    }

    const basePos = Math.min(anchor ?? head ?? 0, head ?? anchor ?? 0);
    const safePos = Math.max(0, Math.min(basePos, editorState.doc.content.size - 1));

    try {
      const $pos = editorState.doc.resolve(safePos);
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

  return DecorationSet.create(editorState.doc, decorations);
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
            return buildDecorations(state, awareness, localClientId);
          },
          apply(tr, old, _oldState, newState) {
            if (tr.getMeta(REFRESH_META) || tr.docChanged) {
              return buildDecorations(newState, awareness, localClientId);
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
