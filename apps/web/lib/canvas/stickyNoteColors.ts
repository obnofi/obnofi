import type { StickyNoteColor } from "@/store/useElementStore";

export const STICKY_NOTE_COLORS: Record<
  StickyNoteColor,
  { surface: string; border: string; text: string; badge: string }
> = {
  yellow: { surface: "#FFEEA0", border: "#D4B440", text: "#4A3808", badge: "#FFE470" }, // 바나나 선샤인
  pink:   { surface: "#FFD0D8", border: "#E88498", text: "#5C1A2A", badge: "#F5B8C8" }, // 히비스커스
  green:  { surface: "#CEEABC", border: "#72B854", text: "#1A4010", badge: "#B8DCA0" }, // 야자수 잎
  blue:   { surface: "#B8EDE8", border: "#48A898", text: "#0A3830", badge: "#98E0D8" }, // 석호(라군)
  purple: { surface: "#E8CCFF", border: "#B078E0", text: "#3A1260", badge: "#D8B8F8" }, // 난초
  orange: { surface: "#FFD8A0", border: "#E8A040", text: "#5A3200", badge: "#FFC870" }, // 망고
  gray:   { surface: "#E8DCC0", border: "#C0A870", text: "#3B3224", badge: "#D8C8A8" }, // 유목(드리프트우드)
  white:  { surface: "#FAF4E4", border: "#D8C898", text: "#3B3224", badge: "#F0EAD4" }, // 코코넛 크림
};

export const COLOR_ORDER: StickyNoteColor[] = [
  "yellow", "pink", "green", "blue", "purple", "orange", "gray", "white",
];
