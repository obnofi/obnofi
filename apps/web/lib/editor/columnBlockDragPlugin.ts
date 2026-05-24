import type { Node as ProseMirrorNode } from "@tiptap/pm/model";
import { NodeSelection, Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet, type EditorView } from "@tiptap/pm/view";

type DraggedColumnBlock = {
  pos: number;
};

export const columnBlockDragKey = new PluginKey("groveColumnBlockDrag");

export function isValidDocPosition(doc: ProseMirrorNode, pos: number) {
  return Number.isInteger(pos) && pos >= 0 && pos <= doc.content.size;
}

export function isDirectColumnBlock(
  node: ProseMirrorNode,
  parent: ProseMirrorNode | null
) {
  return node.isBlock && parent?.type.name === "groveColumn";
}

export function getColumnDepth(doc: ProseMirrorNode, pos: number) {
  const $pos = doc.resolve(pos);

  for (let depth = $pos.depth; depth >= 0; depth -= 1) {
    if ($pos.node(depth).type.name === "groveColumn") {
      return depth;
    }
  }

  return null;
}

export function getDirectChildDropPos(
  view: EditorView,
  event: DragEvent
) {
  const coords = view.posAtCoords({
    left: event.clientX,
    top: event.clientY,
  });

  if (!coords) {
    return null;
  }

  const { doc } = view.state;
  const $pos = doc.resolve(coords.pos);
  let columnDepth: number | null = null;

  for (let depth = $pos.depth; depth >= 0; depth -= 1) {
    if ($pos.node(depth).type.name === "groveColumn") {
      columnDepth = depth;
      break;
    }
  }

  if (columnDepth === null) {
    return null;
  }

  const columnStart = $pos.start(columnDepth);
  const columnEnd = $pos.end(columnDepth);

  if ($pos.depth <= columnDepth) {
    return Math.min(Math.max(coords.pos, columnStart), columnEnd);
  }

  const directChildDepth = columnDepth + 1;
  const targetBlockPos = $pos.before(directChildDepth);
  const targetNode = doc.nodeAt(targetBlockPos);

  if (!targetNode || !targetNode.isBlock) {
    return columnEnd;
  }

  const targetDom = view.nodeDOM(targetBlockPos);
  const targetElement =
    targetDom instanceof HTMLElement ? targetDom : targetDom?.parentElement;
  const targetRect = targetElement?.getBoundingClientRect();
  const isAfter = targetRect
    ? event.clientY > targetRect.top + targetRect.height / 2
    : coords.pos > targetBlockPos + targetNode.nodeSize / 2;

  const dropPos = isAfter
    ? targetBlockPos + targetNode.nodeSize
    : targetBlockPos;

  return Math.min(
    Math.max(dropPos, columnStart),
    columnEnd
  );
}

export function moveColumnBlock(
  view: EditorView,
  dragged: DraggedColumnBlock,
  event: DragEvent
) {
  const { state } = view;
  if (!isValidDocPosition(state.doc, dragged.pos)) {
    return false;
  }

  const node = state.doc.nodeAt(dragged.pos);

  if (!node || !isDirectColumnBlock(node, state.doc.resolve(dragged.pos).parent)) {
    return false;
  }

  let dropPos = getDirectChildDropPos(view, event);

  if (dropPos === null) {
    return false;
  }

  const sourceStart = dragged.pos;
  const sourceEnd = dragged.pos + node.nodeSize;

  if (dropPos >= sourceStart && dropPos <= sourceEnd) {
    return true;
  }

  if (sourceStart < dropPos) {
    dropPos -= node.nodeSize;
  }

  const targetColumnDepth = getColumnDepth(state.doc, dropPos);
  if (targetColumnDepth === null) {
    return false;
  }

  const tr = state.tr
    .delete(sourceStart, sourceEnd)
    .insert(dropPos, node)
    .scrollIntoView();

  view.dispatch(tr);
  view.focus();
  return true;
}

export function createColumnBlockDragPlugin() {
  let draggedBlock: DraggedColumnBlock | null = null;

  return new Plugin({
    key: columnBlockDragKey,
    props: {
      decorations(state) {
        const decorations: Decoration[] = [];

        state.doc.descendants((node, pos, parent) => {
          if (!isDirectColumnBlock(node, parent)) {
            return;
          }

          decorations.push(
            Decoration.widget(
              pos,
              () => {
                const handle = document.createElement("button");
                handle.type = "button";
                handle.className = "grove-block-drag-handle";
                handle.draggable = true;
                handle.contentEditable = "false";
                handle.dataset.groveBlockPos = String(pos);
                handle.setAttribute("aria-label", "블록 이동");
                handle.title = "블록 이동";
                handle.textContent = "⋮⋮";
                return handle;
              },
              {
                key: `grove-block-drag-handle-${pos}`,
                side: -1,
              }
            ),
            Decoration.node(pos, pos + node.nodeSize, {
              class: "grove-draggable-block",
            })
          );
        });

        return DecorationSet.create(state.doc, decorations);
      },
      handleDOMEvents: {
        dragstart(view, event) {
          const target = event.target;
          const handle =
            target instanceof HTMLElement
              ? target.closest<HTMLElement>("[data-grove-block-pos]")
              : null;

          if (!handle) {
            return false;
          }

          const pos = Number(handle.dataset.groveBlockPos);
          const node = isValidDocPosition(view.state.doc, pos)
            ? view.state.doc.nodeAt(pos)
            : null;

          if (!node) {
            return false;
          }

          draggedBlock = { pos };
          view.dispatch(
            view.state.tr.setSelection(NodeSelection.create(view.state.doc, pos))
          );

          event.dataTransfer?.setData("text/plain", "");
          if (event.dataTransfer) {
            event.dataTransfer.effectAllowed = "move";
          }

          return true;
        },
        dragover(_view, event) {
          if (!draggedBlock) {
            return false;
          }

          event.preventDefault();
          if (event.dataTransfer) {
            event.dataTransfer.dropEffect = "move";
          }
          return true;
        },
        drop(view, event) {
          if (!draggedBlock) {
            return false;
          }

          event.preventDefault();
          const didMove = moveColumnBlock(view, draggedBlock, event);
          draggedBlock = null;
          return didMove;
        },
        dragend() {
          draggedBlock = null;
          return false;
        },
      },
    },
  });
}
