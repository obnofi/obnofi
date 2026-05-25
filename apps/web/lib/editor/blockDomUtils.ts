import type { EditorView } from "@tiptap/pm/view";
import type { ActionableBlockInfo, BlockPointerCoords } from "./blockUtils";
import { findBlockById } from "./blockUtils";

export function isWithinBlockHoverBuffer(
  view: EditorView,
  blockId: string,
  event: MouseEvent
) {
  const block = view.dom.querySelector<HTMLElement>(
    `[data-grove-block='true'][data-block-id='${CSS.escape(blockId)}']`
  );
  if (!block) return false;
  const rect = block.getBoundingClientRect();
  return (
    event.clientX >= rect.left - 128 &&
    event.clientX <= rect.right + 16 &&
    event.clientY >= rect.top - 12 &&
    event.clientY <= rect.bottom + 12
  );
}

export function findBlockByElement(
  view: EditorView,
  element: HTMLElement | null
): ActionableBlockInfo | null {
  const blockElement = element?.closest<HTMLElement>("[data-grove-block='true']") ?? null;
  const blockId = blockElement?.dataset.blockId ?? "";
  if (!blockId) return null;
  return findBlockById(view.state.doc, blockId);
}

export function findBlockNearGutter(
  view: EditorView,
  point: BlockPointerCoords
): ActionableBlockInfo | null {
  const blockElements = Array.from(
    view.dom.querySelectorAll<HTMLElement>("[data-grove-block='true'][data-block-id]")
  );
  let bestMatch: { distance: number; block: ActionableBlockInfo } | null = null;

  for (const blockElement of blockElements) {
    const rect = blockElement.getBoundingClientRect();
    const withinVerticalRange = point.clientY >= rect.top - 14 && point.clientY <= rect.bottom + 14;
    const withinHorizontalRange = point.clientX >= rect.left - 132 && point.clientX <= rect.right + 24;
    if (!withinVerticalRange || !withinHorizontalRange) continue;
    const block = findBlockByElement(view, blockElement);
    if (!block) continue;
    const distance = Math.abs(point.clientY - (rect.top + rect.height / 2));
    if (!bestMatch || distance < bestMatch.distance) {
      bestMatch = { distance, block };
    }
  }

  return bestMatch?.block ?? null;
}

export function findHoverableBlock(
  view: EditorView,
  point: BlockPointerCoords
) {
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

type BlockSiblingEntry = {
  block: ActionableBlockInfo;
  rect: DOMRect;
};

export function getSiblingEntries(
  view: EditorView,
  source: ActionableBlockInfo
): BlockSiblingEntry[] {
  const blockElements = Array.from(
    view.dom.querySelectorAll<HTMLElement>("[data-grove-block='true'][data-block-id]")
  );
  const siblings: BlockSiblingEntry[] = [];

  for (const blockElement of blockElements) {
    const block = findBlockByElement(view, blockElement);
    if (!block || block.parentPos !== source.parentPos) continue;
    siblings.push({ block, rect: blockElement.getBoundingClientRect() });
  }

  siblings.sort((left, right) => left.block.pos - right.block.pos);
  return siblings;
}

export function resolveDropPos(
  view: EditorView,
  source: ActionableBlockInfo,
  point: BlockPointerCoords
) {
  const siblings = getSiblingEntries(view, source);
  if (siblings.length === 0) return null;

  const minLeft = Math.min(...siblings.map(({ rect }) => rect.left)) - 96;
  const maxRight = Math.max(...siblings.map(({ rect }) => rect.right)) + 24;

  if (point.clientX < minLeft || point.clientX > maxRight) return null;

  for (const { block, rect } of siblings) {
    if (point.clientY <= rect.top + rect.height / 2) return block.pos;
  }

  const lastSibling = siblings.at(-1);
  return lastSibling ? lastSibling.block.pos + lastSibling.block.node.nodeSize : null;
}
