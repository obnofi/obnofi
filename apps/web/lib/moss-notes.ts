export type MossNoteColor = "sun" | "rose" | "sky";

export type MossNoteAnchor =
  | { kind: "page" }
  | {
      kind: "selection";
      quote: string;
      from?: number;
      to?: number;
    };

export interface MossNoteContent {
  type: "mossNote";
  body: string;
  color: MossNoteColor;
  anchor: MossNoteAnchor;
  position: MossNotePosition;
}

export interface MossNotePosition {
  x: number;
  y: number;
}

export interface MossNote {
  id: string;
  pageId: string;
  blockId: string | null;
  body: string;
  color: MossNoteColor;
  anchor: MossNoteAnchor;
  position: MossNotePosition;
  resolved: boolean;
  authorId: string;
  createdAt: string;
  updatedAt: string;
}

const mossNoteColors: MossNoteColor[] = ["sun", "rose", "sky"];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function normalizeMossNoteColor(value: unknown): MossNoteColor {
  return mossNoteColors.includes(value as MossNoteColor)
    ? (value as MossNoteColor)
    : "sun";
}

export function normalizeMossNoteAnchor(value: unknown): MossNoteAnchor {
  if (!isRecord(value) || value.kind !== "selection") {
    return { kind: "page" };
  }

  const quote = typeof value.quote === "string" ? value.quote.trim() : "";
  if (!quote) {
    return { kind: "page" };
  }

  return {
    kind: "selection",
    quote: quote.slice(0, 280),
    from: typeof value.from === "number" ? value.from : undefined,
    to: typeof value.to === "number" ? value.to : undefined,
  };
}

export function normalizeMossNotePosition(value: unknown): MossNotePosition {
  if (!isRecord(value)) {
    return { x: 24, y: 24 };
  }

  const x = typeof value.x === "number" && Number.isFinite(value.x) ? value.x : 24;
  const y = typeof value.y === "number" && Number.isFinite(value.y) ? value.y : 24;

  return {
    x: Math.max(0, Math.round(x)),
    y: Math.max(0, Math.round(y)),
  };
}

export function normalizeMossNoteContent(value: unknown): MossNoteContent | null {
  if (!isRecord(value) || value.type !== "mossNote") {
    return null;
  }

  const body = typeof value.body === "string" ? value.body.trim() : "";
  if (!body) {
    return null;
  }

  return {
    type: "mossNote",
    body: body.slice(0, 2000),
    color: normalizeMossNoteColor(value.color),
    anchor: normalizeMossNoteAnchor(value.anchor),
    position: normalizeMossNotePosition(value.position),
  };
}

export function toMossNote(record: {
  id: string;
  pageId: string;
  blockId: string | null;
  content: unknown;
  resolved: boolean;
  authorId: string;
  createdAt: Date | string;
  updatedAt: Date | string;
}): MossNote | null {
  const content = normalizeMossNoteContent(record.content);
  if (!content) {
    return null;
  }

  return {
    id: record.id,
    pageId: record.pageId,
    blockId: record.blockId,
    body: content.body,
    color: content.color,
    anchor: content.anchor,
    position: content.position,
    resolved: record.resolved,
    authorId: record.authorId,
    createdAt:
      record.createdAt instanceof Date
        ? record.createdAt.toISOString()
        : record.createdAt,
    updatedAt:
      record.updatedAt instanceof Date
        ? record.updatedAt.toISOString()
        : record.updatedAt,
  };
}
