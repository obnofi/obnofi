import {
  Column,
  ColumnType,
  Database,
  DatabasePage,
  Page,
  PropertyValue,
  SelectOption,
  View,
} from "@obnofi/types";
import { ViewType } from "@obnofi/types/database";

interface MockDbStore {
  pages: Map<string, Page>;
  databases: Map<string, Database>;
  views: Map<string, View>;
  columns: Map<string, Column>;
  propertyValues: Map<string, PropertyValue>;
  seeded: boolean;
}

const globalMockDb = globalThis as typeof globalThis & {
  __obnofiMockDbStore?: MockDbStore;
};

function createInitialStore(): MockDbStore {
  return {
    pages: new Map(),
    databases: new Map(),
    views: new Map(),
    columns: new Map(),
    propertyValues: new Map(),
    seeded: true,
  };
}

const store = globalMockDb.__obnofiMockDbStore ?? createInitialStore();
globalMockDb.__obnofiMockDbStore = store;

const mockPages = store.pages;
const mockDatabases = store.databases;
const mockViews = store.views;
const mockColumns = store.columns;
const mockPropertyValues = store.propertyValues;

export const mockDb = {
  pages: {
    get: (id: string): Page | undefined => mockPages.get(id),
    getAll: (): Page[] => Array.from(mockPages.values()),
    getByWorkspace: (workspaceId: string): Page[] => {
      return Array.from(mockPages.values()).filter(
        (p) => p.workspaceId === workspaceId && !p.parentDatabaseId
      );
    },
    create: (data: Omit<Page, "id" | "createdAt" | "updatedAt">): Page => {
      const id = `page-${Date.now()}`;
      const now = new Date().toISOString();
      const page: Page = {
        ...data,
        id,
        createdAt: now,
        updatedAt: now,
      };
      mockPages.set(id, page);
      return page;
    },
    update: (id: string, data: Partial<Page>): Page | undefined => {
      const page = mockPages.get(id);
      if (!page) return undefined;
      const updated = { ...page, ...data, updatedAt: new Date().toISOString() };
      mockPages.set(id, updated);
      return updated;
    },
    delete: (id: string): boolean => {
      const children = Array.from(mockPages.values()).filter(
        (p) => p.parentId === id
      );
      children.forEach((child) => mockDb.pages.delete(child.id));
      const propertyValues = mockDb.propertyValues.getByPage(id);
      propertyValues.forEach((propertyValue) =>
        mockDb.propertyValues.delete(propertyValue.id)
      );
      return mockPages.delete(id);
    },
    getByShareId: (shareId: string): Page | undefined => {
      return Array.from(mockPages.values()).find((p) => p.shareId === shareId);
    },
    getByDatabase: (databaseId: string): Page[] => {
      return Array.from(mockPages.values()).filter(
        (p) => p.parentDatabaseId === databaseId
      );
    },
    getDatabasePage: (pageId: string): DatabasePage | undefined => {
      const page = mockPages.get(pageId);
      if (!page || page.type !== "database") {
        return undefined;
      }

      const database = mockDb.databases.getByPageId(pageId);
      if (!database) {
        return undefined;
      }

      return {
        ...page,
        database,
      };
    },
    getAncestors: (pageId: string): Array<{ id: string; title: string; icon?: string | null }> => {
      const ancestors: Array<{ id: string; title: string; icon?: string | null }> = [];
      const visited = new Set<string>();
      let currentId: string | null = pageId;

      while (currentId) {
        if (visited.has(currentId)) break;
        visited.add(currentId);

        const page = mockPages.get(currentId);
        if (!page) break;

        if (page.parentId) {
          const parent = mockPages.get(page.parentId);
          if (parent) {
            ancestors.unshift({ id: parent.id, title: parent.title, icon: parent.icon });
            currentId = parent.id;
          } else {
            break;
          }
        } else {
          break;
        }
      }

      return ancestors;
    },
  },

  databases: {
    get: (id: string): Database | undefined => {
      const db = mockDatabases.get(id);
      if (!db) return undefined;
      
      const columns = Array.from(mockColumns.values())
        .filter((c) => c.databaseId === id)
        .sort((a, b) => a.order - b.order);
      
      const rows = mockDb.pages.getByDatabase(id);
      const views = mockDb.views.getByDatabase(id);
      
      return {
        ...db,
        columns,
        properties: columns,
        rows: rows.map((row) => ({
          ...row,
          propertyValues: mockDb.propertyValues.getByPage(row.id),
        })),
        views,
      };
    },
    getByPageId: (pageId: string): Database | undefined => {
      const db = Array.from(mockDatabases.values()).find((d) => d.pageId === pageId);
      if (!db) return undefined;
      return mockDb.databases.get(db.id);
    },
    create: (pageId: string): Database => {
      const id = `db-${Date.now()}`;
      const database: Database = {
        id,
        pageId,
        columns: [],
        properties: [],
        rows: [],
      };
      mockDatabases.set(id, database);
      mockDb.views.create({
        databaseId: id,
        name: "Table",
        type: "table" as ViewType,
      });
      const page = mockDb.pages.get(pageId);
      if (page) {
        mockDb.pages.update(pageId, {
          databaseId: id,
        });
      }
      return database;
    },
    delete: (id: string): boolean => {
      mockDb.columns.getByDatabase(id).forEach((column) => {
        mockDb.columns.delete(column.id);
      });
      mockDb.pages.getByDatabase(id).forEach((row) => {
        mockDb.pages.delete(row.id);
      });
      mockDb.views.getByDatabase(id).forEach((view) => {
        mockDb.views.delete(view.id);
      });
      return mockDatabases.delete(id);
    },
  },

  views: {
    get: (id: string): View | undefined => mockViews.get(id),
    getByDatabase: (databaseId: string): View[] => {
      return Array.from(mockViews.values())
        .filter((v) => v.databaseId === databaseId)
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    },
    create: (data: {
      databaseId: string;
      name: string;
      type: ViewType;
      config?: View["config"];
    }): View => {
      const id = `view-${Date.now()}`;
      const now = new Date().toISOString();
      const view: View = {
        ...data,
        id,
        config: data.config || {
          visibleProperties: [],
          propertyWidths: {},
          sorts: [],
          filters: [],
        },
        createdAt: now,
        updatedAt: now,
      };
      mockViews.set(id, view);
      return view;
    },
    update: (id: string, data: Partial<Omit<View, "id" | "createdAt">>): View | undefined => {
      const view = mockViews.get(id);
      if (!view) return undefined;
      const updated = { ...view, ...data, updatedAt: new Date().toISOString() };
      mockViews.set(id, updated);
      return updated;
    },
    delete: (id: string): boolean => {
      return mockViews.delete(id);
    },
  },

  columns: {
    get: (id: string): Column | undefined => mockColumns.get(id),
    getByDatabase: (databaseId: string): Column[] => {
      return Array.from(mockColumns.values())
        .filter((c) => c.databaseId === databaseId)
        .sort((a, b) => a.order - b.order);
    },
    create: (data: {
      databaseId: string;
      name: string;
      type: ColumnType;
      options?: SelectOption[];
    }): Column => {
      const id = `col-${Date.now()}`;
      const existingColumns = mockDb.columns.getByDatabase(data.databaseId);
      const column: Column = {
        ...data,
        id,
        order: existingColumns.length,
      };
      mockColumns.set(id, column);
      return column;
    },
    update: (id: string, data: Partial<Column>): Column | undefined => {
      const column = mockColumns.get(id);
      if (!column) return undefined;
      const updated = { ...column, ...data };
      mockColumns.set(id, updated);
      return updated;
    },
    delete: (id: string): boolean => {
      const propertyValues = mockDb.propertyValues.getByColumn(id);
      propertyValues.forEach((propertyValue) =>
        mockDb.propertyValues.delete(propertyValue.id)
      );
      return mockColumns.delete(id);
    },
  },

  propertyValues: {
    get: (id: string): PropertyValue | undefined => mockPropertyValues.get(id),
    getByPage: (pageId: string): PropertyValue[] => {
      return Array.from(mockPropertyValues.values()).filter(
        (pv) => pv.pageId === pageId
      );
    },
    getByColumn: (columnId: string): PropertyValue[] => {
      return Array.from(mockPropertyValues.values()).filter(
        (pv) => pv.columnId === columnId
      );
    },
    getByPageAndColumn: (pageId: string, columnId: string): PropertyValue | undefined => {
      return Array.from(mockPropertyValues.values()).find(
        (pv) => pv.pageId === pageId && pv.columnId === columnId
      );
    },
    create: (data: {
      pageId: string;
      columnId: string;
      value: PropertyValue["value"];
    }): PropertyValue => {
      const id = `pv-${Date.now()}`;
      const propertyValue: PropertyValue = {
        ...data,
        propertyId: data.columnId,
        id,
      };
      mockPropertyValues.set(id, propertyValue);
      return propertyValue;
    },
    update: (id: string, data: { value: PropertyValue["value"] }): PropertyValue | undefined => {
      const pv = mockPropertyValues.get(id);
      if (!pv) return undefined;
      const updated = { ...pv, ...data };
      mockPropertyValues.set(id, updated);
      return updated;
    },
    upsert: (pageId: string, propertyId: string, value: PropertyValue["value"]): PropertyValue => {
      const existing = mockDb.propertyValues.getByPageAndColumn(pageId, propertyId);
      if (existing) {
        return mockDb.propertyValues.update(existing.id, { value })!;
      }
      return mockDb.propertyValues.create({ pageId, columnId: propertyId, value });
    },
    delete: (id: string): boolean => {
      return mockPropertyValues.delete(id);
    },
  },
};
