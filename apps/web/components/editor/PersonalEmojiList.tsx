"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import type { Editor } from "@tiptap/react";
import type { PersonalEmojiPayload } from "./extensions/PersonalEmojiExtension";
import { EmojiCropEditor } from "./EmojiCropEditor";
import { EmojiPickerGrid } from "./EmojiPickerGrid";
import {
  BUILTIN_EMOJIS,
  type CropState,
  type EmojiCategoryId,
  type EmojiGridItem,
  normalizeEmojiName,
  readPersonalEmojis,
  writePersonalEmojis,
  loadImage,
  fileToDataUrl,
  insertBuiltinEmoji,
  insertPersonalEmoji,
} from "@/lib/editor/emojiData";

type PersonalEmojiListProps = {
  query: string;
  command: (item: string) => void;
  editor: Editor;
  range: { from: number; to: number };
};

export type PersonalEmojiListHandle = {
  onKeyDown: (event: KeyboardEvent) => boolean;
};

export const PersonalEmojiList = forwardRef<
  PersonalEmojiListHandle,
  PersonalEmojiListProps
>(function PersonalEmojiList({ query, editor, range }, ref) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [personalEmojis, setPersonalEmojis] = useState<PersonalEmojiPayload[]>([]);
  const [crop, setCrop] = useState<CropState | null>(null);
  const [emojiName, setEmojiName] = useState("");
  const [activeCategory, setActiveCategory] = useState<EmojiCategoryId>("people");
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => {
    setPersonalEmojis(readPersonalEmojis());
  }, []);

  const normalizedQuery = query.trim().toLowerCase();

  const filteredBuiltin = useMemo(
    () =>
      BUILTIN_EMOJIS.filter((emoji) => {
        if (!normalizedQuery) return true;
        return (
          emoji.name.includes(normalizedQuery) ||
          emoji.keywords.some((keyword) => keyword.includes(normalizedQuery))
        );
      }),
    [normalizedQuery]
  );

  const filteredPersonal = useMemo(
    () =>
      personalEmojis.filter((emoji) => {
        if (!normalizedQuery) return true;
        return emoji.name.toLowerCase().includes(normalizedQuery);
      }),
    [normalizedQuery, personalEmojis]
  );

  const gridItems = useMemo<EmojiGridItem[]>(() => {
    const personalItems = filteredPersonal.map((emoji) => ({
      id: emoji.id,
      label: emoji.name,
      kind: "personal" as const,
      emoji,
    }));

    if (normalizedQuery) {
      return [
        ...personalItems,
        ...filteredBuiltin.map((emoji) => ({
          id: emoji.id,
          label: emoji.name,
          kind: "builtin" as const,
          emoji,
        })),
      ];
    }

    return filteredBuiltin
      .filter((emoji) => emoji.group === activeCategory)
      .map((emoji) => ({
        id: emoji.id,
        label: emoji.name,
        kind: "builtin" as const,
        emoji,
      }));
  }, [activeCategory, filteredBuiltin, filteredPersonal, normalizedQuery]);

  const handleSelect = useCallback(
    (item: EmojiGridItem | undefined) => {
      if (!item) return;
      if (item.kind === "personal") {
        insertPersonalEmoji(editor, range, item.emoji);
        return;
      }
      insertBuiltinEmoji(editor, range, item.emoji.symbol);
    },
    [editor, range]
  );

  useImperativeHandle(
    ref,
    () => ({
      onKeyDown: (event: KeyboardEvent) => {
        if (crop) return false;

        if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
          setSelectedIndex((prev) =>
            prev <= 0 ? Math.max(gridItems.length - 1, 0) : prev - 1
          );
          return true;
        }

        if (event.key === "ArrowRight" || event.key === "ArrowDown") {
          setSelectedIndex((prev) =>
            prev >= gridItems.length - 1 ? 0 : prev + 1
          );
          return true;
        }

        if (event.key === "Enter") {
          handleSelect(gridItems[selectedIndex]);
          return true;
        }

        return false;
      },
    }),
    [crop, gridItems, handleSelect, selectedIndex]
  );

  useEffect(() => {
    setSelectedIndex(0);
  }, [activeCategory, query]);

  useEffect(() => {
    itemRefs.current[selectedIndex]?.scrollIntoView({ block: "nearest" });
  }, [selectedIndex]);

  const handleFileSelect = useCallback(async (file: File | undefined) => {
    if (!file || !file.type.startsWith("image/")) return;

    const src = await fileToDataUrl(file);
    const image = await loadImage(src);
    const minSide = Math.min(image.naturalWidth, image.naturalHeight);
    const nextName = normalizeEmojiName(file.name.replace(/\.[^.]+$/, ""));

    setEmojiName(nextName);
    setCrop({
      src,
      fileName: file.name,
      imageWidth: image.naturalWidth,
      imageHeight: image.naturalHeight,
      x: Math.round((image.naturalWidth - minSide) / 2),
      y: Math.round((image.naturalHeight - minSide) / 2),
      size: minSide,
    });
  }, []);

  const handleSaveCrop = useCallback(async () => {
    if (!crop) return;

    const name = normalizeEmojiName(emojiName) || "personal-emoji";
    const image = await loadImage(crop.src);
    const canvas = document.createElement("canvas");
    const outputSize = 128;
    canvas.width = outputSize;
    canvas.height = outputSize;

    const context = canvas.getContext("2d");
    if (!context) return;

    context.clearRect(0, 0, outputSize, outputSize);
    context.drawImage(image, crop.x, crop.y, crop.size, crop.size, 0, 0, outputSize, outputSize);

    const nextEmoji: PersonalEmojiPayload = {
      id: crypto.randomUUID(),
      name,
      src: canvas.toDataURL("image/png"),
      alt: `:${name}:`,
    };
    const withoutSameName = personalEmojis.filter((emoji) => emoji.name !== name);
    const nextItems = [nextEmoji, ...withoutSameName].slice(0, 48);

    setPersonalEmojis(nextItems);
    writePersonalEmojis(nextItems);
    setCrop(null);
    insertPersonalEmoji(editor, range, nextEmoji);
  }, [crop, editor, emojiName, personalEmojis, range]);

  if (crop) {
    return (
      <EmojiCropEditor
        crop={crop}
        emojiName={emojiName}
        onCropChange={setCrop}
        onEmojiNameChange={setEmojiName}
        onSave={handleSaveCrop}
        onCancel={() => setCrop(null)}
      />
    );
  }

  return (
    <EmojiPickerGrid
      gridItems={gridItems}
      selectedIndex={selectedIndex}
      activeCategory={activeCategory}
      normalizedQuery={normalizedQuery}
      itemRefs={itemRefs}
      fileInputRef={fileInputRef}
      onSelect={handleSelect}
      onHover={setSelectedIndex}
      onCategoryChange={setActiveCategory}
      onFileChange={(file) => void handleFileSelect(file)}
    />
  );
});
