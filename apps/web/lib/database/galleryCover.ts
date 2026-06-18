import type { Page, Property } from "@obnofi/types";
import { getPropertyValueData } from "@/lib/database/tableAccessors";

type TiptapNode = {
  type?: unknown;
  attrs?: Record<string, unknown> | null;
  content?: unknown;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asNonEmptyString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function getNodeImageUrl(node: TiptapNode) {
  if (!isRecord(node.attrs)) {
    return null;
  }

  if (node.type === "groveImageBlock" || node.type === "image") {
    return asNonEmptyString(node.attrs.src);
  }

  return null;
}

function findFirstGroveImageUrl(value: unknown): string | null {
  if (Array.isArray(value)) {
    for (const item of value) {
      const imageUrl = findFirstGroveImageUrl(item);
      if (imageUrl) {
        return imageUrl;
      }
    }
    return null;
  }

  if (!isRecord(value)) {
    return null;
  }

  const nodeImageUrl = getNodeImageUrl(value);
  if (nodeImageUrl) {
    return nodeImageUrl;
  }

  return findFirstGroveImageUrl(value.content);
}

function getPropertyCoverUrl(row: Page, properties: Property[]) {
  const coverProperty = properties.find(
    (property) => property.type === "files" || property.type === "url"
  );

  if (!coverProperty) {
    return null;
  }

  const value = getPropertyValueData(row, coverProperty.id);
  if (!value) {
    return null;
  }

  if (value.type === "files") {
    return value.files[0]?.url ?? null;
  }

  if (value.type === "url") {
    return value.value || null;
  }

  return null;
}

export function getGalleryCoverUrl(row: Page, properties: Property[]) {
  return (
    asNonEmptyString(row.coverImage) ??
    getPropertyCoverUrl(row, properties) ??
    findFirstGroveImageUrl(row.content)
  );
}
