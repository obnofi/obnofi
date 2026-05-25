import type { GroveTitleLevel, HeadingLevel, PageHighlightColor } from "@obnofi/types";

const ALLOWED_HIGHLIGHT_COLORS: PageHighlightColor[] = [
  "yellow", "green", "blue", "purple", "pink", "red", "orange",
];

export function validatePatchBody(body: Record<string, unknown>): string | null {
  if ("groveTitleLevel" in body && ![1, 2, 3, 4, 5].includes(body.groveTitleLevel as number)) {
    return "groveTitleLevel must be an integer between 1 and 5";
  }

  if ("bodyFontSizePt" in body) {
    const v = body.bodyFontSizePt as number;
    if (!Number.isInteger(v) || v < 8 || v > 32) {
      return "bodyFontSizePt must be an integer between 8 and 32";
    }
  }

  if ("headingFontSizes" in body) {
    const entries = Object.entries((body.headingFontSizes ?? {}) as Record<string, unknown>);
    const badKey = entries.some(([k]) => !["h1", "h2", "h3", "h4", "h5"].includes(k));
    const badVal = entries.some(([, v]) => !Number.isInteger(v) || Number(v) < 8 || Number(v) > 48);
    if (badKey || badVal) {
      return "headingFontSizes must contain h1~h5 integers between 8 and 48";
    }
  }

  if ("highlightColors" in body) {
    const colors = body.highlightColors as unknown[];
    if (
      !Array.isArray(colors) ||
      colors.length === 0 ||
      !colors.every((c) => ALLOWED_HIGHLIGHT_COLORS.includes(c as PageHighlightColor))
    ) {
      return "highlightColors must be a non-empty array of allowed colors";
    }
  }

  return null;
}

export function buildPageUpdateData(
  body: Record<string, unknown>,
  normalizedContent: unknown
): Record<string, unknown> {
  const data: Record<string, unknown> = {};

  if ("title" in body) data.title = body.title;
  if ("groveTitleLevel" in body) data.groveTitleLevel = body.groveTitleLevel as GroveTitleLevel;
  if ("bodyFontSizePt" in body) data.bodyFontSizePt = body.bodyFontSizePt;
  if ("headingFontSizes" in body) {
    const h = body.headingFontSizes as Partial<Record<`h${HeadingLevel}`, number>>;
    if ("h1" in h) data.heading1FontSizePt = h.h1;
    if ("h2" in h) data.heading2FontSizePt = h.h2;
    if ("h3" in h) data.heading3FontSizePt = h.h3;
    if ("h4" in h) data.heading4FontSizePt = h.h4;
    if ("h5" in h) data.heading5FontSizePt = h.h5;
  }
  if ("highlightColors" in body) data.highlightColors = body.highlightColors;
  if ("content" in body) data.content = normalizedContent;
  if ("icon" in body) data.icon = body.icon;
  if ("coverImage" in body) data.coverImage = body.coverImage;
  if ("parentId" in body) data.parentId = body.parentId;
  if ("order" in body) data.order = body.order;
  if ("isPublic" in body) data.isPublic = body.isPublic;
  if ("collaborationEnabled" in body) data.collaborationEnabled = Boolean(body.collaborationEnabled);
  if ("lineIndicatorEnabled" in body) data.lineIndicatorEnabled = Boolean(body.lineIndicatorEnabled);

  return data;
}
