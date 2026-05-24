import {
  SelectOptionColor,
  SelectOption,
  SELECT_OPTION_COLORS,
  SELECT_OPTION_TEXT_COLORS,
} from "@obnofi/types/database";

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
