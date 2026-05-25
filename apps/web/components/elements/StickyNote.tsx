"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Trash2 } from "lucide-react";
import { type StickyNoteItem, useElementStore } from "@/store/useElementStore";
import { STICKY_NOTE_COLORS, COLOR_ORDER } from "@/lib/canvas/stickyNoteColors";
import { persistStickyNote, removeStickyNoteFromSupabase } from "@/lib/canvas/stickyNoteUtils";

const MIN_STICKY_HEIGHT = 180;

export function StickyNote({
  stickyNote,
  scale = 1,
}: {
  stickyNote: StickyNoteItem;
  scale?: number;
}) {
  const contentRef = useRef<HTMLDivElement>(null);
  const dragStateRef = useRef<{
    pointerId: number;
    offsetX: number;
    offsetY: number;
  } | null>(null);
  const draftRef = useRef(stickyNote.content);
  const [isEditing, setIsEditing] = useState(false);
  const { updateStickyNote, moveStickyNote, resizeStickyNote, deleteStickyNote } =
    useElementStore();

  const colorToken = useMemo(
    () => STICKY_NOTE_COLORS[stickyNote.color],
    [stickyNote.color]
  );

  useEffect(() => {
    if (!isEditing) {
      draftRef.current = stickyNote.content;
    }
  }, [stickyNote.content, isEditing]);

  useEffect(() => {
    if (!isEditing || !contentRef.current) return;

    contentRef.current.focus();
    document.getSelection()?.selectAllChildren(contentRef.current);
    document.getSelection()?.collapseToEnd();
  }, [isEditing]);

  const syncHeight = () => {
    if (!contentRef.current) return;

    contentRef.current.style.height = "0px";
    const nextHeight = Math.max(MIN_STICKY_HEIGHT, contentRef.current.scrollHeight + 58);
    contentRef.current.style.height = "auto";

    if (nextHeight !== stickyNote.height) {
      resizeStickyNote(stickyNote.id, nextHeight);
      void persistStickyNote(stickyNote, { height: nextHeight });
    }
  };

  const commitContent = () => {
    const normalizedContent = draftRef.current.trimEnd();
    if (normalizedContent !== stickyNote.content) {
      updateStickyNote(stickyNote.id, { content: normalizedContent });
      void persistStickyNote(stickyNote, { content: normalizedContent, height: stickyNote.height });
    }
    setIsEditing(false);
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (isEditing || event.button !== 0) return;

    event.stopPropagation();
    const rect = event.currentTarget.getBoundingClientRect();
    dragStateRef.current = {
      pointerId: event.pointerId,
      offsetX: (event.clientX - rect.left) / scale,
      offsetY: (event.clientY - rect.top) / scale,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const dragState = dragStateRef.current;
    if (!dragState || dragState.pointerId !== event.pointerId) return;

    event.stopPropagation();
    const parentRect = event.currentTarget.parentElement?.getBoundingClientRect();
    if (!parentRect) return;

    moveStickyNote(
      stickyNote.id,
      (event.clientX - parentRect.left) / scale - dragState.offsetX,
      (event.clientY - parentRect.top) / scale - dragState.offsetY
    );
  };

  const handlePointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    const dragState = dragStateRef.current;
    if (!dragState || dragState.pointerId !== event.pointerId) return;

    dragStateRef.current = null;
    event.currentTarget.releasePointerCapture(event.pointerId);
    void persistStickyNote(stickyNote);
  };

  return (
    <div
      className="group absolute select-none"
      style={{ left: stickyNote.x, top: stickyNote.y, width: stickyNote.width, height: stickyNote.height }}
      onDoubleClick={(event) => { event.stopPropagation(); setIsEditing(true); }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      <div
        className="relative rounded-[22px] border p-4 shadow-[0_12px_24px_rgba(15,23,42,0.12)] transition-transform duration-150 group-hover:-translate-y-0.5"
        style={{
          backgroundColor: colorToken.surface,
          borderColor: colorToken.border,
          color: colorToken.text,
          minHeight: stickyNote.height,
        }}
      >
        <button
          className="absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-full opacity-0 transition hover:scale-105 group-hover:opacity-100"
          style={{ backgroundColor: colorToken.badge }}
          type="button"
          onClick={() => {
            deleteStickyNote(stickyNote.id);
            void removeStickyNoteFromSupabase(stickyNote);
          }}
        >
          <Trash2 className="h-4 w-4" />
        </button>

        <div className="mb-4 flex flex-wrap gap-1 pr-10">
          {COLOR_ORDER.map((color) => (
            <button
              key={color}
              aria-label={`Set sticky color to ${color}`}
              className={`h-4 w-4 rounded-full border transition ${
                stickyNote.color === color ? "scale-110 ring-2 ring-offset-1" : ""
              }`}
              style={{
                backgroundColor: STICKY_NOTE_COLORS[color].surface,
                borderColor: STICKY_NOTE_COLORS[color].border,
                boxShadow: stickyNote.color === color ? `0 0 0 2px ${colorToken.border}` : undefined,
              }}
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                updateStickyNote(stickyNote.id, { color });
                void persistStickyNote(stickyNote, { color });
              }}
            />
          ))}
        </div>

        <div
          ref={contentRef}
          className="min-h-[120px] whitespace-pre-wrap break-words bg-transparent text-base font-medium leading-7 outline-none"
          contentEditable={isEditing}
          suppressContentEditableWarning
          onBlur={commitContent}
          onInput={(event) => {
            draftRef.current = event.currentTarget.textContent ?? "";
            syncHeight();
          }}
          onPointerDown={(event) => { if (isEditing) event.stopPropagation(); }}
        >
          {stickyNote.content}
        </div>
      </div>
    </div>
  );
}
