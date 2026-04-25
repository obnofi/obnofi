"use client";

import { Extension } from "@tiptap/core";
import type { Node as ProseMirrorNode } from "@tiptap/pm/model";
import { NodeSelection, Plugin, PluginKey, type Transaction } from "@tiptap/pm/state";
import { Decoration, DecorationSet, type EditorView } from "@tiptap/pm/view";

type BlockActionsState = {
  hoveredBlockId: string | null;
  draggedBlockId: string | null;
  dropPos: number | null;
  flashBlockId: string | null;
};

type ActionableBlockInfo = {
  id: string;
  pos: number;
  node: ProseMirrorNode;
  parentNode: ProseMirrorNode;
};

type BlockActionsMeta = Partial<BlockActionsState>;
type BlockPointerCoords = {
  clientX: number;
  clientY: number;
};

const actionableParentNames = new Set([
  "doc",
  "groveColumn",
  "bulletList",
  "orderedList",
]);

const actionableNodeNames = [
  "paragraph",
  "heading",
  "listItem",
  "blockquote",
  "horizontalRule",
  "codeBlock",
  "databaseNode",
  "canvasEmbed",
  "buttonBlock",
  "linkedDatabaseEmbed",
  "mathBlock",
  "subPageEmbed",
  "columnLayout",
];

export const blockActionsPluginKey = new PluginKey<BlockActionsState>("blockActions");

function getEventElementTarget(target: EventTarget | null) {
  if (target instanceof HTMLElement) {
    return target;
  }

  if (target instanceof Node) {
    return target.parentElement;
  }

  return null;
}

function isWithinBlockHoverBuffer(
  view: EditorView,
  blockId: string,
  event: MouseEvent
) {
  const block = view.dom.querySelector<HTMLElement>(
    `[data-grove-block='true'][data-block-id='${CSS.escape(blockId)}']`
  );

  if (!block) {
    return false;
  }

  const rect = block.getBoundingClientRect();

  return (
    event.clientX >= rect.left - 72 &&
    event.clientX <= rect.right &&
    event.clientY >= rect.top - 6 &&
    event.clientY <= rect.bottom + 6
  );
}

function createBlockId() {
  return `block-${Math.random().toString(36).slice(2, 10)}`;
}

function ensureBlockIds(doc: ProseMirrorNode, tr: Transaction) {
  const seenBlockIds = new Set<string>();
  let didChange = false;

  doc.descendants((node, pos, parent) => {
    if (!isActionableBlock(node, parent ?? null)) {
      return;
    }

    const blockId = String(node.attrs.blockId ?? "");
    if (!blockId || seenBlockIds.has(blockId)) {
      tr.setNodeMarkup(pos, undefined, {
        ...node.attrs,
        blockId: createBlockId(),
      });
      didChange = true;
      return;
    }

    seenBlockIds.add(blockId);
  });

  return didChange;
}

function isActionableBlock(
  node: ProseMirrorNode,
  parent: ProseMirrorNode | null
) {
  return node.isBlock && !!parent && actionableParentNames.has(parent.type.name);
}

function getActionableBlockAtResolvedPos(
  doc: ProseMirrorNode,
  pos: number
): ActionableBlockInfo | null {
  const $pos = doc.resolve(pos);

  for (let depth = $pos.depth; depth > 0; depth -= 1) {
    const node = $pos.node(depth);
    const parent = $pos.node(depth - 1);

    if (!isActionableBlock(node, parent)) {
      continue;
    }

    const blockPos = $pos.before(depth);
    const id = String(node.attrs.blockId ?? "");

    if (!id) {
      return null;
    }

    return {
      id,
      pos: blockPos,
      node,
      parentNode: parent,
    };
  }

  return null;
}

function findBlockById(
  doc: ProseMirrorNode,
  blockId: string
): ActionableBlockInfo | null {
  let match: ActionableBlockInfo | null = null;

  doc.descendants((node, pos, parent) => {
    if (!isActionableBlock(node, parent ?? null)) {
      return;
    }

    if (node.attrs.blockId !== blockId) {
      return;
    }

    match = {
      id: blockId,
      pos,
      node,
      parentNode: parent ?? doc,
    };

    return false;
  });

  return match;
}

function findBlockByElement(
  view: EditorView,
  element: HTMLElement | null
): ActionableBlockInfo | null {
  const blockElement = element?.closest<HTMLElement>("[data-grove-block='true']") ?? null;
  const blockId = blockElement?.dataset.blockId ?? "";

  if (!blockId) {
    return null;
  }

  return findBlockById(view.state.doc, blockId);
}

