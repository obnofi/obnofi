import { SelectOptionColor, SelectOption } from "@obnofi/types";

export const SELECT_OPTION_COLORS: Record<SelectOptionColor, string> = {
  default: "#E3E2E0",
  gray: "#E3E2E0",
  brown: "#EEE0DA",
  orange: "#FADEC9",
  yellow: "#FDECC8",
  green: "#DBEDDB",
  blue: "#D3E5EF",
  purple: "#E8DEEE",
  pink: "#F4E0E9",
  red: "#FFE2DD",
};

export const SELECT_OPTION_TEXT_COLORS: Record<SelectOptionColor, string> = {
  default: "#37352F",
  gray: "#37352F",
  brown: "#43302B",
  orange: "#594A3C",
  yellow: "#594A3C",
  green: "#2E4435",
  blue: "#364954",
  purple: "#443A57",
  pink: "#533B4C",
  red: "#5C3B39",
};

export function getRandomOptionColor(): SelectOptionColor {
  const colors: SelectOptionColor[] = [
    "gray", "brown", "orange", "yellow", "green", "blue", "purple", "pink", "red",
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}

export function createSelectOption(
  label: string,
  color?: SelectOptionColor
): SelectOption {
  return {
    id: `opt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    label,
    color: color ?? getRandomOptionColor(),
  };
}

export function getOptionBgColor(color: SelectOptionColor): string {
  return SELECT_OPTION_COLORS[color] ?? SELECT_OPTION_COLORS.default;
}

export function getOptionTextColor(color: SelectOptionColor): string {
  return SELECT_OPTION_TEXT_COLORS[color] ?? SELECT_OPTION_TEXT_COLORS.default;
}
