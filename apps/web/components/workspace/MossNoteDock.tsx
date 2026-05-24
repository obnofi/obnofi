"use client";

import {
  useCallback,
  useEffect,
  useImperativeHandle,
  useState,
  forwardRef,
  type RefObject,
} from "react";
import { createPortal } from "react-dom";
import type {
  MossNoteAnchor,
  MossNoteColor,
  MossNotePosition,
} from "@/lib/moss-notes";
import {
  STICKY_WIDTH,
  STICKY_HEIGHT,
  DEFAULT_BODY,
  colorClass,
  clientPointToSurfacePosition,
} from "./mossNoteUtils";
import { MossNoteCard } from "./MossNoteCard";
import { MossNoteContextMenu } from "./MossNoteContextMenu";
import { useMossNotes } from "@/hooks/useMossNotes";

interface MossNoteDockProps {
  pageId: string;
  surfaceRef: RefObject<HTMLElement>;
  getAnchor?: () => MossNoteAnchor;
  onRevealAnchor?: (anchor: MossNoteAnchor) => void;
}

export interface MossNoteDockHandle {
  togglePlacement: () => void;
  startPlacement: () => void;
}

export const MossNoteDock = forwardRef<MossNoteDockHandle, MossNoteDockProps>(function MossNoteDock(
  { pageId, surfaceRef, getAnchor, onRevealAnchor },
  ref
) {
  const [surface, setSurface] = useState<HTMLElement | null>(null);
  const [color] = useState<MossNoteColor>("sun");
  const [isPlacing, setIsPlacing] = useState(false);
  const [ghostPoint, setGhostPoint] = useState<{ x: number; y: number } | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingBody, setEditingBody] = useState("");
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [contextMenu, setContextMenu] = useState<{
    mossNoteId: string;
    x: number;
    y: number;
  } | null>(null);

  const handleNoteCreated = useCallback((optimisticId: string) => {
    setEditingId(optimisticId);
    setEditingBody("");
    setIsPlacing(false);
  }, []);

  const handleOptimisticIdChange = useCallback((optimisticId: string, realId: string) => {
    setEditingId((id) => (id === optimisticId ? realId : id));
  }, []);

  const handleOptimisticRemove = useCallback((optimisticId: string) => {
    setEditingId((id) => (id === optimisticId ? null : id));
  }, []);

  const {
    mossNotes,
    error,
    applyMossNotes,
    patchMossNote,
    createMossNoteAt,
    deleteMossNote,
  } = useMossNotes({
    pageId,
    color,
    getAnchor,
    onNoteCreated: handleNoteCreated,
    onOptimisticIdChange: handleOptimisticIdChange,
    onOptimisticRemove: handleOptimisticRemove,
  });

  useImperativeHandle(
    ref,
    () => ({
      togglePlacement: () => setIsPlacing((current) => !current),
      startPlacement: () => setIsPlacing(true),
    }),
    []
  );

  useEffect(() => {
    setSurface(surfaceRef.current);
  }, [surfaceRef]);

  useEffect(() => {
    if (!contextMenu) return;
    const close = () => setContextMenu(null);
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setContextMenu(null); };
    window.addEventListener("pointerdown", close);
    window.addEventListener("scroll", close, true);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("pointerdown", close);
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("keydown", onKey);
    };
  }, [contextMenu]);

  useEffect(() => {
    if (!isPlacing) { setGhostPoint(null); return; }
    const onMove = (e: PointerEvent) => setGhostPoint({ x: e.clientX, y: e.clientY });
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setIsPlacing(false); };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("keydown", onKey);
    };
  }, [isPlacing]);

  useEffect(() => {
    if (!draggingId || !surface) return;

    const onMove = (event: PointerEvent) => {
      const nextPosition = clientPointToSurfacePosition(
        surface,
        event.clientX - dragOffset.x + STICKY_WIDTH / 2,
        event.clientY - dragOffset.y + 24
      );
      applyMossNotes((current) =>
        current.map((n) => (n.id === draggingId ? { ...n, position: nextPosition } : n))
      );
    };

    const onUp = (event: PointerEvent) => {
      const nextPosition = clientPointToSurfacePosition(
        surface,
        event.clientX - dragOffset.x + STICKY_WIDTH / 2,
        event.clientY - dragOffset.y + 24
      );
      setDraggingId(null);
      void patchMossNote(draggingId, { position: nextPosition });
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp, { once: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, [applyMossNotes, dragOffset.x, dragOffset.y, draggingId, patchMossNote, surface]);

  const saveEditing = () => {
    if (!editingId) return;
    const body = editingBody.trim() || DEFAULT_BODY;
    void patchMossNote(editingId, { body });
    setEditingId(null);
    setEditingBody("");
  };

  const handleCardPointerDown = (
    event: React.PointerEvent<HTMLElement>,
    id: string,
    position: MossNotePosition
  ) => {
    setDraggingId(id);
    setDragOffset({
      x: event.clientX - (surface?.getBoundingClientRect().left ?? 0) + (surface?.scrollLeft ?? 0) - position.x,
      y: event.clientY - (surface?.getBoundingClientRect().top ?? 0) + (surface?.scrollTop ?? 0) - position.y,
    });
  };

  const layer = surface
    ? createPortal(
        <div
          className={`absolute inset-0 z-30 ${isPlacing ? "cursor-copy" : "pointer-events-none"}`}
          onPointerDown={(event) => {
            if (!isPlacing || !surface) return;
            event.preventDefault();
            event.stopPropagation();
            const position = clientPointToSurfacePosition(surface, event.clientX, event.clientY);
            void createMossNoteAt(position);
          }}
        >
          {mossNotes.map((mossNote) => (
            <MossNoteCard
              key={mossNote.id}
              mossNote={mossNote}
              isEditing={editingId === mossNote.id}
              editingBody={editingBody}
              surface={surface}
              onRevealAnchor={onRevealAnchor}
              onEditingBodyChange={setEditingBody}
              onSaveEditing={saveEditing}
              onCancelEditing={() => { setEditingId(null); setEditingBody(""); }}
              onStartEditing={(id, body) => { setEditingId(id); setEditingBody(body); }}
              onPointerDown={handleCardPointerDown}
              onContextMenu={(event, id) =>
                setContextMenu({ mossNoteId: id, x: event.clientX, y: event.clientY })
              }
            />
          ))}
        </div>,
        surface
      )
    : null;

  return (
    <>
      {layer}

      {isPlacing && ghostPoint ? (
        <div
          className={`pointer-events-none fixed z-[9999] rounded-md p-3 text-sm shadow-xl ${colorClass(color)}`}
          style={{
            left: ghostPoint.x - STICKY_WIDTH / 2,
            top: ghostPoint.y - 24,
            width: STICKY_WIDTH,
            minHeight: STICKY_HEIGHT,
          }}
        >
          <div className="text-[var(--color-text-primary)]">{DEFAULT_BODY}</div>
        </div>
      ) : null}

      {contextMenu ? (
        <MossNoteContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          mossNoteId={contextMenu.mossNoteId}
          onColorChange={(id, newColor) => void patchMossNote(id, { color: newColor })}
          onDelete={(id) => void deleteMossNote(id)}
          onClose={() => setContextMenu(null)}
        />
      ) : null}

      <div className="fixed bottom-6 right-6 z-40 max-w-[calc(100vw-2rem)]">
        {error ? (
          <div className="mb-2 max-w-72 rounded bg-[var(--color-surface)] px-3 py-2 text-xs text-[var(--color-danger)] shadow-lg">
            {error}
          </div>
        ) : null}
      </div>
    </>
  );
});
