import { Plugin } from "@tiptap/pm/state";
import { Decoration, DecorationSet, type EditorView } from "@tiptap/pm/view";
import {
  blockActionsPluginKey,
  type BlockActionsState,
} from "@/components/editor/extensions/blockActionsPluginKey";
import {
  ensureBlockIds,
  findHoverableBlock,
  isActionableBlock,
  isWithinBlockHoverBuffer,
} from "@/lib/editor/blockUtils";
import {
  applyBlockDrag,
  endBlockDrag,
  updateBlockDrag,
} from "@/lib/editor/blockDragHandlers";

type BlockActionsMeta = Partial<BlockActionsState>;

function dispatchBlockActionsMeta(view: EditorView, meta: BlockActionsMeta) {
  view.dispatch(view.state.tr.setMeta(blockActionsPluginKey, meta));
}

export function createBlockActionsPlugin() {
  let flashTimer: number | null = null;

  return new Plugin<BlockActionsState>({
    key: blockActionsPluginKey,
    state: {
      init() {
        return {
          hoveredBlockId: null,
          draggedBlockId: null,
          dropPos: null,
          flashBlockId: null,
        };
      },
      apply(tr, value) {
        const meta = tr.getMeta(blockActionsPluginKey) as BlockActionsMeta | undefined;
        const nextValue = { ...value };

        if (tr.docChanged && nextValue.dropPos !== null) {
          const mappedDropPos = tr.mapping.mapResult(nextValue.dropPos, -1);
          nextValue.dropPos =
            mappedDropPos.deleted || mappedDropPos.pos > tr.doc.content.size
              ? null
              : Math.max(0, mappedDropPos.pos);
        }

        if (!meta) {
          return nextValue;
        }

        return {
          ...nextValue,
          ...meta,
        };
      },
    },
    appendTransaction(_transactions, _oldState, newState) {
      const tr = newState.tr;
      const didChange = ensureBlockIds(newState.doc, tr);
      return didChange ? tr : null;
    },
    props: {
      decorations(state) {
        const pluginState = blockActionsPluginKey.getState(state);
        const decorations: Decoration[] = [];

        state.doc.descendants((node, pos, parent) => {
          if (!isActionableBlock(node, parent ?? null)) {
            return;
          }

          const blockId = String(node.attrs.blockId ?? "");
          const classes = ["grove-editor-block"];

          if (pluginState?.hoveredBlockId === blockId) {
            classes.push("is-hovered");
          }

          if (pluginState?.flashBlockId === blockId) {
            classes.push("is-flashing");
          }

          if (
            pluginState?.dropPos !== null &&
            pluginState?.dropPos !== undefined &&
            pluginState.dropPos >= pos &&
            pluginState.dropPos <= pos + node.nodeSize
          ) {
            classes.push("is-drop-target");
          }

          decorations.push(
            Decoration.node(pos, pos + node.nodeSize, {
              class: classes.join(" "),
              "data-grove-block": "true",
              "data-block-id": blockId,
              "data-block-pos": String(pos),
            })
          );
        });

        if (
          pluginState?.dropPos !== null &&
          pluginState?.dropPos !== undefined &&
          pluginState.dropPos >= 0 &&
          pluginState.dropPos <= state.doc.content.size
        ) {
          decorations.push(
            Decoration.widget(
              pluginState.dropPos,
              () => {
                const line = document.createElement("div");
                line.className = "grove-block-drop-line";
                return line;
              },
              { side: -1 }
            )
          );
        }

        return DecorationSet.create(state.doc, decorations);
      },
      handleDOMEvents: {
        mousemove(view, event) {
          const pluginState = blockActionsPluginKey.getState(view.state);
          if (pluginState?.draggedBlockId) {
            return false;
          }

          const hoverBlock = findHoverableBlock(view, event);

          if (!hoverBlock) {
            if (
              pluginState?.hoveredBlockId &&
              isWithinBlockHoverBuffer(view, pluginState.hoveredBlockId, event)
            ) {
              return false;
            }

            if (pluginState?.hoveredBlockId) {
              dispatchBlockActionsMeta(view, { hoveredBlockId: null });
            }
            return false;
          }

          if (pluginState?.hoveredBlockId !== hoverBlock.id) {
            dispatchBlockActionsMeta(view, { hoveredBlockId: hoverBlock.id });
          }

          return false;
        },
        mouseleave(view, event) {
          const relatedTarget = event.relatedTarget;
          if (
            relatedTarget instanceof HTMLElement &&
            relatedTarget.closest("[data-block-action-bar='true']")
          ) {
            return false;
          }

          const pluginState = blockActionsPluginKey.getState(view.state);
          if (pluginState?.hoveredBlockId) {
            dispatchBlockActionsMeta(view, { hoveredBlockId: null });
          }

          return false;
        },
        dragover(view, event) {
          if (!blockActionsPluginKey.getState(view.state)?.draggedBlockId) {
            return false;
          }

          event.preventDefault();
          if (event.dataTransfer) {
            event.dataTransfer.dropEffect = "move";
          }
          return updateBlockDrag(view, event);
        },
        drop(view, event) {
          if (!blockActionsPluginKey.getState(view.state)?.draggedBlockId) {
            return false;
          }

          event.preventDefault();
          return applyBlockDrag(view, event);
        },
        dragend(view) {
          endBlockDrag(view);
          return false;
        },
      },
    },
    view() {
      return {
        update(updatedView) {
          const pluginState = blockActionsPluginKey.getState(updatedView.state);

          if (!pluginState?.flashBlockId) {
            return;
          }

          if (flashTimer !== null) {
            window.clearTimeout(flashTimer);
          }

          flashTimer = window.setTimeout(() => {
            dispatchBlockActionsMeta(updatedView, { flashBlockId: null });
          }, 900);
        },
        destroy() {
          if (flashTimer !== null) {
            window.clearTimeout(flashTimer);
          }
        },
      };
    },
  });
}