function findBlockNearGutter(
  view: EditorView,
  point: BlockPointerCoords
): ActionableBlockInfo | null {
  const blockElements = Array.from(
    view.dom.querySelectorAll<HTMLElement>("[data-grove-block='true'][data-block-id]")
  );
  let bestMatch: { distance: number; block: ActionableBlockInfo } | null = null;

  for (const blockElement of blockElements) {
    const rect = blockElement.getBoundingClientRect();
    const withinVerticalRange =
      point.clientY >= rect.top - 10 && point.clientY <= rect.bottom + 10;
    const withinHorizontalRange =
      point.clientX >= rect.left - 96 && point.clientX <= rect.right + 24;

    if (!withinVerticalRange || !withinHorizontalRange) {
      continue;
    }

    const block = findBlockByElement(view, blockElement);
    if (!block) {
      continue;
    }

    const distance = Math.abs(point.clientY - (rect.top + rect.height / 2));

    if (!bestMatch || distance < bestMatch.distance) {
      bestMatch = { distance, block };
    }
  }

  return bestMatch?.block ?? null;
}

function cloneJsonWithFreshBlockIds(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => cloneJsonWithFreshBlockIds(item));
  }

  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    const next: Record<string, unknown> = {};
    const nodeType =
      typeof record.type === "string" ? record.type : null;

    for (const [key, entry] of Object.entries(record)) {
      if (
        key === "attrs" &&
        entry &&
        typeof entry === "object" &&
        nodeType &&
        actionableNodeNames.includes(nodeType)
      ) {
        next[key] = {
          ...(entry as Record<string, unknown>),
          blockId: createBlockId(),
        };
        continue;
      }

      next[key] = cloneJsonWithFreshBlockIds(entry);
    }

    if (nodeType && actionableNodeNames.includes(nodeType) && !("attrs" in next)) {
      next.attrs = { blockId: createBlockId() };
    }

    return next;
  }

  return value;
}

function getDropBlockAtCoords(
  view: EditorView,
  point: BlockPointerCoords
): ActionableBlockInfo | null {
  const coords = view.posAtCoords({
    left: point.clientX,
    top: point.clientY,
  });

  if (!coords) {
    const domTarget =
      typeof document !== "undefined"
        ? document.elementFromPoint(point.clientX, point.clientY)
        : null;

    return (
      findBlockByElement(
        view,
        domTarget instanceof HTMLElement ? domTarget : domTarget?.parentElement ?? null
      ) ?? findBlockNearGutter(view, point)
    );
  }

  return (
    getActionableBlockAtResolvedPos(view.state.doc, coords.pos) ??
    findBlockNearGutter(view, point)
  );
}

function resolveDropPos(
  view: EditorView,
  source: ActionableBlockInfo,
  point: BlockPointerCoords
) {
  const target = getDropBlockAtCoords(view, point);

  if (!target) {
    return null;
  }

  if (target.parentNode.type.name !== source.parentNode.type.name) {
    return null;
  }

  const targetDom = view.nodeDOM(target.pos);
  const targetElement =
    targetDom instanceof HTMLElement ? targetDom : targetDom?.parentElement;
  const rect = targetElement?.getBoundingClientRect();
  const isAfter = rect
    ? point.clientY > rect.top + rect.height / 2
    : false;

  return isAfter ? target.pos + target.node.nodeSize : target.pos;
}

function dispatchBlockActionsMeta(
  view: EditorView,
  meta: BlockActionsMeta
) {
  view.dispatch(view.state.tr.setMeta(blockActionsPluginKey, meta));
}

export function startBlockDrag(
  view: EditorView,
  blockId: string,
  event?: DragEvent
) {
  const block = findBlockById(view.state.doc, blockId);

  if (!block) {
    return;
  }

  view.dispatch(
    view.state.tr
      .setSelection(NodeSelection.create(view.state.doc, block.pos))
      .setMeta(blockActionsPluginKey, {
        draggedBlockId: blockId,
        hoveredBlockId: blockId,
      })
  );

  event?.dataTransfer?.setData("text/plain", blockId);
  if (event?.dataTransfer) {
    event.dataTransfer.effectAllowed = "move";
    const dragGhost = document.createElement("div");
    dragGhost.style.width = "1px";
    dragGhost.style.height = "1px";
    dragGhost.style.opacity = "0";
    document.body.appendChild(dragGhost);
    event.dataTransfer.setDragImage(dragGhost, 0, 0);
    window.setTimeout(() => {
      dragGhost.remove();
    }, 0);
  }
}

