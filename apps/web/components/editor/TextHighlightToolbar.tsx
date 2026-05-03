"use client";

import { useEffect, useMemo, useState } from "react";
import type { Editor } from "@tiptap/react";
import { Eraser, Highlighter } from "lucide-react";
import type { PageHighlightColor } from "@obnofi/types";
import { PAGE_HIGHLIGHT_BG_COLORS } from "@/lib/highlightColors";

interface TextHighlightToolbarProps {
  editor: Editor;
  colors: PageHighlightColor[];
}

interface ToolbarPosition {
  left: number;
  top: number;
}

export function TextHighlightToolbar({
  editor,
  colors,
}: TextHighlightToolbarProps) {
  const [position, setPosition] = useState<ToolbarPosition | null>(null);

  useEffect(() => {
    const updatePosition = () => {
      if (!editor.isEditable || editor.state.selection.empty || !editor.isFocused) {
        setPosition(null);
        return;
      }

      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) {
        setPosition(null);
        return;
      }

      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();

      if (rect.width === 0 && rect.height === 0) {
        setPosition(null);
        return;
      }

      setPosition({
        left: rect.left + rect.width / 2,
        top: rect.top - 12,
      });
    };

    updatePosition();
    editor.on("selectionUpdate", updatePosition);
    editor.on("focus", updatePosition);
    editor.on("blur", updatePosition);
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);

    return () => {
      editor.off("selectionUpdate", updatePosition);
      editor.off("focus", updatePosition);
      editor.off("blur", updatePosition);
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [colors, editor]);

  const activeColor = useMemo(() => {
    for (const color of colors) {
      if (editor.isActive("textHighlight", { color })) {
        return color;
      }
    }
    return null;
  }, [colors, editor, editor.state]);

  if (!position || colors.length === 0) {
    return null;
  }

  return (
    <div
      className="fixed z-[10001] flex -translate-x-1/2 -translate-y-full items-center gap-1 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-2 py-1 shadow-lg"
      style={{ left: position.left, top: position.top }}
    >
      <span className="px-1 text-[var(--color-text-secondary)]">
        <Highlighter className="h-3.5 w-3.5" />
      </span>
      {colors.map((color) => {
        const isActive = color === activeColor;
        return (
          <button
            key={color}
            type="button"
            aria-label={`${color} highlight`}
            onMouseDown={(event) => {
              event.preventDefault();
              editor.chain().focus().setTextHighlight({ color }).run();
            }}
            className={`h-6 w-6 rounded-full transition ${
              isActive ? "ring-2 ring-[var(--color-accent)] ring-offset-2 ring-offset-[var(--color-surface)]" : ""
            }`}
            style={{ backgroundColor: PAGE_HIGHLIGHT_BG_COLORS[color] }}
          />
        );
      })}
      <button
        type="button"
        aria-label="clear highlight"
        onMouseDown={(event) => {
          event.preventDefault();
          editor.chain().focus().unsetTextHighlight().run();
        }}
        className="rounded-md p-1 text-[var(--color-text-secondary)] transition hover:bg-[var(--color-hover)] hover:text-[var(--color-text-primary)]"
      >
        <Eraser className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
