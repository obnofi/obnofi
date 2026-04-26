"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ImagePlus, Loader2, RefreshCw, SmilePlus, Trash2, X } from "lucide-react";
import type { Page, UpdatePageInput } from "@obnofi/types";
import { uploadPageCanopyAsset } from "@/lib/supabase";
import { pageCanopyPresets } from "@/lib/pageCanopyPresets";

const pageEmojiSeeds = [
  "🌱",
  "🌿",
  "🍃",
  "🌳",
  "🪴",
  "✨",
  "📝",
  "📌",
  "📚",
  "📅",
  "🚀",
  "💡",
  "🎯",
  "🧠",
  "✅",
  "🔥",
  "💚",
  "🔗",
  "🛠️",
  "🧭",
  "🎨",
  "🗂️",
  "📈",
  "🌊",
  "☁️",
  "🌞",
  "🌙",
  "⭐",
  "🎵",
  "🔒",
];

interface GrovePageCanopyProps {
  page: Page;
  onUpdate: (input: UpdatePageInput) => Promise<void>;
  hideCover?: boolean;
  hideControls?: boolean;
}

export function GrovePageCanopy({
  page,
  onUpdate,
  hideCover = false,
  hideControls = false,
}: GrovePageCanopyProps) {
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  const [isCanopyPickerOpen, setIsCanopyPickerOpen] = useState(false);
  const [customEmoji, setCustomEmoji] = useState("");
  const [isUploadingCanopy, setIsUploadingCanopy] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const emojiPickerRef = useRef<HTMLDivElement | null>(null);
  const canopyPickerRef = useRef<HTMLDivElement | null>(null);
  const canopyInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!isEmojiPickerOpen && !isCanopyPickerOpen) {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(target)) {
        setIsEmojiPickerOpen(false);
      }
      if (canopyPickerRef.current && !canopyPickerRef.current.contains(target)) {
        setIsCanopyPickerOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [isCanopyPickerOpen, isEmojiPickerOpen]);

  const emojiOptions = useMemo(() => {
    if (!customEmoji.trim()) {
      return pageEmojiSeeds;
    }

    return [customEmoji.trim(), ...pageEmojiSeeds.filter((emoji) => emoji !== customEmoji.trim())];
  }, [customEmoji]);

  const handlePageIconSelect = async (emoji: string) => {
    setCustomEmoji(emoji);
    setIsEmojiPickerOpen(false);
    await onUpdate({ icon: emoji });
  };

  const handlePageIconRemove = async () => {
    setIsEmojiPickerOpen(false);
    setCustomEmoji("");
    await onUpdate({ icon: null });
  };

  const handleCanopyFilePick = async (file: File | undefined) => {
    if (!file || !file.type.startsWith("image/")) {
      return;
    }

    setIsUploadingCanopy(true);
    setUploadError(null);

    try {
      const coverImage = await uploadPageCanopyAsset(file, page.id);
      await onUpdate({ coverImage });
    } catch {
      setUploadError("커버 이미지를 올리지 못했습니다.");
    } finally {
      setIsUploadingCanopy(false);
      if (canopyInputRef.current) {
        canopyInputRef.current.value = "";
      }
    }
  };

  const handleCanopyRemove = async () => {
    setUploadError(null);
    setIsCanopyPickerOpen(false);
    await onUpdate({ coverImage: null });
  };

  const handleCanopyPresetSelect = async (coverImage: string) => {
    setUploadError(null);
    setIsCanopyPickerOpen(false);
    await onUpdate({ coverImage });
  };

  return (
    <div className="mb-6">
      <input
        ref={canopyInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(event) => void handleCanopyFilePick(event.target.files?.[0])}
      />

      {page.coverImage && !hideCover ? (
        <div className="group relative mb-5 overflow-hidden rounded-[20px] border border-[var(--color-border)] bg-[var(--color-surface)]">
          <div className="relative h-[220px] w-full">
            <img
              src={page.coverImage}
              alt={`${page.title || "Untitled"} cover`}
              className="h-full w-full object-cover"
            />
          </div>
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-black/15 opacity-0 transition group-hover:opacity-100" />
          <div className="absolute right-3 top-3 flex items-center gap-2 opacity-100 transition sm:opacity-0 sm:group-hover:opacity-100">
            <button
              type="button"
              onClick={() => canopyInputRef.current?.click()}
              disabled={isUploadingCanopy}
              className="inline-flex items-center gap-2 rounded-lg border border-white/25 bg-black/45 px-3 py-2 text-sm font-medium text-white backdrop-blur transition hover:bg-black/60 disabled:cursor-wait disabled:opacity-70"
            >
              {isUploadingCanopy ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              변경
            </button>
            <button
              type="button"
              onClick={() => void handleCanopyRemove()}
              className="inline-flex items-center gap-2 rounded-lg border border-white/25 bg-black/45 px-3 py-2 text-sm font-medium text-white backdrop-blur transition hover:bg-black/60"
            >
              <Trash2 className="h-4 w-4" />
              제거
            </button>
          </div>
        </div>
      ) : null}

      {!hideControls ? (
        <div className="flex flex-wrap items-center gap-2">
        <div className="relative" ref={emojiPickerRef}>
          {page.icon ? (
            <button
              type="button"
              onClick={() => setIsEmojiPickerOpen((open) => !open)}
              className="flex h-20 w-20 items-center justify-center rounded-[22px] bg-transparent text-5xl transition hover:bg-[var(--color-hover)]"
              aria-label="페이지 이모지 변경"
            >
              {page.icon}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setIsEmojiPickerOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm font-medium text-[var(--color-text-secondary)] transition hover:border-[var(--color-accent)] hover:bg-[var(--color-accent-subtle)] hover:text-[var(--color-text-primary)]"
            >
              <SmilePlus className="h-4 w-4" />
              아이콘 추가
            </button>
          )}

          {isEmojiPickerOpen ? (
            <div className="absolute left-0 top-full z-30 mt-3 w-[20rem] rounded-2xl border border-[var(--color-border)] bg-[var(--color-background)] p-3 shadow-2xl">
              <div className="mb-3 flex items-center justify-between gap-2">
                <div>
                  <div className="text-sm font-semibold text-[var(--color-text-primary)]">
                    페이지 이모지
                  </div>
                  <div className="text-xs text-[var(--color-text-secondary)]">
                    대표 이모지를 고르거나 직접 붙여넣으세요.
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsEmojiPickerOpen(false)}
                  className="rounded-md p-1.5 text-[var(--color-text-secondary)] transition hover:bg-[var(--color-hover)] hover:text-[var(--color-text-primary)]"
                  aria-label="이모지 선택기 닫기"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <input
                value={customEmoji}
                onChange={(event) => setCustomEmoji(event.target.value)}
                placeholder="이모지 직접 입력"
                className="mb-3 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text-primary)] outline-none transition placeholder:text-[var(--color-text-placeholder)] focus:border-[var(--color-accent)]"
              />

              <div className="grid grid-cols-6 gap-2">
                {emojiOptions.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => void handlePageIconSelect(emoji)}
                    className="flex h-11 w-11 items-center justify-center rounded-xl border border-transparent bg-[var(--color-surface)] text-2xl transition hover:border-[var(--color-accent)] hover:bg-[var(--color-accent-subtle)]"
                    aria-label={`이모지 ${emoji} 선택`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>

              {page.icon ? (
                <button
                  type="button"
                  onClick={() => void handlePageIconRemove()}
                  className="mt-3 inline-flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-[var(--color-text-secondary)] transition hover:bg-[var(--color-hover)] hover:text-[var(--color-text-primary)]"
                >
                  <Trash2 className="h-4 w-4" />
                  아이콘 제거
                </button>
              ) : null}
            </div>
          ) : null}
        </div>

        <div className="relative" ref={canopyPickerRef}>
          <button
            type="button"
            onClick={() => setIsCanopyPickerOpen((open) => !open)}
            disabled={isUploadingCanopy}
            className="inline-flex items-center gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm font-medium text-[var(--color-text-secondary)] transition hover:border-[var(--color-accent)] hover:bg-[var(--color-accent-subtle)] hover:text-[var(--color-text-primary)] disabled:cursor-wait disabled:opacity-70"
          >
            {isUploadingCanopy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
            {page.coverImage ? "커버 변경" : "커버 추가"}
          </button>

          {isCanopyPickerOpen ? (
            <div className="absolute left-0 top-full z-30 mt-3 w-[24rem] rounded-2xl border border-[var(--color-border)] bg-[var(--color-background)] p-3 shadow-2xl">
              <div className="mb-3 flex items-center justify-between gap-2">
                <div>
                  <div className="text-sm font-semibold text-[var(--color-text-primary)]">
                    페이지 Canopy
                  </div>
                  <div className="text-xs text-[var(--color-text-secondary)]">
                    기본 커버를 고르거나 직접 이미지를 올리세요.
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCanopyPickerOpen(false)}
                  className="rounded-md p-1.5 text-[var(--color-text-secondary)] transition hover:bg-[var(--color-hover)] hover:text-[var(--color-text-primary)]"
                  aria-label="커버 선택기 닫기"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="mb-3 grid grid-cols-2 gap-2">
                {pageCanopyPresets.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => void handleCanopyPresetSelect(preset.url)}
                    className="overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-left transition hover:border-[var(--color-accent)]"
                  >
                    <div className="h-20 w-full">
                      <img
                        src={preset.url}
                        alt={preset.label}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="px-3 py-2 text-xs font-medium text-[var(--color-text-primary)]">
                      {preset.label}
                    </div>
                  </button>
                ))}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => canopyInputRef.current?.click()}
                  className="inline-flex items-center gap-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text-primary)] transition hover:border-[var(--color-accent)] hover:bg-[var(--color-accent-subtle)]"
                >
                  <ImagePlus className="h-4 w-4" />
                  직접 업로드
                </button>

                {page.coverImage ? (
                  <button
                    type="button"
                    onClick={() => void handleCanopyRemove()}
                    className="inline-flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-[var(--color-text-secondary)] transition hover:bg-[var(--color-hover)] hover:text-[var(--color-text-primary)]"
                  >
                    <Trash2 className="h-4 w-4" />
                    커버 제거
                  </button>
                ) : null}
              </div>
            </div>
          ) : null}
        </div>
        </div>
      ) : null}

      {uploadError ? (
        <div className="mt-2 text-sm text-[#D44C47]">{uploadError}</div>
      ) : null}
    </div>
  );
}
