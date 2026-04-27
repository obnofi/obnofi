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
  const [isUploadingIcon, setIsUploadingIcon] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const emojiPickerRef = useRef<HTMLDivElement | null>(null);
  const canopyPickerRef = useRef<HTMLDivElement | null>(null);
  const canopyInputRef = useRef<HTMLInputElement | null>(null);
  const iconInputRef = useRef<HTMLInputElement | null>(null);

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

  const handleIconFilePick = async (file: File | undefined) => {
    if (!file || !file.type.startsWith("image/")) {
      return;
    }

    setIsUploadingIcon(true);
    setUploadError(null);

    try {
      const iconUrl = await uploadPageCanopyAsset(file, `icon-${page.id}`);
      await onUpdate({ icon: iconUrl });
    } catch {
      setUploadError("아이콘 이미지를 올리지 못했습니다.");
    } finally {
      setIsUploadingIcon(false);
      if (iconInputRef.current) {
        iconInputRef.current.value = "";
      }
    }
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
      <input
        ref={iconInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(event) => void handleIconFilePick(event.target.files?.[0])}
      />

      {!hideCover ? (
        <div className="relative" ref={canopyPickerRef}>
          <div className="group relative mb-5 overflow-hidden rounded-[20px]">
            {page.coverImage ? (
              <div className="relative h-[220px] w-full">
                <img
                  src={page.coverImage}
                  alt={`${page.title || "Untitled"} cover`}
                  className="h-full w-full object-cover"
                />
              </div>
            ) : (
              <div className="h-[120px] w-full from-[var(--color-surface)] to-[var(--color-background)]" />
            )}
            <div className="pointer-events-none absolute inset-0 opacity-0 transition group-hover:opacity-100" />
            <div className="absolute right-3 top-3 flex items-center gap-2 opacity-0 transition group-hover:opacity-100">
              <button
                type="button"
                onClick={() => setIsCanopyPickerOpen(true)}
                disabled={isUploadingCanopy}
                className="inline-flex items-center gap-2 rounded-lg disabled:opacity-70"
              >
                {isUploadingCanopy ? <Loader2 className="h-4 w-4 animate-spin" /> : page.coverImage ? <RefreshCw className="h-4 w-4" /> : <ImagePlus className="h-4 w-4" />}
                {page.coverImage ? "변경" : "커버 추가"}
              </button>
              {page.coverImage ? (
                <button
                  type="button"
                  onClick={() => void handleCanopyRemove()}
                  className="inline-flex items-center gap-2 rounded-lg border border-white/25 bg-black/45 px-3 py-2 text-sm font-medium text-white backdrop-blur transition hover:bg-black/60"
                >
                  <Trash2 className="h-4 w-4" />
                  제거
                </button>
              ) : null}
            </div>
          </div>

          {isCanopyPickerOpen ? (
            <div className="absolute right-0 top-12 z-30 w-[24rem] rounded-2xl border border-[var(--color-border)] bg-[var(--color-background)] p-3 shadow-2xl">
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
      ) : null}

      {!hideControls ? (
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative" ref={emojiPickerRef}>
            {page.icon ? (
              <button
                type="button"
                onClick={() => setIsEmojiPickerOpen((open) => !open)}
                className="flex h-20 w-20 items-center justify-center rounded-[22px] bg-transparent text-5xl transition hover:bg-[var(--color-hover)]"
                aria-label="페이지 아이콘 변경"
              >
                {page.icon.startsWith("http") || page.icon.startsWith("data:") ? (
                  <img
                    src={page.icon}
                    alt="페이지 아이콘"
                    className="h-16 w-16 rounded-xl object-cover"
                  />
                ) : (
                  page.icon
                )}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setIsEmojiPickerOpen(true)}
                className="inline-flex items-center gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm font-medium text-[var(--color-text-secondary)] transition hover:border-[var(--color-accent)] hover:bg-[var(--color-accent-subtle)] hover:text-[var(--color-text-primary)]"
              >
                <SmilePlus className="h-4 w-4" />
              </button>
            )}

            {isEmojiPickerOpen ? (
              <div className="absolute left-0 top-full z-30 mt-3 w-[22rem] overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-background)] shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-[var(--color-border)] px-4 py-3">
                  <span className="text-sm font-medium text-[var(--color-text-primary)]">
                    아이콘 선택
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsEmojiPickerOpen(false)}
                    className="rounded-md p-1 text-[var(--color-text-secondary)] transition hover:bg-[var(--color-hover)] hover:text-[var(--color-text-primary)]"
                    aria-label="닫기"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {/* Search Input - macOS style */}
                <div className="border-b border-[var(--color-border)] px-4 py-3">
                  <div className="relative">
                    <input
                      type="text"
                      value={customEmoji}
                      onChange={(event) => setCustomEmoji(event.target.value)}
                      placeholder="이모지 검색 또는 직접 입력"
                      className="w-full rounded-lg bg-[var(--color-surface)] px-3 py-2 pl-9 text-sm text-[var(--color-text-primary)] outline-none transition placeholder:text-[var(--color-text-placeholder)]"
                    />
                    <svg
                      className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-placeholder)]"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                </div>

                {/* Emoji Grid - No borders */}
                <div className="max-h-[240px] overflow-y-auto p-3">
                  <div className="grid grid-cols-8 gap-1">
                    {emojiOptions.map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => void handlePageIconSelect(emoji)}
                        className="flex h-9 w-9 items-center justify-center rounded-md text-xl transition hover:bg-[var(--color-hover)]"
                        aria-label={`${emoji} 선택`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Upload custom icon */}
                <div className="border-t border-[var(--color-border)] px-4 py-3">
                  <button
                    type="button"
                    onClick={() => iconInputRef.current?.click()}
                    disabled={isUploadingIcon}
                    className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-[var(--color-border)] py-3 text-sm text-[var(--color-text-secondary)] transition hover:border-[var(--color-accent)] hover:bg-[var(--color-accent-subtle)] hover:text-[var(--color-text-primary)] disabled:cursor-wait disabled:opacity-70"
                  >
                    {isUploadingIcon ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <ImagePlus className="h-4 w-4" />
                    )}
                    이미지 아이콘 업로드
                  </button>
                </div>

                {/* Footer with remove option */}
                {page.icon ? (
                  <div className="border-t border-[var(--color-border)] px-4 py-2">
                    <button
                      type="button"
                      onClick={() => void handlePageIconRemove()}
                      className="flex w-full items-center justify-center gap-2 rounded-lg py-2 text-sm text-[var(--color-text-secondary)] transition hover:bg-[var(--color-hover)] hover:text-[var(--color-text-primary)]"
                    >
                      <Trash2 className="h-4 w-4" />
                      아이콘 제거
                    </button>
                  </div>
                ) : null}
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
