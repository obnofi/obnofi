export function preventInlineBlockDrag(event: React.DragEvent<HTMLElement>) {
  event.preventDefault();
  event.stopPropagation();
}

export function stopInlineBlockEventPropagation(event: { stopPropagation(): void }) {
  event.stopPropagation();
}

export function shouldFocusInlineBlockSurface(target: EventTarget | null) {
  const element = target as HTMLElement | null;

  if (!element) {
    return true;
  }

  return !element.closest(
    "input, textarea, select, button, a, [contenteditable='true'], [data-inline-block-skip-focus='true']"
  );
}

export function shouldStopInlineBlockEvent(event: Event) {
  if (
    event.type === "pointerdown" ||
    event.type === "mousedown" ||
    event.type === "click" ||
    event.type === "dblclick" ||
    event.type === "dragstart" ||
    event.type === "focus" ||
    event.type === "focusin"
  ) {
    return true;
  }

  const target = event.target as HTMLElement | null;

  return (
    ["INPUT", "BUTTON", "SELECT", "TEXTAREA"].includes(target?.tagName ?? "") ||
    Boolean(target?.isContentEditable)
  );
}