export function updateBlockDrag(view: EditorView, point: BlockPointerCoords) {
  const pluginState = blockActionsPluginKey.getState(view.state);
  const draggedBlockId = pluginState?.draggedBlockId;

  if (!draggedBlockId) {
    return false;
  }

  const source = findBlockById(view.state.doc, draggedBlockId);
  if (!source) {
    return false;
  }

  const dropPos = resolveDropPos(view, source, point);

  if (dropPos === null) {
    if (pluginState?.dropPos !== null) {
      dispatchBlockActionsMeta(view, { dropPos: null });
    }
    return false;
  }

  if (pluginState?.dropPos !== dropPos) {
    dispatchBlockActionsMeta(view, { dropPos });
  }

  return true;
}

export function applyBlockDrag(view: EditorView, point: BlockPointerCoords) {
  const pluginState = blockActionsPluginKey.getState(view.state);
  const draggedBlockId = pluginState?.draggedBlockId;

  if (!draggedBlockId) {
    return false;
  }

  const source = findBlockById(view.state.doc, draggedBlockId);
  if (!source) {
    return false;
  }

  const dropPos = resolveDropPos(view, source, point);
  if (dropPos === null) {
    endBlockDrag(view);
    return false;
  }

  const sourceStart = source.pos;
  const sourceEnd = source.pos + source.node.nodeSize;

  if (dropPos >= sourceStart && dropPos <= sourceEnd) {
    endBlockDrag(view);
    return true;
  }

  const insertPos = sourceStart < dropPos ? dropPos - source.node.nodeSize : dropPos;

  view.dispatch(
    view.state.tr
      .delete(sourceStart, sourceEnd)
      .insert(insertPos, source.node)
      .setMeta(blockActionsPluginKey, {
        draggedBlockId: null,
        dropPos: null,
        hoveredBlockId: source.id,
      })
      .scrollIntoView()
  );
  view.focus();

  return true;
}

export function endBlockDrag(view: EditorView) {
  dispatchBlockActionsMeta(view, {
    draggedBlockId: null,
    dropPos: null,
  });
}

function createBlockActionsPlugin() {
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

        if (!meta) {
          return value;
        }

        return {
          ...value,
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

        if (pluginState?.dropPos !== null && pluginState?.dropPos !== undefined) {
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

          const eventElement = getEventElementTarget(event.target);
          const target =
            eventElement?.closest<HTMLElement>("[data-grove-block='true']") ?? null;

          if (!target) {
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

          const blockId = target.dataset.blockId ?? null;
          if (blockId && pluginState?.hoveredBlockId !== blockId) {
            dispatchBlockActionsMeta(view, { hoveredBlockId: blockId });
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
    view(view) {
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

export const BlockActionsExtension = Extension.create({
  name: "blockActions",

  onCreate() {
    const tr = this.editor.state.tr;
    const didChange = ensureBlockIds(this.editor.state.doc, tr);

    if (didChange) {
      this.editor.view.dispatch(tr);
    }
  },

  addGlobalAttributes() {
    return [
      {
        types: actionableNodeNames,
        attributes: {
          blockId: {
            default: null,
            renderHTML: (attributes: Record<string, unknown>) => {
              const blockId = attributes.blockId;
              return blockId ? { "data-block-id": String(blockId) } : {};
            },
            parseHTML: (element: HTMLElement) => element.getAttribute("data-block-id"),
          },
        },
      },
    ];
  },

  addCommands() {
    return {
      duplicateBlockNode:
        (blockId: string) =>
        ({ state, dispatch }) => {
          const block = findBlockById(state.doc, blockId);
          if (!block) {
            return false;
          }

          const clonedJson = cloneJsonWithFreshBlockIds(block.node.toJSON()) as Record<
            string,
            unknown
          >;
          const nextBlockId =
            clonedJson &&
            typeof clonedJson === "object" &&
            "attrs" in clonedJson &&
            clonedJson.attrs &&
            typeof clonedJson.attrs === "object"
              ? String((clonedJson.attrs as Record<string, unknown>).blockId ?? "")
              : "";

          const duplicatedNode = state.schema.nodeFromJSON(clonedJson);

          dispatch(
            state.tr
              .insert(block.pos + block.node.nodeSize, duplicatedNode)
              .setMeta(blockActionsPluginKey, {
                flashBlockId: nextBlockId || null,
                hoveredBlockId: nextBlockId || blockId,
              })
              .scrollIntoView()
          );

          return true;
        },
    };
  },

  addProseMirrorPlugins() {
    return [createBlockActionsPlugin()];
  },
});

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    blockActions: {
      duplicateBlockNode: (blockId: string) => ReturnType;
    };
  }
}
