"use client";

import {
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  forwardRef,
  type RefObject,
} from "react";
import { createPortal } from "react-dom";
import { Link2, Trash2 } from "lucide-react";
import type {
  MossNote,
  MossNoteAnchor,
  MossNoteColor,
  MossNotePosition,
} from "@/lib/moss-notes";

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

const STICKY_WIDTH = 192;
const STICKY_HEIGHT = 152;
const DEFAULT_BODY = "새 메모";
const OPTIMISTIC_MOSS_NOTE_PREFIX = "optimistic-moss-note-";

const colorOptions: Array<{ value: MossNoteColor; label: string; className: string }> = [
  { value: "sun", label: "Sun", className: "bg-[var(--color-sticky-sun)]" },
  { value: "rose", label: "Rose", className: "bg-[var(--color-sticky-rose)]" },
  { value: "sky", label: "Sky", className: "bg-[var(--color-sticky-sky)]" },
];

function colorClass(color: MossNoteColor) {
  return colorOptions.find((option) => option.value === color)?.className ?? colorOptions[0].className;
}

function getMossNoteError(error: unknown) {
  return error instanceof Error ? error.message : "메모를 처리하지 못했습니다";
}

function createOptimisticMossNoteId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${OPTIMISTIC_MOSS_NOTE_PREFIX}${crypto.randomUUID()}`;
  }

  return `${OPTIMISTIC_MOSS_NOTE_PREFIX}${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}`;
}

function isOptimisticMossNoteId(mossNoteId: string) {
  return mossNoteId.startsWith(OPTIMISTIC_MOSS_NOTE_PREFIX);
}

function isSameMossNoteContent(first: MossNote, second: MossNote) {
  return (
    first.body === second.body &&
    first.color === second.color &&
    first.resolved === second.resolved &&
    JSON.stringify(first.anchor) === JSON.stringify(second.anchor) &&
    JSON.stringify(first.position) === JSON.stringify(second.position)
  );
}

function clampPosition(surface: HTMLElement, position: MossNotePosition) {
  const maxX = Math.max(0, surface.scrollWidth - STICKY_WIDTH);
  const maxY = Math.max(0, surface.scrollHeight - STICKY_HEIGHT);

  return {
    x: Math.max(0, Math.min(Math.round(position.x), maxX)),
    y: Math.max(0, Math.min(Math.round(position.y), maxY)),
  };
}

function clientPointToSurfacePosition(
  surface: HTMLElement,
  clientX: number,
  clientY: number
) {
  const rect = surface.getBoundingClientRect();

  return clampPosition(surface, {
    x: clientX - rect.left + surface.scrollLeft - STICKY_WIDTH / 2,
    y: clientY - rect.top + surface.scrollTop - 24,
  });
}

function isMossNoteInteractiveTarget(target: EventTarget | null) {
  return target instanceof HTMLElement
    ? Boolean(target.closest("button, textarea, input, select, a"))
    : false;
}

export const MossNoteDock = forwardRef<MossNoteDockHandle, MossNoteDockProps>(function MossNoteDock(
  {
    pageId,
    surfaceRef,
    getAnchor,
    onRevealAnchor,
  },
  ref
) {
  const [surface, setSurface] = useState<HTMLElement | null>(null);
  const [mossNotes, setMossNotes] = useState<MossNote[]>([]);
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
  const [error, setError] = useState<string | null>(null);
  const mossNotesRef = useRef<MossNote[]>([]);

  const applyMossNotes = useCallback((updater: (current: MossNote[]) => MossNote[]) => {
    setMossNotes((current) => {
      const next = updater(current);
      mossNotesRef.current = next;
      return next;
    });
  }, []);

  useEffect(() => {
    mossNotesRef.current = mossNotes;
  }, [mossNotes]);

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

  const fetchMossNotes = useCallback(async () => {
    setError(null);

    try {
      const response = await fetch(`/api/pages/${pageId}/moss-notes`);
      if (!response.ok) {
        throw new Error("메모를 불러오지 못했습니다");
      }
      const nextMossNotes = await response.json();
      applyMossNotes(() => nextMossNotes);
    } catch (fetchError) {
      setError(getMossNoteError(fetchError));
    }
  }, [applyMossNotes, pageId]);

  useEffect(() => {
    void fetchMossNotes();
  }, [fetchMossNotes]);

  useEffect(() => {
    if (!contextMenu) {
      return;
    }

    const closeContextMenu = () => setContextMenu(null);
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setContextMenu(null);
      }
    };

    window.addEventListener("pointerdown", closeContextMenu);
    window.addEventListener("scroll", closeContextMenu, true);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("pointerdown", closeContextMenu);
      window.removeEventListener("scroll", closeContextMenu, true);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [contextMenu]);

  useEffect(() => {
    if (!isPlacing) {
      setGhostPoint(null);
      return;
    }

    const handlePointerMove = (event: PointerEvent) => {
      setGhostPoint({ x: event.clientX, y: event.clientY });
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsPlacing(false);
      }
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isPlacing]);

  const patchMossNote = useCallback(
    async (mossNoteId: string, patch: Partial<MossNote>) => {
      const previousMossNotes = mossNotesRef.current;

      applyMossNotes((current) =>
        current.map((mossNote) =>
          mossNote.id === mossNoteId ? { ...mossNote, ...patch } : mossNote
        )
      );
      setError(null);

      if (isOptimisticMossNoteId(mossNoteId)) {
        return;
      }

      try {
        const response = await fetch(
          `/api/pages/${pageId}/moss-notes/${mossNoteId}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(patch),
          }
        );

        if (!response.ok) {
          throw new Error("메모를 저장하지 못했습니다");
        }

        const updatedMossNote = await response.json();
        applyMossNotes((current) =>
          current.map((mossNote) =>
            mossNote.id === mossNoteId ? updatedMossNote : mossNote
          )
        );
      } catch (patchError) {
        applyMossNotes(() => previousMossNotes);
        setError(getMossNoteError(patchError));
      }
    },
    [applyMossNotes, pageId]
  );

  useEffect(() => {
    if (!draggingId || !surface) {
      return;
    }

    const handlePointerMove = (event: PointerEvent) => {
      const nextPosition = clientPointToSurfacePosition(
        surface,
        event.clientX - dragOffset.x + STICKY_WIDTH / 2,
        event.clientY - dragOffset.y + 24
      );
      applyMossNotes((current) =>
        current.map((mossNote) =>
          mossNote.id === draggingId
            ? { ...mossNote, position: nextPosition }
            : mossNote
        )
      );
    };

    const handlePointerUp = (event: PointerEvent) => {
      const nextPosition = clientPointToSurfacePosition(
        surface,
        event.clientX - dragOffset.x + STICKY_WIDTH / 2,
        event.clientY - dragOffset.y + 24
      );
      setDraggingId(null);
      void patchMossNote(draggingId, { position: nextPosition });
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp, { once: true });
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [applyMossNotes, dragOffset.x, dragOffset.y, draggingId, patchMossNote, surface]);

  const createMossNoteAt = async (position: MossNotePosition) => {
    const anchor = getAnchor?.() ?? { kind: "page" };
    const now = new Date().toISOString();
    const optimisticMossNote: MossNote = {
      id: createOptimisticMossNoteId(),
      pageId,
      blockId: null,
      body: DEFAULT_BODY,
      color,
      anchor,
      position,
      resolved: false,
      authorId: "",
      createdAt: now,
      updatedAt: now,
    };

    applyMossNotes((current) => [optimisticMossNote, ...current]);
    setEditingId(optimisticMossNote.id);
    setEditingBody("");
    setIsPlacing(false);
    setError(null);

    let hasReconciledOptimisticMossNote = false;

    try {
      const response = await fetch(`/api/pages/${pageId}/moss-notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          body: DEFAULT_BODY,
          color,
          anchor,
          position,
        }),
      });

      if (!response.ok) {
        throw new Error("메모를 만들지 못했습니다");
      }

      const nextMossNote = await response.json();
      const currentOptimisticMossNote = mossNotesRef.current.find(
        (mossNote) => mossNote.id === optimisticMossNote.id
      );

      if (!currentOptimisticMossNote) {
        await fetch(`/api/pages/${pageId}/moss-notes/${nextMossNote.id}`, {
          method: "DELETE",
        });
        return;
      }

      const reconciledMossNote: MossNote = {
        ...nextMossNote,
        body: currentOptimisticMossNote.body,
        color: currentOptimisticMossNote.color,
        anchor: currentOptimisticMossNote.anchor,
        position: currentOptimisticMossNote.position,
        resolved: currentOptimisticMossNote.resolved,
      };

      applyMossNotes((current) =>
        current.map((mossNote) =>
          mossNote.id === optimisticMossNote.id ? reconciledMossNote : mossNote
        )
      );
      hasReconciledOptimisticMossNote = true;
      setEditingId((current) =>
        current === optimisticMossNote.id ? nextMossNote.id : current
      );

      if (!isSameMossNoteContent(reconciledMossNote, nextMossNote)) {
        const syncResponse = await fetch(
          `/api/pages/${pageId}/moss-notes/${nextMossNote.id}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              body: reconciledMossNote.body,
              color: reconciledMossNote.color,
              anchor: reconciledMossNote.anchor,
              position: reconciledMossNote.position,
              resolved: reconciledMossNote.resolved,
            }),
          }
        );

        if (!syncResponse.ok) {
          throw new Error("메모를 저장하지 못했습니다");
        }
      }
    } catch (createError) {
      if (hasReconciledOptimisticMossNote) {
        void fetchMossNotes();
        setError(getMossNoteError(createError));
        return;
      }

      applyMossNotes((current) =>
        current.filter((mossNote) => mossNote.id !== optimisticMossNote.id)
      );
      setEditingId((current) =>
        current === optimisticMossNote.id ? null : current
      );
      setError(getMossNoteError(createError));
    }
  };

  const deleteMossNote = async (mossNoteId: string) => {
    const previousMossNotes = mossNotesRef.current;
    applyMossNotes((current) => current.filter((mossNote) => mossNote.id !== mossNoteId));
    setError(null);

    if (isOptimisticMossNoteId(mossNoteId)) {
      setEditingId((current) => (current === mossNoteId ? null : current));
      return;
    }

    try {
      const response = await fetch(
        `/api/pages/${pageId}/moss-notes/${mossNoteId}`,
        { method: "DELETE" }
      );

      if (!response.ok) {
        throw new Error("메모를 삭제하지 못했습니다");
      }
    } catch (deleteError) {
      applyMossNotes(() => previousMossNotes);
      setError(getMossNoteError(deleteError));
    }
  };

  const saveEditing = () => {
    if (!editingId) {
      return;
    }

    const body = editingBody.trim() || DEFAULT_BODY;
    void patchMossNote(editingId, { body });
    setEditingId(null);
    setEditingBody("");
  };

  const layer = surface
    ? createPortal(
        <div
          className={`absolute inset-0 z-30 ${isPlacing ? "cursor-copy" : "pointer-events-none"}`}
          onPointerDown={(event) => {
            if (!isPlacing || !surface) {
              return;
            }

            event.preventDefault();
            event.stopPropagation();
            const position = clientPointToSurfacePosition(
              surface,
              event.clientX,
              event.clientY
            );
            void createMossNoteAt(position);
          }}
        >
          {mossNotes.map((mossNote) => {
            const isEditing = editingId === mossNote.id;

            return (
              <article
                key={mossNote.id}
                className={`pointer-events-auto absolute rounded-md p-3 text-sm shadow-lg ${
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
                  setContextMenu({
                    mossNoteId: mossNote.id,
                    x: event.clientX,
                    y: event.clientY,
                  });
                }}
                onPointerDown={(event) => {
                  if (isEditing || isMossNoteInteractiveTarget(event.target)) {
                    return;
                  }
                  event.preventDefault();
                  event.stopPropagation();
                  setDraggingId(mossNote.id);
                  setDragOffset({
                    x:
                      event.clientX -
                      (surface?.getBoundingClientRect().left ?? 0) +
                      (surface?.scrollLeft ?? 0) -
                      mossNote.position.x,
                    y:
                      event.clientY -
                      (surface?.getBoundingClientRect().top ?? 0) +
                      (surface?.scrollTop ?? 0) -
                      mossNote.position.y,
                  });
                }}
              >
                <div
                  className="mb-2 flex cursor-grab items-center gap-2 active:cursor-grabbing"
                  onPointerDown={(event) => {
                    if (isEditing) {
                      return;
                    }
                    event.preventDefault();
                    event.stopPropagation();
                    setDraggingId(mossNote.id);
                    setDragOffset({
                      x:
                        event.clientX -
                        (surface?.getBoundingClientRect().left ?? 0) +
                        (surface?.scrollLeft ?? 0) -
                        mossNote.position.x,
                      y:
                        event.clientY -
                        (surface?.getBoundingClientRect().top ?? 0) +
                        (surface?.scrollTop ?? 0) -
                        mossNote.position.y,
                    });
                  }}
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
                    onChange={(event) => setEditingBody(event.target.value)}
                    onBlur={saveEditing}
                    onPointerDown={(event) => event.stopPropagation()}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" && !event.shiftKey) {
                        event.preventDefault();
                        saveEditing();
                      }
                      if (event.key === "Escape") {
                        setEditingId(null);
                        setEditingBody("");
                      }
                    }}
                    className="min-h-24 w-full resize-none border-0 bg-transparent p-0 leading-5 text-[var(--color-text-primary)] outline-none ring-0 focus:border-0 focus:outline-none focus:ring-0 focus-visible:border-0 focus-visible:outline-none focus-visible:ring-0"
                    autoFocus
                  />
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingId(mossNote.id);
                      setEditingBody(
                        mossNote.body === DEFAULT_BODY ? "" : mossNote.body
                      );
                    }}
                    className="block w-full whitespace-pre-wrap text-left leading-5 text-[var(--color-text-primary)]"
                  >
                    {mossNote.body}
                  </button>
                )}

              </article>
            );
          })}
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
        <div
          className="fixed z-[10000] min-w-40 rounded-md border border-[var(--color-border)] bg-[var(--color-background)] p-1 shadow-xl"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onPointerDown={(event) => event.stopPropagation()}
          onContextMenu={(event) => event.preventDefault()}
        >
          <div className="px-2 py-1.5 text-xs font-medium text-[var(--color-text-secondary)]">
            색상
          </div>
          <div className="flex items-center gap-1 px-2 pb-2">
            {colorOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  void patchMossNote(contextMenu.mossNoteId, {
                    color: option.value,
                  });
                  setContextMenu(null);
                }}
                className={`h-6 w-6 rounded-full ${option.className}`}
                title={option.label}
              />
            ))}
          </div>
          <button
            type="button"
            onClick={() => {
              void deleteMossNote(contextMenu.mossNoteId);
              setContextMenu(null);
            }}
            className="flex w-full items-center gap-2 rounded px-2 py-2 text-left text-sm text-[var(--color-danger)] transition hover:bg-[var(--color-hover)]"
          >
            <Trash2 className="h-4 w-4" />
            삭제
          </button>
        </div>
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
