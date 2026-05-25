"use client";

import { useEffect, useRef } from "react";

type ClearingTitleControlProps = {
  title: string;
  isEditing: boolean;
  titleDraft: string;
  onTitleDraftChange: (value: string) => void;
  onCommit: () => void;
  onCancel: () => void;
  onStartEditing: () => void;
};

export function ClearingTitleControl({
  title,
  isEditing,
  titleDraft,
  onTitleDraftChange,
  onCommit,
  onCancel,
  onStartEditing,
}: ClearingTitleControlProps) {
  const titleInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing) {
      titleInputRef.current?.focus();
      titleInputRef.current?.select();
    }
  }, [isEditing]);

  if (isEditing) {
    return (
      <input
        ref={titleInputRef}
        name="clearing-title"
        value={titleDraft}
        aria-label="Clearing title"
        className="min-w-0 w-[320px] max-w-full rounded-md border border-[var(--color-border)] bg-[var(--color-background)] px-2 py-1 text-xl font-semibold text-[var(--color-text-primary)] outline-none"
        onChange={(event) => onTitleDraftChange(event.target.value)}
        onBlur={onCommit}
        onClick={(event) => event.stopPropagation()}
        onDoubleClick={(event) => event.stopPropagation()}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            event.currentTarget.blur();
          }
          if (event.key === "Escape") {
            event.preventDefault();
            onCancel();
          }
        }}
      />
    );
  }

  return (
    <button
      type="button"
      className="min-w-0 max-w-full truncate rounded-md px-2 py-1 text-left text-xl font-semibold text-[var(--color-text-primary)] transition hover:bg-[var(--color-hover)]"
      title="더블클릭해서 제목 수정"
      onDoubleClick={(event) => {
        event.stopPropagation();
        onStartEditing();
      }}
    >
      {title}
    </button>
  );
}
