import type { StickyNoteColor } from "@/store/useElementStore";

export const STICKY_NOTE_COLORS: Record<
  StickyNoteColor,
  { surface: string; border: string; text: string; badge: string }
> = {
  yellow: { surface: "#FFF1A8", border: "#E8D56A", text: "#4D4113", badge: "#F3E17B" },
  pink:   { surface: "#FFD9E6", border: "#F1ABC0", text: "#5B2A3C", badge: "#F8C3D5" },
  green:  { surface: "#DDF2D8", border: "#A6D39A", text: "#1F4522", badge: "#CBE8C4" },
  blue:   { surface: "#DDF1FF", border: "#A8CFE8", text: "#1C4660", badge: "#C8E5FA" },
  purple: { surface: "#E9DDFE", border: "#C9B1EF", text: "#43305F", badge: "#DCCDFA" },
  orange: { surface: "#FFE0C2", border: "#F0B984", text: "#5D3A15", badge: "#F9CFAB" },
  gray:   { surface: "#ECECEC", border: "#CFCFCF", text: "#3C3C3C", badge: "#DADADA" },
  white:  { surface: "#FFFFFF", border: "#D7D7D7", text: "#2F2F2F", badge: "#F3F3F3" },
};

export const COLOR_ORDER: StickyNoteColor[] = [
  "yellow", "pink", "green", "blue", "purple", "orange", "gray", "white",
];
