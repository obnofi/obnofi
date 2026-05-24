"use client";

import { Trash2 } from "lucide-react";
import type { MossNoteColor } from "@/lib/moss-notes";
import { colorOptions } from "./mossNoteUtils";

interface MossNoteContextMenuProps {
  x: number;
  y: number;
  mossNoteId: string;
  onColorChange: (id: string, color: MossNoteColor) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}

export function MossNoteContextMenu({
  x,
  y,
  mossNoteId,
  onColorChange,
  onDelete,
  onClose,
}: MossNoteContextMenuProps) {
  return (
    <div
      className="fixed z-[10000] min-w-40 rounded-md border border-[var(--color-border)] bg-[var(--color-background)] p-1 shadow-xl"
      style={{ left: x, top: y }}
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
              onColorChange(mossNoteId, option.value);
              onClose();
            }}
            className={`h-6 w-6 rounded-full ${option.className}`}
            title={option.label}
          />
        ))}
      </div>
      <button
        type="button"
        onClick={() => {
          onDelete(mossNoteId);
          onClose();
        }}
        className="flex w-full items-center gap-2 rounded px-2 py-2 text-left text-sm text-[var(--color-danger)] transition hover:bg-[var(--color-hover)]"
      >
        <Trash2 className="h-4 w-4" />
        삭제
      </button>
    </div>
  );
}
