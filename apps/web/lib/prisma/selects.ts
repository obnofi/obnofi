export const PAGE_INCLUDE = {
  database: { select: { id: true } },
  yjsDocument: { select: { updatedAt: true } },
} as const;

export const PAGE_DETAIL_SELECT = {
  id: true, title: true, groveTitleLevel: true, bodyFontSizePt: true,
  heading1FontSizePt: true, heading2FontSizePt: true, heading3FontSizePt: true,
  heading4FontSizePt: true, heading5FontSizePt: true, highlightColors: true,
  content: true, type: true, icon: true, coverImage: true, parentId: true,
  order: true, workspaceId: true, parentDatabaseId: true, isPublic: true,
  shareId: true, sharePassword: true, collaborationEnabled: true,
  lineIndicatorEnabled: true, createdAt: true, updatedAt: true,
  database: { select: { id: true } },
  yjsDocument: { select: { updatedAt: true } },
} as const;

export const PAGE_SELECT = {
  id: true, title: true, groveTitleLevel: true, bodyFontSizePt: true,
  heading1FontSizePt: true, heading2FontSizePt: true, heading3FontSizePt: true,
  heading4FontSizePt: true, heading5FontSizePt: true, highlightColors: true,
  type: true, icon: true, coverImage: true, parentId: true,
  order: true, workspaceId: true, parentDatabaseId: true, isPublic: true,
  shareId: true, sharePassword: true, collaborationEnabled: true,
  lineIndicatorEnabled: true, createdAt: true, updatedAt: true,
  database: { select: { id: true } },
  yjsDocument: { select: { updatedAt: true } },
} as const;

export const PAGE_GRAPH_SELECT = { ...PAGE_SELECT, content: true } as const;

export const PAGE_SELECT_WITH_PROPERTY_VALUES = {
  ...PAGE_SELECT,
  propertyValues: true,
} as const;
