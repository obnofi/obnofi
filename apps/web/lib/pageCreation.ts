import type { PageType } from "@obnofi/types";

export const creatablePageTypes = ["document", "canvas", "database", "mindmap"] as const satisfies ReadonlyArray<PageType>;

export const sidebarCreatablePageTypes = creatablePageTypes.filter(
  (type) => type !== "mindmap"
) as ReadonlyArray<Exclude<(typeof creatablePageTypes)[number], "mindmap">>;

export const createPageTitles: Record<PageType, string> = {
  document: "New Page",
  canvas: "New Clearing",
  database: "New Database",
  mindmap: "New Mind Map",
};

export const creatablePageLabels: Record<(typeof creatablePageTypes)[number], string> = {
  document: "Page",
  canvas: "Canvas",
  database: "DB",
  mindmap: "Map",
};
