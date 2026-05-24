"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { MossNote, MossNoteAnchor, MossNoteColor, MossNotePosition } from "@/lib/moss-notes";
import {
  DEFAULT_BODY,
  getMossNoteError,
  createOptimisticMossNoteId,
  isOptimisticMossNoteId,
  isSameMossNoteContent,
} from "@/components/workspace/mossNoteUtils";

interface UseMossNotesOptions {
  pageId: string;
  color: MossNoteColor;
  getAnchor?: () => MossNoteAnchor;
  /** Called with the newly created optimistic id (before server confirms) */
  onNoteCreated: (optimisticId: string) => void;
  /** Called when server confirms creation and the optimistic id is replaced */
  onOptimisticIdChange: (optimisticId: string, realId: string) => void;
  /** Called when an optimistic note is removed (creation failed or deleted) */
  onOptimisticRemove: (optimisticId: string) => void;
}

export interface UseMossNotesReturn {
  mossNotes: MossNote[];
  error: string | null;
  applyMossNotes: (updater: (current: MossNote[]) => MossNote[]) => void;
  mossNotesRef: React.MutableRefObject<MossNote[]>;
  fetchMossNotes: () => Promise<void>;
  patchMossNote: (mossNoteId: string, patch: Partial<MossNote>) => Promise<void>;
  createMossNoteAt: (position: MossNotePosition) => Promise<void>;
  deleteMossNote: (mossNoteId: string) => Promise<void>;
}

export function useMossNotes({
  pageId,
  color,
  getAnchor,
  onNoteCreated,
  onOptimisticIdChange,
  onOptimisticRemove,
}: UseMossNotesOptions): UseMossNotesReturn {
  const [mossNotes, setMossNotes] = useState<MossNote[]>([]);
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

  const fetchMossNotes = useCallback(async () => {
    setError(null);
    try {
      const response = await fetch(`/api/pages/${pageId}/moss-notes`);
      if (!response.ok) throw new Error("메모를 불러오지 못했습니다");
      const next = await response.json();
      applyMossNotes(() => next);
    } catch (fetchError) {
      setError(getMossNoteError(fetchError));
    }
  }, [applyMossNotes, pageId]);

  useEffect(() => {
    void fetchMossNotes();
  }, [fetchMossNotes]);

  const patchMossNote = useCallback(
    async (mossNoteId: string, patch: Partial<MossNote>) => {
      const previousNote = mossNotesRef.current.find((n) => n.id === mossNoteId);
      applyMossNotes((current) =>
        current.map((n) => (n.id === mossNoteId ? { ...n, ...patch } : n))
      );
      setError(null);
      if (isOptimisticMossNoteId(mossNoteId)) return;

      try {
        const response = await fetch(`/api/pages/${pageId}/moss-notes/${mossNoteId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(patch),
        });
        if (!response.ok) throw new Error("메모를 저장하지 못했습니다");
        const updated = await response.json();
        applyMossNotes((current) =>
          current.map((n) => (n.id === mossNoteId ? { ...n, updatedAt: updated.updatedAt } : n))
        );
      } catch (patchError) {
        if (previousNote) {
          const prevRecord = previousNote as unknown as Record<keyof MossNote, unknown>;
          const revert = Object.fromEntries(
            (Object.keys(patch) as Array<keyof MossNote>).map((key) => [key, prevRecord[key]])
          ) as Partial<MossNote>;
          applyMossNotes((current) =>
            current.map((n) => (n.id === mossNoteId ? { ...n, ...revert } : n))
          );
        }
        setError(getMossNoteError(patchError));
      }
    },
    [applyMossNotes, pageId]
  );

  const createMossNoteAt = useCallback(
    async (position: MossNotePosition) => {
      const anchor = getAnchor?.() ?? { kind: "page" };
      const now = new Date().toISOString();
      const optimistic: MossNote = {
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

      applyMossNotes((current) => [optimistic, ...current]);
      onNoteCreated(optimistic.id);
      setError(null);

      let hasReconciled = false;

      try {
        const response = await fetch(`/api/pages/${pageId}/moss-notes`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ body: DEFAULT_BODY, color, anchor, position }),
        });
        if (!response.ok) throw new Error("메모를 만들지 못했습니다");

        const next = await response.json();
        const current = mossNotesRef.current.find((n) => n.id === optimistic.id);

        if (!current) {
          await fetch(`/api/pages/${pageId}/moss-notes/${next.id}`, { method: "DELETE" });
          return;
        }

        const reconciled: MossNote = {
          ...next,
          body: current.body,
          color: current.color,
          anchor: current.anchor,
          position: current.position,
          resolved: current.resolved,
        };

        applyMossNotes((list) =>
          list.map((n) => (n.id === optimistic.id ? reconciled : n))
        );
        hasReconciled = true;
        onOptimisticIdChange(optimistic.id, next.id);

        if (!isSameMossNoteContent(reconciled, next)) {
          const syncResponse = await fetch(`/api/pages/${pageId}/moss-notes/${next.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              body: reconciled.body,
              color: reconciled.color,
              anchor: reconciled.anchor,
              position: reconciled.position,
              resolved: reconciled.resolved,
            }),
          });
          if (!syncResponse.ok) throw new Error("메모를 저장하지 못했습니다");
        }
      } catch (createError) {
        if (hasReconciled) {
          void fetchMossNotes();
          setError(getMossNoteError(createError));
          return;
        }
        applyMossNotes((list) => list.filter((n) => n.id !== optimistic.id));
        onOptimisticRemove(optimistic.id);
        setError(getMossNoteError(createError));
      }
    },
    [applyMossNotes, color, fetchMossNotes, getAnchor, onNoteCreated, onOptimisticIdChange, onOptimisticRemove, pageId]
  );

  const deleteMossNote = useCallback(
    async (mossNoteId: string) => {
      const prev = mossNotesRef.current;
      applyMossNotes((list) => list.filter((n) => n.id !== mossNoteId));
      setError(null);

      if (isOptimisticMossNoteId(mossNoteId)) {
        onOptimisticRemove(mossNoteId);
        return;
      }

      try {
        const response = await fetch(`/api/pages/${pageId}/moss-notes/${mossNoteId}`, {
          method: "DELETE",
        });
        if (!response.ok) throw new Error("메모를 삭제하지 못했습니다");
      } catch (deleteError) {
        applyMossNotes(() => prev);
        setError(getMossNoteError(deleteError));
      }
    },
    [applyMossNotes, onOptimisticRemove, pageId]
  );

  return {
    mossNotes,
    error,
    applyMossNotes,
    mossNotesRef,
    fetchMossNotes,
    patchMossNote,
    createMossNoteAt,
    deleteMossNote,
  };
}
