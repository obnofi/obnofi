import {
  Column,
  ColumnType,
  Database,
  DatabasePage,
  Page,
  PropertyValue,
  SelectOption,
} from "@/types";

const mockPages: Map<string, Page> = new Map([
  [
    "page-1",
    {
      id: "page-1",
      title: "Getting Started",
      content: {
        type: "doc",
        content: [
          {
            type: "heading",
            attrs: { level: 1 },
            content: [{ type: "text", text: "Welcome to Obnofi" }],
          },
              {
                type: "paragraph",
                content: [
                  {
                    type: "text",
                    text: "This is a simple page to demonstrate the publishing feature. Link out to [[Child Page]] and [[Task 1]] to see the graph view populate.",
                  },
                ],
              },
          {
            type: "heading",
            attrs: { level: 2 },
            content: [{ type: "text", text: "Features" }],
          },
          {
            type: "bulletList",
            content: [
              {
                type: "listItem",
                content: [
                  {
                    type: "paragraph",
                    content: [{ type: "text", text: "Create and edit pages" }],
                  },
                ],
              },
              {
                type: "listItem",
                content: [
                  {
                    type: "paragraph",
                    content: [
                      { type: "text", text: "Publish pages with unique URLs" },
                    ],
                  },
                ],
              },
              {
                type: "listItem",
                content: [
                  {
                    type: "paragraph",
                    content: [
                      {
                        type: "text",
                        text: "Password protection for sensitive content",
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
      type: "document",
      icon: null,
      parentId: null,
      workspaceId: "ws-1",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isPublic: false,
      shareId: null,
      sharePassword: null,
    },
  ],
  [
    "page-2",
    {
      id: "page-2",
      title: "Project Canvas",
      content: null,
      type: "canvas",
      icon: null,
      parentId: null,
      workspaceId: "ws-1",
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      updatedAt: new Date(Date.now() - 86400000).toISOString(),
      isPublic: false,
      shareId: null,
      sharePassword: null,
    },
  ],
  [
    "page-3",
    {
      id: "page-3",
      title: "Tasks Database",
      content: null,
      type: "database",
      icon: null,
      parentId: null,
      workspaceId: "ws-1",
      createdAt: new Date(Date.now() - 172800000).toISOString(),
      updatedAt: new Date(Date.now() - 172800000).toISOString(),
      isPublic: false,
      shareId: null,
      sharePassword: null,
    },
  ],
  [
    "page-4",
    {
      id: "page-4",
      title: "Child Page",
      content: {
        type: "doc",
        content: [
          {
            type: "paragraph",
            content: [
              {
                type: "text",
                text: "This is a child page under Getting Started. It also points back to [[Getting Started]].",
              },
            ],
          },
        ],
      },
      type: "document",
      icon: null,
      parentId: "page-1",
      workspaceId: "ws-1",
      createdAt: new Date(Date.now() - 100000).toISOString(),
      updatedAt: new Date(Date.now() - 100000).toISOString(),
      isPublic: false,
      shareId: null,
      sharePassword: null,
    },
  ],
  [
    "page-5",
    {
      id: "page-5",
      title: "Task 1",
      content: {
        type: "doc",
        content: [
          {
            type: "paragraph",
            content: [
              {
                type: "text",
                text: "First task in the database. Related note: [[Getting Started]].",
              },
            ],
          },
        ],
      },
      type: "document",
      icon: null,
      parentId: "page-3",
      workspaceId: "ws-1",
      databaseId: "db-1",
      parentDatabaseId: "db-1",
      createdAt: new Date(Date.now() - 200000).toISOString(),
      updatedAt: new Date(Date.now() - 200000).toISOString(),
      isPublic: false,
      shareId: null,
      sharePassword: null,
    },
  ],
  [
    "page-6",
    {
      id: "page-6",
      title: "Task 2",
      content: {
        type: "doc",
        content: [
          {
            type: "paragraph",
            content: [{ type: "text", text: "Second task in the database." }],
          },
        ],
      },
      type: "document",
      icon: null,
      parentId: "page-3",
      workspaceId: "ws-1",
      databaseId: "db-1",
      parentDatabaseId: "db-1",
      createdAt: new Date(Date.now() - 300000).toISOString(),
      updatedAt: new Date(Date.now() - 300000).toISOString(),
      isPublic: false,
      shareId: null,
      sharePassword: null,
    },
  ],
]);

// Mock Database Storage
const mockDatabases: Map<string, Database> = new Map([
  [
    "db-1",
    {
      id: "db-1",
      pageId: "page-3",
      columns: [],
      rows: [],
    },
  ],
]);

const mockColumns: Map<string, Column> = new Map([
  [
    "col-1",
    {
      id: "col-1",
      databaseId: "db-1",
      name: "Status",
      type: "select",
      order: 0,
      options: [
        { id: "opt-1", label: "To Do", color: "#E3E2E0" },
        { id: "opt-2", label: "In Progress", color: "#FDECC8" },
        { id: "opt-3", label: "Done", color: "#DBEDDB" },
      ],
    },
  ],
  [
    "col-2",
    {
      id: "col-2",
      databaseId: "db-1",
      name: "Priority",
      type: "select",
      order: 1,
      options: [
        { id: "opt-4", label: "Low", color: "#E3E2E0" },
        { id: "opt-5", label: "Medium", color: "#FDECC8" },
        { id: "opt-6", label: "High", color: "#FFE2DD" },
      ],
    },
  ],
  [
    "col-3",
    {
      id: "col-3",
      databaseId: "db-1",
      name: "Due Date",
      type: "date",
      order: 2,
    },
  ],
  [
    "col-4",
    {
      id: "col-4",
      databaseId: "db-1",
      name: "Assignee",
      type: "person",
      order: 3,
    },
  ],
]);

const mockPropertyValues: Map<string, PropertyValue> = new Map([
  [
    "pv-1",
    {
      id: "pv-1",
      pageId: "page-5",
      columnId: "col-1",
      value: { type: "select", optionId: "opt-2" },
    },
  ],
  [
    "pv-2",
    {
      id: "pv-2",
      pageId: "page-5",
      columnId: "col-2",
      value: { type: "select", optionId: "opt-6" },
    },
  ],
  [
    "pv-3",
    {
      id: "pv-3",
      pageId: "page-6",
      columnId: "col-1",
      value: { type: "select", optionId: "opt-1" },
    },
  ],
  [
    "pv-4",
    {
      id: "pv-4",
      pageId: "page-6",
      columnId: "col-2",
      value: { type: "select", optionId: "opt-5" },
    },
  ],
]);

function createDefaultColumns(databaseId: string) {
  mockDb.columns.create({
    databaseId,
    name: "Status",
    type: "select",
    options: [
      { id: `opt-${Date.now()}-todo`, label: "To Do", color: "#E3E2E0" },
      { id: `opt-${Date.now()}-progress`, label: "In Progress", color: "#FDECC8" },
      { id: `opt-${Date.now()}-done`, label: "Done", color: "#DBEDDB" },
    ],
  });

  mockDb.columns.create({
    databaseId,
    name: "Notes",
    type: "text",
  });
}

export const mockDb = {
  pages: {
    get: (id: string): Page | undefined => mockPages.get(id),
    getAll: (): Page[] => Array.from(mockPages.values()),
    getByWorkspace: (workspaceId: string): Page[] => {
      return Array.from(mockPages.values()).filter(
        (p) => p.workspaceId === workspaceId
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
  },

  databases: {
    get: (id: string): Database | undefined => {
      const db = mockDatabases.get(id);
      if (!db) return undefined;
      
      const columns = Array.from(mockColumns.values())
        .filter((c) => c.databaseId === id)
        .sort((a, b) => a.order - b.order);
      
      const rows = mockDb.pages.getByDatabase(id);
      
      return {
        ...db,
        columns,
        rows: rows.map((row) => ({
          ...row,
          propertyValues: mockDb.propertyValues.getByPage(row.id),
        })),
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
        rows: [],
      };
      mockDatabases.set(id, database);
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
      return mockDatabases.delete(id);
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
    upsert: (pageId: string, columnId: string, value: PropertyValue["value"]): PropertyValue => {
      const existing = mockDb.propertyValues.getByPageAndColumn(pageId, columnId);
      if (existing) {
        return mockDb.propertyValues.update(existing.id, { value })!;
      }
      return mockDb.propertyValues.create({ pageId, columnId, value });
    },
    delete: (id: string): boolean => {
      return mockPropertyValues.delete(id);
    },
  },
};

const seededDatabase = mockDb.databases.get("db-1");
if (seededDatabase && seededDatabase.columns.length === 0) {
  createDefaultColumns(seededDatabase.id);
}
