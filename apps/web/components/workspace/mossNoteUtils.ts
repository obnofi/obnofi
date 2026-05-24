import type { MossNote, MossNoteColor, MossNotePosition } from "@/lib/moss-notes";

export const STICKY_WIDTH = 192;
export const STICKY_HEIGHT = 152;
export const DEFAULT_BODY = "새 메모";
export const OPTIMISTIC_MOSS_NOTE_PREFIX = "optimistic-moss-note-";

export const colorOptions: Array<{
  value: MossNoteColor;
  label: string;
  className: string;
}> = [
  { value: "sun", label: "Sun", className: "bg-[var(--color-sticky-sun)]" },
  { value: "rose", label: "Rose", className: "bg-[var(--color-sticky-rose)]" },
  { value: "sky", label: "Sky", className: "bg-[var(--color-sticky-sky)]" },
];

export function colorClass(color: MossNoteColor): string {
  return (
    colorOptions.find((option) => option.value === color)?.className ??
    colorOptions[0].className
  );
}

export function getMossNoteError(error: unknown): string {
  return error instanceof Error ? error.message : "메모를 처리하지 못했습니다";
}

export function createOptimisticMossNoteId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${OPTIMISTIC_MOSS_NOTE_PREFIX}${crypto.randomUUID()}`;
  }
  return `${OPTIMISTIC_MOSS_NOTE_PREFIX}${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}`;
}

export function isOptimisticMossNoteId(mossNoteId: string): boolean {
  return mossNoteId.startsWith(OPTIMISTIC_MOSS_NOTE_PREFIX);
}

export function isSameMossNoteContent(first: MossNote, second: MossNote): boolean {
  return (
    first.body === second.body &&
    first.color === second.color &&
    first.resolved === second.resolved &&
    JSON.stringify(first.anchor) === JSON.stringify(second.anchor) &&
    JSON.stringify(first.position) === JSON.stringify(second.position)
  );
}

export function clampPosition(
  surface: HTMLElement,
  position: MossNotePosition
): MossNotePosition {
  const maxX = Math.max(0, surface.scrollWidth - STICKY_WIDTH);
  const maxY = Math.max(0, surface.scrollHeight - STICKY_HEIGHT);

  return {
    x: Math.max(0, Math.min(Math.round(position.x), maxX)),
    y: Math.max(0, Math.min(Math.round(position.y), maxY)),
  };
}

export function clientPointToSurfacePosition(
  surface: HTMLElement,
  clientX: number,
  clientY: number
): MossNotePosition {
  const rect = surface.getBoundingClientRect();

  return clampPosition(surface, {
    x: clientX - rect.left + surface.scrollLeft - STICKY_WIDTH / 2,
    y: clientY - rect.top + surface.scrollTop - 24,
  });
}

export function isMossNoteInteractiveTarget(target: EventTarget | null): boolean {
  return target instanceof HTMLElement
    ? Boolean(target.closest("button, textarea, input, select, a"))
    : false;
}
