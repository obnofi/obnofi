"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

export function normalizeUrl(input: string | null) {
  const trimmed = input?.trim();
  if (!trimmed) return null;

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  return `https://${trimmed}`;
}

interface LinkEmbedModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (url: string) => void;
}

export function LinkEmbedModal({ isOpen, onClose, onConfirm }: LinkEmbedModalProps) {
  const [url, setUrl] = useState("");
  const inputRef = useRef<HTMLInputElement | null>(null);
  const normalizedUrl = normalizeUrl(url);

  useEffect(() => {
    if (!isOpen) return;

    setUrl("");
    window.setTimeout(() => inputRef.current?.focus(), 50);
  }, [isOpen]);

  const handleConfirm = () => {
    if (!normalizedUrl) return;

    onConfirm(normalizedUrl);
    onClose();
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      handleConfirm();
    }

    if (event.key === "Escape") {
      event.preventDefault();
      onClose();
    }
  };

  if (!isOpen || typeof document === "undefined") return null;

  return createPortal(
    <div className="pointer-events-auto fixed inset-0 z-[1000] flex items-start justify-center pt-[22vh]">
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-[2px]"
        onClick={onClose}
      />
      <div className="relative w-full max-w-sm overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] shadow-2xl">
        <div className="flex items-center justify-between border-b border-[var(--color-border)] px-4 py-3">
          <span className="text-sm font-semibold text-[var(--color-text-primary)]">
            링크 임베드
          </span>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-[var(--color-text-secondary)] transition hover:bg-[var(--color-hover)]"
            aria-label="닫기"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="grid gap-1.5 px-4 py-4">
          <label
            htmlFor="grove-link-embed-url"
            className="text-xs font-medium text-[var(--color-text-secondary)]"
          >
            링크
          </label>
          <input
            id="grove-link-embed-url"
            name="grove-link-embed-url"
            ref={inputRef}
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="https://example.com"
            className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text-primary)] outline-none transition placeholder:text-[var(--color-text-placeholder)] focus:border-[var(--color-accent)]"
          />
        </div>

        <div className="flex justify-end gap-2 border-t border-[var(--color-border)] px-4 py-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-3 py-1.5 text-sm text-[var(--color-text-secondary)] transition hover:bg-[var(--color-hover)]"
          >
            취소
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!normalizedUrl}
            className="rounded-lg bg-[var(--color-accent)] px-4 py-1.5 text-sm font-medium text-white transition hover:bg-[var(--color-accent-hover)] disabled:cursor-not-allowed disabled:opacity-40"
          >
            확인
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
