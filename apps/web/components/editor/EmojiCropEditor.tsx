"use client";

import { useCallback, useRef } from "react";
import { Minus, Plus, Scissors, X } from "lucide-react";
import type { CropState, DragState } from "@/lib/editor/emojiData";
import { clampCrop, CROP_STAGE_SIZE } from "@/lib/editor/emojiData";

interface EmojiCropEditorProps {
  crop: CropState;
  emojiName: string;
  onCropChange: (updater: (current: CropState | null) => CropState | null) => void;
  onEmojiNameChange: (name: string) => void;
  onSave: () => void;
  onCancel: () => void;
}

export function EmojiCropEditor({
  crop,
  emojiName,
  onCropChange,
  onEmojiNameChange,
  onSave,
  onCancel,
}: EmojiCropEditorProps) {
  const dragRef = useRef<DragState | null>(null);

  const updateCropSize = useCallback(
    (scale: number) => {
      onCropChange((current) => {
        if (!current) return current;
        const centerX = current.x + current.size / 2;
        const centerY = current.y + current.size / 2;
        const nextSize = current.size * scale;
        return clampCrop({
          ...current,
          size: nextSize,
          x: centerX - nextSize / 2,
          y: centerY - nextSize / 2,
        });
      });
    },
    [onCropChange]
  );

  const handlePointerDown = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      event.currentTarget.setPointerCapture(event.pointerId);
      dragRef.current = {
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        baseX: crop.x,
        baseY: crop.y,
        baseSize: crop.size,
      };
    },
    [crop.x, crop.y, crop.size]
  );

  const handlePointerMove = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      const drag = dragRef.current;
      if (!drag || drag.pointerId !== event.pointerId) return;

      const sourceDeltaX = ((event.clientX - drag.startX) * drag.baseSize) / CROP_STAGE_SIZE;
      const sourceDeltaY = ((event.clientY - drag.startY) * drag.baseSize) / CROP_STAGE_SIZE;

      onCropChange((current) =>
        current
          ? clampCrop({
              ...current,
              x: drag.baseX - sourceDeltaX,
              y: drag.baseY - sourceDeltaY,
            })
          : current
      );
    },
    [onCropChange]
  );

  const handlePointerUp = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (dragRef.current?.pointerId === event.pointerId) {
        dragRef.current = null;
      }
    },
    []
  );

  const handleWheel = useCallback(
    (event: React.WheelEvent<HTMLDivElement>) => {
      event.preventDefault();
      updateCropSize(event.deltaY > 0 ? 1.08 : 0.92);
    },
    [updateCropSize]
  );

  const cropPreviewStyle = {
    backgroundImage: `url(${crop.src})`,
    backgroundPosition: `${-(crop.x / crop.size) * 100}% ${-(crop.y / crop.size) * 100}%`,
    backgroundSize: `${(crop.imageWidth / crop.size) * 100}% ${(crop.imageHeight / crop.size) * 100}%`,
  };

  return (
    <div className="w-[22rem] rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-3 shadow-2xl">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="min-w-0">
          <div className="text-sm font-semibold text-[var(--color-text-primary)]">
            개인 이모지 추가
          </div>
          <div className="truncate text-xs text-[var(--color-text-secondary)]">
            {crop.fileName}
          </div>
        </div>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md p-1.5 text-[var(--color-text-secondary)] hover:bg-[var(--color-hover)] hover:text-[var(--color-text-primary)]"
          aria-label="닫기"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="mb-3 flex items-center justify-center">
        <div
          className="relative h-[184px] w-[184px] cursor-grab touch-none overflow-hidden rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] bg-no-repeat shadow-inner active:cursor-grabbing"
          style={cropPreviewStyle}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onWheel={handleWheel}
          aria-label="드래그해서 이모지 위치 조정"
        >
          <div className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-white/60" />
          <div className="pointer-events-none absolute left-1/3 top-0 h-full w-px bg-white/55" />
          <div className="pointer-events-none absolute left-2/3 top-0 h-full w-px bg-white/55" />
          <div className="pointer-events-none absolute left-0 top-1/3 h-px w-full bg-white/55" />
          <div className="pointer-events-none absolute left-0 top-2/3 h-px w-full bg-white/55" />
        </div>
      </div>

      <div className="mb-3 flex items-center justify-center gap-2">
        <button
          type="button"
          onClick={() => updateCropSize(1.12)}
          className="rounded-md border border-[var(--color-border)] p-2 text-[var(--color-text-secondary)] hover:bg-[var(--color-hover)] hover:text-[var(--color-text-primary)]"
          aria-label="축소"
        >
          <Minus className="h-4 w-4" />
        </button>
        <div className="rounded-md bg-[var(--color-surface)] px-2 py-1 text-xs text-[var(--color-text-secondary)]">
          드래그로 위치 조정
        </div>
        <button
          type="button"
          onClick={() => updateCropSize(0.88)}
          className="rounded-md border border-[var(--color-border)] p-2 text-[var(--color-text-secondary)] hover:bg-[var(--color-hover)] hover:text-[var(--color-text-primary)]"
          aria-label="확대"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      <label className="mb-3 block text-xs font-medium text-[var(--color-text-secondary)]">
        이름
        <input
          value={emojiName}
          onChange={(event) => onEmojiNameChange(event.target.value)}
          className="mt-1 w-full rounded-md border border-[var(--color-border)] bg-[var(--color-background)] px-2 py-1.5 text-sm text-[var(--color-text-primary)] outline-none focus:border-[var(--color-accent)]"
          placeholder="my-emoji"
        />
      </label>

      <button
        type="button"
        onClick={onSave}
        className="flex w-full items-center justify-center gap-2 rounded-md bg-[var(--color-accent)] px-3 py-2 text-sm font-medium text-white hover:bg-[var(--color-accent-hover)]"
      >
        <Scissors className="h-4 w-4" />
        잘라서 추가
      </button>
    </div>
  );
}
