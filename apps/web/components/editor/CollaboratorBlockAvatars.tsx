"use client";

import { useEffect, useState, useCallback } from "react";
import type { Editor } from "@tiptap/react";
import * as Y from "yjs";
import {
  ySyncPluginKey,
  relativePositionToAbsolutePosition,
} from "@tiptap/y-tiptap";
import { useCollaboration } from "@/lib/collaboration/CollaborationContext";

function CollaboratorAvatarImage({
  src,
  name,
  color,
}: {
  src: string;
  name: string;
  color: string;
}) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <span style={{ color }}>{name.charAt(0).toUpperCase()}</span>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={name}
      onError={() => setFailed(true)}
    />
  );
}

interface CollaboratorBlockAvatarsProps {
  editor: Editor;
  container: HTMLElement | null;
}

interface CollaboratorMarker {
  clientId: number;
  blockEl: HTMLElement;
  name: string;
  color: string;
  image: string | null;
}

interface PositionedMarker extends CollaboratorMarker {
  left: number;
  top: number;
  stackIndex: number;
}

function findBlockElement(view: Editor["view"], pos: number): HTMLElement | null {
  try {
    const { node } = view.domAtPos(pos);
    const el =
      node instanceof Element
        ? node
        : node.parentElement ?? null;
    return el?.closest<HTMLElement>("[data-grove-block='true']") ?? null;
  } catch {
    return null;
  }
}

export function CollaboratorBlockAvatars({
  editor,
  container,
}: CollaboratorBlockAvatarsProps) {
  const { provider } = useCollaboration();
  const [markers, setMarkers] = useState<PositionedMarker[]>([]);

  const compute = useCallback(() => {
    if (!container || !provider) {
      setMarkers([]);
      return;
    }

    const ystate = ySyncPluginKey.getState(editor.state);
    if (
      !ystate?.doc ||
      !ystate.binding ||
      !ystate.type ||
      ystate.snapshot != null ||
      ystate.prevSnapshot != null ||
      ystate.binding.mapping.size === 0
    ) {
      setMarkers([]);
      return;
    }

    const ydoc: Y.Doc = ystate.doc;
    const localId = ydoc.clientID;
    const collected: CollaboratorMarker[] = [];
    const seen = new Set<string>();

    provider.awareness.getStates().forEach((aw, clientId) => {
      if (clientId === localId) return;
      const cursor = aw?.cursor;
      const user = aw?.user;
      if (!cursor || !user) return;

      let head: number | null = null;
      try {
        head = relativePositionToAbsolutePosition(
          ydoc,
          ystate.type,
          Y.createRelativePositionFromJSON(cursor.head),
          ystate.binding.mapping
        );
      } catch {
        return;
      }
      if (head == null) return;

      const docSize = editor.state.doc.content.size;
      const safeHead = Math.max(1, Math.min(head, Math.max(docSize - 1, 1)));
      const blockEl = findBlockElement(editor.view, safeHead);
      if (!blockEl) return;

      const blockId = blockEl.dataset.blockId ?? "";
      const dedupeKey = `${clientId}:${blockId}`;
      if (seen.has(dedupeKey)) return;
      seen.add(dedupeKey);

      collected.push({
        clientId,
        blockEl,
        name: typeof user.name === "string" ? user.name : "User",
        color: typeof user.color === "string" ? user.color : "#888",
        image: typeof user.image === "string" ? user.image : null,
      });
    });

    if (collected.length === 0) {
      setMarkers([]);
      return;
    }

    const containerRect = container.getBoundingClientRect();
    const stackByBlock = new Map<HTMLElement, number>();
    const positioned: PositionedMarker[] = collected.map((m) => {
      const rect = m.blockEl.getBoundingClientRect();
      const stackIndex = stackByBlock.get(m.blockEl) ?? 0;
      stackByBlock.set(m.blockEl, stackIndex + 1);
      return {
        ...m,
        left: rect.left - containerRect.left - 30 - stackIndex * 16,
        top: rect.top - containerRect.top + 2,
        stackIndex,
      };
    });
    setMarkers(positioned);
  }, [container, editor, provider]);

  useEffect(() => {
    compute();
    if (!provider) return;

    let raf = 0;
    const schedule = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(compute);
    };

    provider.awareness.on("change", schedule);
    editor.on("transaction", schedule);
    window.addEventListener("resize", schedule);
    window.addEventListener("scroll", schedule, true);

    return () => {
      cancelAnimationFrame(raf);
      provider.awareness.off("change", schedule);
      editor.off("transaction", schedule);
      window.removeEventListener("resize", schedule);
      window.removeEventListener("scroll", schedule, true);
    };
  }, [compute, editor, provider]);

  if (markers.length === 0) return null;

  return (
    <>
      {markers.map((m) => (
        <div
          key={`${m.clientId}-${m.blockEl.dataset.blockId ?? "block"}`}
          className="grove-block-collab-avatar"
          data-export-ignore="true"
          style={{
            left: m.left,
            top: m.top,
            borderColor: m.color,
          }}
          title={m.name}
          aria-label={`${m.name} 편집 중`}
        >
          {m.image ? (
            <CollaboratorAvatarImage
              key={m.image}
              src={m.image}
              name={m.name}
              color={m.color}
            />
          ) : (
            <span style={{ color: m.color }}>
              {m.name.charAt(0).toUpperCase()}
            </span>
          )}
        </div>
      ))}
    </>
  );
}
