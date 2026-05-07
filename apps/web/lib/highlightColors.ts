import type { PageHighlightColor } from "@obnofi/types";

export const PAGE_HIGHLIGHT_COLOR_NAMES: PageHighlightColor[] = [
  "yellow",
  "green",
  "blue",
  "purple",
  "pink",
  "red",
  "orange",
];

function parseRgbString(color: string): [number, number, number] | null {
  const match = color.match(/\d+(\.\d+)?/g);
  if (!match || match.length < 3) {
    return null;
  }

  return [
    Number.parseFloat(match[0]),
    Number.parseFloat(match[1]),
    Number.parseFloat(match[2]),
  ];
}

function rgbToHsl(r: number, g: number, b: number) {
  const red = r / 255;
  const green = g / 255;
  const blue = b / 255;
  const max = Math.max(red, green, blue);
  const min = Math.min(red, green, blue);
  const lightness = (max + min) / 2;

  if (max === min) {
    return { saturation: 0, lightness };
  }

  const delta = max - min;
  const saturation =
    lightness > 0.5 ? delta / (2 - max - min) : delta / (max + min);

  return { saturation, lightness };
}

function toLinearChannel(value: number) {
  const normalized = value / 255;
  return normalized <= 0.03928
    ? normalized / 12.92
    : ((normalized + 0.055) / 1.055) ** 2.4;
}

function relativeLuminance(r: number, g: number, b: number) {
  const red = toLinearChannel(r);
  const green = toLinearChannel(g);
  const blue = toLinearChannel(b);
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}

export function getAutoHighlightContrastColor(color: string) {
  const rgb = parseRgbString(color);
  if (!rgb) {
    return "#111110";
  }

  const [r, g, b] = rgb;
  const { saturation } = rgbToHsl(r, g, b);
  const luminance = relativeLuminance(r, g, b);

  if (saturation < 0.42) {
    return luminance > 0.35 ? "#111110" : "#FFFCED";
  }

  return luminance > 0.42 ? "#111110" : "#FFFCED";
}
