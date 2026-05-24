"use client";

import { Plus } from "lucide-react";
import type { RefObject, MutableRefObject } from "react";
import { EMOJI_CATEGORIES, type EmojiCategoryId, type EmojiGridItem } from "@/lib/editor/emojiData";

interface EmojiPickerGridProps {
  gridItems: EmojiGridItem[];
  selectedIndex: number;
  activeCategory: EmojiCategoryId;
  normalizedQuery: string;
  itemRefs: MutableRefObject<(HTMLButtonElement | null)[]>;
  fileInputRef: RefObject<HTMLInputElement | null>;
  onSelect: (item: EmojiGridItem) => void;
  onHover: (index: number) => void;
  onCategoryChange: (id: EmojiCategoryId) => void;
  onFileChange: (file: File | undefined) => void;
}

export function EmojiPickerGrid({
  gridItems,
  selectedIndex,
  activeCategory,
  normalizedQuery,
  itemRefs,
  fileInputRef,
  onSelect,
  onHover,
  onCategoryChange,
  onFileChange,
}: EmojiPickerGridProps) {
  const activeCategoryLabel =
    normalizedQuery
      ? "검색"
      : EMOJI_CATEGORIES.find((c) => c.id === activeCategory)?.label ?? "사람";

  return (
    <div className="flex h-[340px] w-[386px] flex-col overflow-hidden rounded-xl border border-[#d9d9d9] bg-white shadow-2xl dark:border-zinc-700 dark:bg-zinc-950">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(event) => onFileChange(event.target.files?.[0])}
      />

      <div className="px-1.5 pt-1.5 text-[13px] font-medium leading-5 text-[#686868] dark:text-zinc-300">
        {activeCategoryLabel}
      </div>

      <div className="scrollbar-hidden flex-1 overflow-y-auto px-1.5 pb-1 pt-0.5">
        {gridItems.length > 0 ? (
          <div className="grid grid-cols-10 gap-x-0.5 gap-y-0.5">
            {gridItems.map((item, index) => {
              const isSelected = index === selectedIndex;
              return (
                <button
                  key={`${item.kind}-${item.id}`}
                  type="button"
                  ref={(element) => { itemRefs.current[index] = element; }}
                  onMouseEnter={() => onHover(index)}
                  onClick={() => onSelect(item)}
                  className={[
                    "flex h-[29px] w-[34px] items-center justify-center rounded text-[21px] leading-none transition-colors",
                    isSelected
                      ? "bg-[#ececec] dark:bg-zinc-800"
                      : "hover:bg-[#f0f0f0] dark:hover:bg-zinc-800",
                  ].join(" ")}
                  aria-label={`:${item.label}:`}
                  title={`:${item.label}:`}
                >
                  {item.kind === "personal" ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.emoji.src}
                      alt={item.emoji.alt ?? item.emoji.name}
                      className="h-[22px] w-[22px] rounded-sm object-cover"
                    />
                  ) : (
                    item.emoji.symbol
                  )}
                </button>
              );
            })}
          </div>
        ) : (
          <div className="px-3 py-16 text-center text-sm text-[#777] dark:text-zinc-400">
            일치하는 이모지가 없습니다.
          </div>
        )}
      </div>

      <div className="flex h-[42px] shrink-0 items-center border-t border-[#dedede] bg-[#f7f7f7] px-2 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex flex-1 items-center justify-between">
          {EMOJI_CATEGORIES.map((category) => {
            const Icon = category.icon;
            const isActive = !normalizedQuery && activeCategory === category.id;
            return (
              <button
                key={category.id}
                type="button"
                onClick={() => onCategoryChange(category.id)}
                className={[
                  "flex h-8 w-8 items-center justify-center rounded-md transition-colors",
                  isActive
                    ? "bg-white text-[#5f5f5f] shadow-sm dark:bg-zinc-800 dark:text-zinc-100"
                    : "text-[#8a8a8a] hover:bg-white/80 hover:text-[#5f5f5f] dark:text-zinc-500 dark:hover:bg-zinc-800",
                ].join(" ")}
                aria-label={category.label}
                title={category.label}
              >
                <Icon className="h-[17px] w-[17px]" />
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="ml-2 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#8a8a8a] text-white transition-colors hover:bg-[#707070] dark:bg-zinc-700 dark:hover:bg-zinc-600"
          aria-label="개인 이모지 추가"
          title="개인 이모지 추가"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
