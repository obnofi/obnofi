"use client";

import { Link2 } from "lucide-react";
import type { MossNote, MossNoteAnchor, MossNotePosition } from "@/lib/moss-notes";
import { colorClass, STICKY_WIDTH, STICKY_HEIGHT, DEFAULT_BODY } from "./mossNoteUtils";

interface MossNoteCardProps {
  mossNote: MossNote;
  isEditing: boolean;
  editingBody: string;
  onRevealAnchor?: (anchor: MossNoteAnchor) => void;
  onEditingBodyChange: (body: string) => void;
  onSaveEditing: () => void;
  onCancelEditing: () => void;
  onStartEditing: (id: string, body: string) => void;
  onPointerDown: (event: React.PointerEvent<HTMLElement>, id: string, position: MossNotePosition) => void;
  onContextMenu: (event: React.MouseEvent, id: string) => void;
}

export function MossNoteCard({
  mossNote,
  isEditing,
  editingBody,
  onRevealAnchor,
  onEditingBodyChange,
  onSaveEditing,
  onCancelEditing,
  onStartEditing,
  onPointerDown,
  onContextMenu,
}: MossNoteCardProps) {
  const handleHeaderPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (isEditing) return;
    event.preventDefault();
    event.stopPropagation();
    onPointerDown(event, mossNote.id, mossNote.position);
  };

  const handleCardPointerDown = (event: React.PointerEvent<HTMLElement>) => {
    event.stopPropagation();
    if (isEditing || isInteractiveTarget(event.target)) return;
    event.preventDefault();
    onPointerDown(event, mossNote.id, mossNote.position);
  };

  return (
    <article
      key={mossNote.id}
      data-testid={`moss-note-${mossNote.id}`}
      className={`moss-note-card pointer-events-auto absolute z-30 rounded-md p-3 text-sm shadow-lg outline-none ${
        isEditing ? "" : "cursor-grab active:cursor-grabbing"
      } ${colorClass(mossNote.color)} ${
        mossNote.resolved ? "opacity-55" : ""
      }`}
      style={{
        left: mossNote.position.x,
        top: mossNote.position.y,
        width: STICKY_WIDTH,
        minHeight: STICKY_HEIGHT,
      }}
      onContextMenu={(event) => {
        event.preventDefault();
        event.stopPropagation();
        onContextMenu(event, mossNote.id);
      }}
      onFocus={(event) => event.stopPropagation()}
      onPointerDown={handleCardPointerDown}
    >
      <div
        className="mb-2 flex cursor-grab items-center gap-2 active:cursor-grabbing"
        onPointerDown={handleHeaderPointerDown}
      >
        {mossNote.anchor.kind === "selection" ? (
          <button
            type="button"
            onClick={() => onRevealAnchor?.(mossNote.anchor)}
            className="flex min-w-0 items-center gap-1 rounded px-1 py-0.5 text-xs text-[var(--color-text-secondary)] transition hover:bg-[rgba(255,255,255,0.35)]"
            title="연결된 문장으로 이동"
          >
            <Link2 className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{mossNote.anchor.quote}</span>
          </button>
        ) : (
          <span />
        )}
      </div>

      {isEditing ? (
        <textarea
          name="moss-note-body"
          value={editingBody}
          onChange={(event) => onEditingBodyChange(event.target.value)}
          onBlur={onSaveEditing}
          onPointerDown={(event) => event.stopPropagation()}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              onSaveEditing();
            }
            if (event.key === "Escape") {
              onCancelEditing();
            }
          }}
          className="min-h-24 w-full resize-none border-0 bg-transparent p-0 leading-5 text-[var(--color-text-primary)] outline-none ring-0 focus:border-0 focus:outline-none focus:ring-0 focus-visible:border-0 focus-visible:outline-none focus-visible:ring-0"
          autoFocus
        />
      ) : (
        <button
          type="button"
          onClick={() => {
            onStartEditing(mossNote.id, mossNote.body === DEFAULT_BODY ? "" : mossNote.body);
          }}
          className="block w-full whitespace-pre-wrap text-left leading-5 text-[var(--color-text-primary)] outline-none focus-visible:outline-none"
        >
          {mossNote.body}
        </button>
      )}
    </article>
  );
}

function isInteractiveTarget(target: EventTarget | null): boolean {
  return target instanceof HTMLElement
    ? Boolean(target.closest("button, textarea, input, select, a"))
    : false;
}
