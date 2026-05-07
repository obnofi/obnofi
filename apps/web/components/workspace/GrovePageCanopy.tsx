"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ImagePlus, Loader2, RefreshCw, Search, SmilePlus, Trash2, X } from "lucide-react";
import type { Page, UpdatePageInput } from "@obnofi/types";
import { uploadPageCanopyAsset } from "@/lib/supabase";
import { pageCanopyPresets } from "@/lib/pageCanopyPresets";
import { PageGlyph } from "@/components/workspace/PageGlyph";

const RECENT_PAGE_GLYPHS_STORAGE_KEY = "obnofi-recent-page-glyphs";
const MAX_RECENT_PAGE_GLYPHS = 18;

const pageGlyphSections = [
  {
    id: "recently-picked",
    label: "추천",
    glyphs: [
      { emoji: "🌱", keywords: ["seed", "new", "start", "plant"] },
      { emoji: "📝", keywords: ["note", "doc", "write", "text"] },
      { emoji: "📚", keywords: ["book", "wiki", "knowledge"] },
      { emoji: "📌", keywords: ["pin", "important", "highlight"] },
      { emoji: "💡", keywords: ["idea", "brainstorm", "insight"] },
      { emoji: "🚀", keywords: ["launch", "project", "ship"] },
      { emoji: "🎯", keywords: ["goal", "focus", "target"] },
      { emoji: "✅", keywords: ["done", "task", "check"] },
      { emoji: "🧠", keywords: ["brain", "thinking", "research"] },
      { emoji: "🧭", keywords: ["plan", "guide", "direction"] },
      { emoji: "🛠️", keywords: ["tool", "build", "fix"] },
      { emoji: "🔗", keywords: ["link", "relation", "reference"] },
    ],
  },
  {
    id: "nature",
    label: "Jungle",
    glyphs: [
      { emoji: "🌿", keywords: ["leaf", "nature", "green"] },
      { emoji: "🍃", keywords: ["wind", "leaf", "fresh"] },
      { emoji: "🌳", keywords: ["tree", "grove", "forest"] },
      { emoji: "🪴", keywords: ["plant", "pot", "garden"] },
      { emoji: "🌲", keywords: ["pine", "tree", "forest"] },
      { emoji: "🌊", keywords: ["wave", "water", "ocean"] },
      { emoji: "☁️", keywords: ["cloud", "sky", "weather"] },
      { emoji: "🌞", keywords: ["sun", "day", "bright"] },
      { emoji: "🌙", keywords: ["moon", "night", "dark"] },
      { emoji: "⭐", keywords: ["star", "favorite", "important"] },
      { emoji: "🔥", keywords: ["fire", "hot", "streak"] },
      { emoji: "✨", keywords: ["sparkle", "magic", "highlight"] },
    ],
  },
  {
    id: "work",
    label: "Work",
    glyphs: [
      { emoji: "📅", keywords: ["calendar", "schedule", "date"] },
      { emoji: "📈", keywords: ["chart", "growth", "metrics"] },
      { emoji: "🗂️", keywords: ["folder", "organize", "database"] },
      { emoji: "📊", keywords: ["graph", "report", "analytics"] },
      { emoji: "📋", keywords: ["list", "brief", "notes"] },
      { emoji: "📎", keywords: ["attachment", "file", "clip"] },
      { emoji: "🧾", keywords: ["document", "receipt", "record"] },
      { emoji: "💼", keywords: ["business", "company", "work"] },
      { emoji: "🗓️", keywords: ["plan", "agenda", "schedule"] },
      { emoji: "📍", keywords: ["location", "focus", "pin"] },
      { emoji: "🔒", keywords: ["private", "secure", "lock"] },
      { emoji: "🎨", keywords: ["design", "creative", "art"] },
    ],
  },
  {
    id: "personal",
    label: "Personal",
    glyphs: [
      { emoji: "🏠", keywords: ["home", "personal", "life"] },
      { emoji: "❤️", keywords: ["love", "favorite", "heart"] },
      { emoji: "☕", keywords: ["coffee", "routine", "break"] },
      { emoji: "🎵", keywords: ["music", "audio", "playlist"] },
      { emoji: "📷", keywords: ["photo", "camera", "memory"] },
      { emoji: "🍽️", keywords: ["food", "meal", "recipe"] },
      { emoji: "✈️", keywords: ["travel", "trip", "flight"] },
      { emoji: "🏃", keywords: ["health", "exercise", "run"] },
      { emoji: "🎬", keywords: ["movie", "video", "watch"] },
      { emoji: "🎮", keywords: ["game", "play", "fun"] },
      { emoji: "🛌", keywords: ["rest", "sleep", "recovery"] },
      { emoji: "🧘", keywords: ["calm", "meditation", "mind"] },
    ],
  },
] as const;

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
  const [glyphQuery, setGlyphQuery] = useState("");
  const [recentPageGlyphs, setRecentPageGlyphs] = useState<string[]>([]);
  const [isUploadingCanopy, setIsUploadingCanopy] = useState(false);
  const [isUploadingIcon, setIsUploadingIcon] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const emojiPickerRef = useRef<HTMLDivElement | null>(null);
  const canopyPickerRef = useRef<HTMLDivElement | null>(null);
  const canopyInputRef = useRef<HTMLInputElement | null>(null);
  const iconInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    try {
      const raw = window.localStorage.getItem(RECENT_PAGE_GLYPHS_STORAGE_KEY);
      if (!raw) {
        return;
      }
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        setRecentPageGlyphs(parsed.filter((value): value is string => typeof value === "string"));
      }
    } catch {
      // Ignore invalid local cache.
    }
  }, []);

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

  const storeRecentPageGlyph = (emoji: string) => {
    setRecentPageGlyphs((current) => {
      const next = [emoji, ...current.filter((item) => item !== emoji)].slice(
        0,
        MAX_RECENT_PAGE_GLYPHS
      );

      if (typeof window !== "undefined") {
        window.localStorage.setItem(
          RECENT_PAGE_GLYPHS_STORAGE_KEY,
          JSON.stringify(next)
        );
      }

      return next;
    });
  };

  const filteredGlyphSections = useMemo(() => {
    const normalizedQuery = glyphQuery.trim().toLowerCase();

    const sections = pageGlyphSections
      .map((section) => ({
        ...section,
        glyphs: section.glyphs.filter(({ emoji, keywords }) => {
          if (!normalizedQuery) {
            return true;
          }

          return (
            emoji.includes(normalizedQuery) ||
            section.label.toLowerCase().includes(normalizedQuery) ||
            keywords.some((keyword) => keyword.includes(normalizedQuery))
          );
        }),
      }))
      .filter((section) => section.glyphs.length > 0);

    if (!recentPageGlyphs.length || normalizedQuery) {
      return sections;
    }

    return [
      {
        id: "recent",
        label: "최근 사용",
        glyphs: recentPageGlyphs.map((emoji) => ({ emoji, keywords: [] })),
      },
      ...sections,
    ];
  }, [glyphQuery, recentPageGlyphs]);

  const handlePageIconSelect = async (emoji: string) => {
    storeRecentPageGlyph(emoji);
    setIsEmojiPickerOpen(false);
    await onUpdate({ icon: emoji });
  };

  const handlePageIconRemove = async () => {
    setIsEmojiPickerOpen(false);
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
      setIsEmojiPickerOpen(false);
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
                className="flex h-16 w-16 items-center justify-center rounded-[18px] bg-transparent text-4xl transition hover:bg-[var(--color-hover)]"
                aria-label="페이지 아이콘 변경"
              >
                <PageGlyph page={page} emojiClassName="text-4xl leading-none" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setIsEmojiPickerOpen(true)}
                className="inline-flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm font-medium text-[var(--color-text-secondary)] transition hover:bg-[var(--color-hover)] hover:text-[var(--color-text-primary)]"
              >
                <SmilePlus className="h-4 w-4" />
              </button>
            )}

            {isEmojiPickerOpen ? (
              <div className="absolute left-0 top-full z-30 mt-2 w-[20rem] overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-background)] shadow-2xl">
                <div className="flex items-center justify-between px-3 pb-2 pt-3">
                  <div>
                    <div className="text-sm font-medium text-[var(--color-text-primary)]">
                      페이지 Glyph
                    </div>
                    <div className="text-xs text-[var(--color-text-secondary)]">
                      Notion처럼 빠르게 찾아서 선택합니다.
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsEmojiPickerOpen(false)}
                    className="rounded-md p-1 text-[var(--color-text-secondary)] transition hover:bg-[var(--color-hover)] hover:text-[var(--color-text-primary)]"
                    aria-label="닫기"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="px-3 pb-2 pt-1">
                  <label className="relative block">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-placeholder)]" />
                    <input
                      type="text"
                      value={glyphQuery}
                      onChange={(event) => setGlyphQuery(event.target.value)}
                      placeholder="아이콘 검색"
                      className="w-full rounded-lg bg-[var(--color-surface)] px-3 py-1.5 pl-9 text-sm text-[var(--color-text-primary)] outline-none placeholder:text-[var(--color-text-placeholder)]"
                    />
                  </label>
                </div>

                <div className="max-h-[18rem] overflow-y-auto px-2 pb-2">
                  {filteredGlyphSections.length ? (
                    filteredGlyphSections.map((section) => {
                      return (
                        <section key={section.id} className="px-1.5 pb-2">
                          <div className="px-1.5 pb-1.5 pt-1 text-[11px] font-medium uppercase tracking-[0.08em] text-[var(--color-text-secondary)]">
                            {section.label}
                          </div>
                          <div className="grid grid-cols-8 gap-1">
                            {section.glyphs.map(({ emoji }) => (
                              <button
                                key={`${section.id}-${emoji}`}
                                type="button"
                                onClick={() => void handlePageIconSelect(emoji)}
                                className="flex h-8 w-8 items-center justify-center rounded-md text-lg transition hover:bg-[var(--color-hover)]"
                                aria-label={`${emoji} 선택`}
                              >
                                {emoji}
                              </button>
                            ))}
                          </div>
                        </section>
                      );
                    })
                  ) : (
                    <div className="px-4 py-10 text-center text-sm text-[var(--color-text-secondary)]">
                      검색 결과가 없습니다.
                    </div>
                  )}
                </div>

                <div className="border-t border-[var(--color-border)] px-3 py-3">
                  <div className="mb-2 text-[11px] font-medium uppercase tracking-[0.08em] text-[var(--color-text-secondary)]">
                    나의 이모지 추가
                  </div>
                  <button
                    type="button"
                    onClick={() => iconInputRef.current?.click()}
                    disabled={isUploadingIcon}
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text-primary)] transition hover:bg-[var(--color-hover)] disabled:cursor-wait disabled:opacity-60"
                  >
                    {isUploadingIcon ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <ImagePlus className="h-4 w-4" />
                    )}
                    사진으로 추가
                  </button>
                </div>

                {page.icon ? (
                  <div className="border-t border-[var(--color-border)] px-3 py-2">
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
