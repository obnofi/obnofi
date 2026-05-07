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

export const creatablePageDescriptions: Record<(typeof creatablePageTypes)[number], string> = {
  document: "텍스트와 블록으로 문서를 작성합니다.",
  canvas: "자유 배치형 Clearing에서 시각적으로 정리합니다.",
  database: "Trait와 View를 가진 Undergrowth를 만듭니다.",
};
