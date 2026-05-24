import type { ComponentType } from "react";
import {
  Clock3,
  Heart,
  Leaf,
  Smile,
  Wrench,
} from "lucide-react";
import type { PersonalEmojiPayload } from "@/components/editor/extensions/PersonalEmojiExtension";
import type { Editor } from "@tiptap/react";

export const PERSONAL_EMOJI_STORAGE_KEY = "obnofi.personalEmojis.v1";
export const CROP_STAGE_SIZE = 184;

export type EmojiCategoryId =
  | "recent"
  | "people"
  | "nature"
  | "objects"
  | "symbols";

export type BuiltinEmoji = {
  id: string;
  name: string;
  symbol: string;
  keywords: string[];
  group: EmojiCategoryId;
};

export type CropState = {
  src: string;
  fileName: string;
  imageWidth: number;
  imageHeight: number;
  x: number;
  y: number;
  size: number;
};

export type DragState = {
  pointerId: number;
  startX: number;
  startY: number;
  baseX: number;
  baseY: number;
  baseSize: number;
};

export type EmojiGridItem =
  | {
      id: string;
      label: string;
      kind: "personal";
      emoji: PersonalEmojiPayload;
    }
  | {
      id: string;
      label: string;
      kind: "builtin";
      emoji: BuiltinEmoji;
    };

export const EMOJI_CATEGORIES: Array<{
  id: EmojiCategoryId;
  label: string;
  icon: ComponentType<{ className?: string }>;
}> = [
  { id: "recent", label: "자주 사용", icon: Clock3 },
  { id: "people", label: "사람", icon: Smile },
  { id: "nature", label: "자연", icon: Leaf },
  { id: "objects", label: "물건", icon: Wrench },
  { id: "symbols", label: "기호", icon: Heart },
];

