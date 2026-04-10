export type PageType = "document" | "canvas" | "database";

export interface Page {
  id: string;
  title: string;
  content: object | null;
  type: PageType;
  icon?: string | null;
  parentId: string | null;
  workspaceId: string;
  createdAt: string;
  updatedAt: string;
  isPublic: boolean;
  shareId: string | null;
  sharePassword: string | null;
  databaseId?: string | null;
  parentDatabaseId?: string | null;
  propertyValues?: PropertyValue[];
}

export interface PublicPageResponse {
  id: string;
  title: string;
  content: object | null;
  isPasswordProtected: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ShareSettings {
  isPublic: boolean;
  password?: string;
}

export interface CreatePageInput {
  title: string;
  type: PageType;
  parentId?: string | null;
  workspaceId: string;
  databaseId?: string | null;
}

export interface UpdatePageInput {
  title?: string;
  content?: object | null;
  icon?: string | null;
  parentId?: string | null;
  isPublic?: boolean;
}

// Database Types
export type ColumnType = 
  | "text" 
  | "number" 
  | "select" 
  | "multi_select" 
  | "date" 
  | "person" 
  | "checkbox" 
  | "url" 
  | "email";

export interface Column {
  id: string;
  databaseId: string;
  name: string;
  type: ColumnType;
  options?: SelectOption[];
  order: number;
}

export interface SelectOption {
  id: string;
  label: string;
  color: string;
}

export interface PropertyValue {
  id: string;
  pageId: string;
  columnId: string;
  value: PropertyValueData;
}

export type PropertyValueData =
  | { type: "text"; value: string }
  | { type: "number"; value: number | null }
  | { type: "select"; optionId: string | null }
  | { type: "multi_select"; optionIds: string[] }
  | { type: "date"; value: string | null }
  | { type: "person"; userId: string | null }
  | { type: "checkbox"; value: boolean }
  | { type: "url"; value: string }
  | { type: "email"; value: string };

export interface Database {
  id: string;
  pageId: string;
  columns: Column[];
  rows: Page[];
}

export interface DatabasePage extends Page {
  database: Database;
}

export interface CreateColumnInput {
  databaseId: string;
  name: string;
  type: ColumnType;
  options?: SelectOption[];
}

export interface UpdateColumnInput {
  name?: string;
  type?: ColumnType;
  options?: SelectOption[];
  order?: number;
}

export interface CreatePropertyValueInput {
  pageId: string;
  columnId: string;
  value: PropertyValueData;
}

export interface UpdatePropertyValueInput {
  value: PropertyValueData;
}

// View Types
export type ViewMode = "table" | "kanban" | "calendar" | "gallery";

export interface DatabaseViewState {
  viewMode: ViewMode;
  sortColumnId?: string;
  sortDirection: "asc" | "desc";
  filterColumnId?: string;
  filterValue?: string;
  groupByColumnId?: string;
  searchQuery: string;
}
