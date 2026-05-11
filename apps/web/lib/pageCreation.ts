import type { PageType } from "@obnofi/types";

export const creatablePageTypes = ["document", "canvas", "database"] as const satisfies ReadonlyArray<PageType>;

export const createPageTitles: Record<PageType, string> = {
  document: "New Page",
  canvas: "New Clearing",
  database: "New Database",
};

export const creatablePageLabels: Record<(typeof creatablePageTypes)[number], string> = {
  document: "Page",
  canvas: "Canvas",
  database: "DB",
};
