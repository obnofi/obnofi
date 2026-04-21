"use client";

import { useEffect, useRef, useState } from "react";
import { useElementStore } from "@/store/useElementStore";
import type { SectionElement } from "@/types/clearing";

export function SectionTool({
  element,
  isSelected,
  onPointerDown,
}: {
  element: SectionElement;
  isSelected: boolean;
  onPointerDown: (event: React.PointerEvent<HTMLDivElement>, elementId: string) => void;
}) {
  const titleRef = useRef<HTMLDivElement>(null);
  const [draftTitle, setDraftTitle] = useState(element.content.title);
  const [editing, setEditing] = useState(false);
  const { updateElement } = useElementStore();

  useEffect(() => {
    setDraftTitle(element.content.title);
  }, [element.content.title]);

  useEffect(() => {
    if (editing && titleRef.current) {
      titleRef.current.focus();
      document.getSelection()?.selectAllChildren(titleRef.current);
      document.getSelection()?.collapseToEnd();
    }
  }, [editing]);

  return (
    <div
      className="relative h-full w-full"
      style={{
        opacity: element.style.opacity,
      }}
    >
      <div
        className={`h-full rounded-[28px] border-2 border-dashed p-4 ${isSelected ? "ring-2 ring-[var(--color-accent)]" : ""}`}
        style={{
          backgroundColor: element.content.background,
          borderColor: "rgba(46,125,69,0.28)",
        }}
      >
        <div
          ref={titleRef}
          className="inline-block rounded-lg px-3 py-1 text-sm font-semibold outline-none"
          contentEditable={editing}
          suppressContentEditableWarning
          style={{
            backgroundColor: "rgba(255,255,255,0.7)",
          }}
          onBlur={() => {
            setEditing(false);
            updateElement(element.id, {
              content: {
                ...element.content,
                title: draftTitle.trim() || "Section",
              },
            });
          }}
          onDoubleClick={(event) => {
            event.stopPropagation();
            setEditing(true);
          }}
          onInput={(event) => setDraftTitle(event.currentTarget.textContent ?? "")}
          onPointerDown={(event) => {
            if (editing) {
              event.stopPropagation();
            }
          }}
        >
          {draftTitle}
        </div>
      </div>
    </div>
  );
}
