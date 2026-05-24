import { PageType } from "@obnofi/types";

export const typeIcons: Record<PageType, string> = {
  document: "📄",
  canvas: "🎨",
  database: "🗄️",
};

export const typeLabels: Record<PageType, string> = {
  document: "Document",
  canvas: "Canvas",
  database: "Database",
};

export function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