export const BUILTIN_EMOJIS: BuiltinEmoji[] = [
  { id: "relieved", name: "relieved", symbol: "☺️", group: "people", keywords: ["smile", "사람"] },
  { id: "kissing", name: "kissing", symbol: "😙", group: "people", keywords: ["kiss", "사람"] },
  { id: "person", name: "person", symbol: "🧍", group: "people", keywords: ["person", "사람"] },
  { id: "detective", name: "detective", symbol: "🕵️", group: "people", keywords: ["detective", "사람"] },
  { id: "shushing", name: "shushing", symbol: "🤫", group: "people", keywords: ["quiet", "사람"] },
  { id: "guard", name: "guard", symbol: "💂", group: "people", keywords: ["guard", "사람"] },
  { id: "standing", name: "standing", symbol: "🧍‍♂️", group: "people", keywords: ["stand", "사람"] },
  { id: "skier", name: "skier", symbol: "⛷️", group: "people", keywords: ["ski", "사람"] },
  { id: "neutral", name: "neutral", symbol: "😐", group: "people", keywords: ["neutral", "사람"] },
  { id: "bath", name: "bath", symbol: "🛀", group: "people", keywords: ["bath", "사람"] },
  { id: "brain", name: "brain", symbol: "🧠", group: "people", keywords: ["brain", "사람"] },
  { id: "spy", name: "spy", symbol: "🕵️‍♂️", group: "people", keywords: ["spy", "사람"] },
  { id: "walking", name: "walking", symbol: "🚶", group: "people", keywords: ["walk", "사람"] },
  { id: "smile", name: "smile", symbol: "🙂", group: "people", keywords: ["smile", "사람"] },
  { id: "laugh", name: "laugh", symbol: "😆", group: "people", keywords: ["laugh", "사람"] },
  { id: "angel", name: "angel", symbol: "😇", group: "people", keywords: ["angel", "사람"] },
  { id: "hug", name: "hug", symbol: "🫂", group: "people", keywords: ["hug", "사람"] },
  { id: "skull", name: "skull", symbol: "💀", group: "people", keywords: ["skull", "사람"] },
  { id: "clap", name: "clap", symbol: "👏", group: "people", keywords: ["hand", "박수"] },
  { id: "pray", name: "pray", symbol: "🙏", group: "people", keywords: ["hand", "기도"] },
  { id: "write", name: "write", symbol: "✍️", group: "people", keywords: ["hand", "쓰기"] },
  { id: "sparkles", name: "sparkles", symbol: "✨", group: "recent", keywords: ["sparkle", "반짝"] },
  { id: "burger", name: "burger", symbol: "🍔", group: "recent", keywords: ["food", "최근"] },
  { id: "star", name: "star", symbol: "🤩", group: "recent", keywords: ["star", "최근"] },
  { id: "party", name: "party", symbol: "🎉", group: "recent", keywords: ["party", "축하"] },
  { id: "cat", name: "cat", symbol: "😺", group: "nature", keywords: ["cat", "고양이"] },
  { id: "seed", name: "seed", symbol: "🌱", group: "nature", keywords: ["plant", "seed", "씨앗"] },
  { id: "tree", name: "tree", symbol: "🌳", group: "nature", keywords: ["jungle", "tree", "나무"] },
  { id: "leaf", name: "leaf", symbol: "🍃", group: "nature", keywords: ["leaf", "잎"] },
  { id: "fire", name: "fire", symbol: "🔥", group: "nature", keywords: ["hot", "fire", "불"] },
  { id: "rocket", name: "rocket", symbol: "🚀", group: "objects", keywords: ["ship", "launch", "출시"] },
  { id: "pin", name: "pin", symbol: "📌", group: "objects", keywords: ["pin", "고정"] },
  { id: "memo", name: "memo", symbol: "📝", group: "objects", keywords: ["memo", "note", "메모"] },
  { id: "calendar", name: "calendar", symbol: "📅", group: "objects", keywords: ["date", "calendar", "일정"] },
  { id: "link", name: "link", symbol: "🔗", group: "objects", keywords: ["link", "링크"] },
  { id: "lock", name: "lock", symbol: "🔒", group: "objects", keywords: ["lock", "잠금"] },
  { id: "light", name: "light", symbol: "💡", group: "objects", keywords: ["idea", "light", "아이디어"] },
  { id: "warning", name: "warning", symbol: "⚠️", group: "symbols", keywords: ["warn", "주의"] },
  { id: "check", name: "check", symbol: "✅", group: "symbols", keywords: ["done", "check", "완료"] },
  { id: "speech", name: "speech", symbol: "🗨️", group: "symbols", keywords: ["speech", "말풍선"] },
  { id: "heart", name: "heart", symbol: "💗", group: "symbols", keywords: ["heart", "하트"] },
  { id: "blue-heart", name: "blue-heart", symbol: "💙", group: "symbols", keywords: ["heart", "하트"] },
  { id: "green-heart", name: "green-heart", symbol: "💚", group: "symbols", keywords: ["heart", "하트"] },
];

export function normalizeEmojiName(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 32);
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function clampCrop(crop: CropState): CropState {
  const maxSize = Math.min(crop.imageWidth, crop.imageHeight);
  const minSize = Math.max(16, maxSize * 0.18);
  const size = clamp(crop.size, minSize, maxSize);

  return {
    ...crop,
    size,
    x: clamp(crop.x, 0, Math.max(0, crop.imageWidth - size)),
    y: clamp(crop.y, 0, Math.max(0, crop.imageHeight - size)),
  };
}

export function readPersonalEmojis(): PersonalEmojiPayload[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(PERSONAL_EMOJI_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item): item is PersonalEmojiPayload =>
        typeof item?.id === "string" &&
        typeof item?.name === "string" &&
        typeof item?.src === "string"
    );
  } catch {
    return [];
  }
}

export function writePersonalEmojis(items: PersonalEmojiPayload[]): void {
  window.localStorage.setItem(PERSONAL_EMOJI_STORAGE_KEY, JSON.stringify(items));
}

export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
  });
}

export function fileToDataUrl(file: File): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function insertBuiltinEmoji(
  editor: Editor,
  range: { from: number; to: number },
  symbol: string
): void {
  editor.chain().focus().deleteRange(range).insertContent(symbol).run();
}

export function insertPersonalEmoji(
  editor: Editor,
  range: { from: number; to: number },
  emoji: PersonalEmojiPayload
): void {
  editor
    .chain()
    .focus()
    .deleteRange(range)
    .insertCustomEmoji(emoji)
    .insertContent(" ")
    .run();
}
