"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { ColumnType, DatabasePage, PropertyValueData } from "@/types";
import { TableView } from "@/components/database/TableView";
import { useDatabaseStore } from "@/store/useDatabaseStore";

interface DatabaseWorkspaceProps {
  pageId: string;
  workspaceId: string;
}

export function DatabaseWorkspace({
  pageId,
  workspaceId,
}: DatabaseWorkspaceProps) {
  const router = useRouter();
  const { searchQuery, setSearchQuery } = useDatabaseStore();
  const [databasePage, setDatabasePage] = useState<DatabasePage | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadDatabase = useCallback(async () => {
    setIsLoading(true);
    const response = await fetch(`/api/pages/${pageId}?view=full`);
    if (!response.ok) {
      setDatabasePage(null);
      setIsLoading(false);
      return;
    }

    const data = (await response.json()) as DatabasePage;
    setDatabasePage(data);
    setIsLoading(false);
  }, [pageId]);

  useEffect(() => {
    void loadDatabase();
  }, [loadDatabase]);

  const filteredRows = useMemo(() => {
    if (!databasePage) {
      return [];
    }

    const query = searchQuery.trim().toLowerCase();
    if (!query) {
      return databasePage.database.rows;
    }

    return databasePage.database.rows.filter((row) => {
      const matchesTitle = row.title.toLowerCase().includes(query);
      const matchesProperty = row.propertyValues?.some((propertyValue) => {
        const value = propertyValue.value;
        if ("value" in value && typeof value.value === "string") {
          return value.value.toLowerCase().includes(query);
        }

        return false;
      });

      return matchesTitle || matchesProperty;
    });
  }, [databasePage, searchQuery]);

  const handleCreateRow = async () => {
    if (!databasePage) {
      return;
    }

    await fetch(`/api/databases/${databasePage.database.id}/rows`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Untitled" }),
    });

    await loadDatabase();
  };

  const handleCreateColumnWithConfig = async ({
    name,
    type,
  }: {
    name: string;
    type: ColumnType;
  }) => {
    if (!databasePage) {
      return;
    }

    await fetch(`/api/databases/${databasePage.database.id}/columns`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        type,
      }),
    });

    await loadDatabase();
  };

  const handleOpenRow = (rowId: string) => {
    router.push(`/workspace/${workspaceId}?page=${rowId}`);
  };

  const handleUpdateRowTitle = async (rowId: string, title: string) => {
    await fetch(`/api/pages/${rowId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title }),
    });

    setDatabasePage((current) => {
      if (!current) {
        return current;
      }

      return {
        ...current,
        database: {
          ...current.database,
          rows: current.database.rows.map((row) =>
            row.id === rowId ? { ...row, title } : row
          ),
        },
      };
    });
  };

  const handleUpdatePropertyValue = async (
    rowId: string,
    columnId: string,
    value: PropertyValueData
  ) => {
    const response = await fetch("/api/property-values", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        pageId: rowId,
        columnId,
        value,
      }),
    });

    if (!response.ok) {
      return;
    }

    const updatedPropertyValue = await response.json();

    setDatabasePage((current) => {
      if (!current) {
        return current;
      }

      return {
        ...current,
        database: {
          ...current.database,
          rows: current.database.rows.map((row) => {
            if (row.id !== rowId) {
              return row;
            }

            const propertyValues = row.propertyValues ?? [];
            const existingIndex = propertyValues.findIndex(
              (propertyValue) => propertyValue.columnId === columnId
            );

            if (existingIndex === -1) {
              return {
                ...row,
                propertyValues: [...propertyValues, updatedPropertyValue],
              };
            }

            return {
              ...row,
              propertyValues: propertyValues.map((propertyValue, index) =>
                index === existingIndex ? updatedPropertyValue : propertyValue
              ),
            };
          }),
        },
      };
    });
  };

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-300 border-t-[#2E7D45]" />
      </div>
    );
  }

  if (!databasePage) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-zinc-500 dark:text-zinc-400">
        Database not found
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-zinc-200 px-6 py-5 dark:border-zinc-800">
        <div className="mb-4">
          <h1 className="text-3xl font-semibold tracking-tight text-[#111110] dark:text-zinc-100">
            {databasePage.title}
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Rows are pages. Open any row to edit its content like a normal document.
          </p>
        </div>

        <div className="flex items-center gap-2 rounded-md bg-zinc-100 px-3 py-2 dark:bg-zinc-900">
          <Search className="h-4 w-4 text-zinc-400" />
          <input
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search rows"
            className="w-full bg-transparent text-sm text-[#111110] outline-none placeholder:text-zinc-400 dark:text-zinc-100"
          />
        </div>
      </div>

      <div className="min-h-0 flex-1">
        <TableView
          columns={databasePage.database.columns}
          rows={filteredRows}
          onCreateRow={handleCreateRow}
          onCreateColumn={handleCreateColumnWithConfig}
          onOpenRow={handleOpenRow}
          onUpdateRowTitle={handleUpdateRowTitle}
          onUpdatePropertyValue={handleUpdatePropertyValue}
        />
      </div>
    </div>
  );
}
