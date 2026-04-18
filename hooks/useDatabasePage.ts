"use client";

import { useCallback, useEffect, useState } from "react";
import type {
  DatabasePage,
  PropertyType,
  PropertyValueData,
  SelectOption,
} from "@/types";

interface CreatePropertyInput {
  name: string;
  type: PropertyType;
  options?: SelectOption[];
}

interface UpdatePropertyInput {
  name?: string;
  type?: PropertyType;
  options?: SelectOption[];
}

export function useDatabasePage(pageId: string | null | undefined) {
  const [databasePage, setDatabasePage] = useState<DatabasePage | null>(null);
  const [isLoading, setIsLoading] = useState(Boolean(pageId));

  const loadDatabasePage = useCallback(async () => {
    if (!pageId) {
      setDatabasePage(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const response = await fetch(`/api/pages/${pageId}?view=full`);
    if (!response.ok) {
      setDatabasePage(null);
      setIsLoading(false);
      return;
    }

    const page = (await response.json()) as DatabasePage;
    setDatabasePage(page);
    setIsLoading(false);
  }, [pageId]);

  useEffect(() => {
    void loadDatabasePage();
  }, [loadDatabasePage]);

  const updateDatabaseTitle = useCallback(
    async (title: string) => {
      if (!pageId) {
        return;
      }

      await fetch(`/api/pages/${pageId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
      });

      setDatabasePage((current) =>
        current ? { ...current, title } : current
      );
    },
    [pageId]
  );

  const createRow = useCallback(async () => {
    if (!databasePage) {
      return;
    }

    await fetch(`/api/databases/${databasePage.database.id}/rows`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Untitled" }),
    });

    await loadDatabasePage();
  }, [databasePage, loadDatabasePage]);

  const createProperty = useCallback(
    async (input: CreatePropertyInput) => {
      if (!databasePage) {
        return;
      }

      await fetch(`/api/databases/${databasePage.database.id}/columns`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });

      await loadDatabasePage();
    },
    [databasePage, loadDatabasePage]
  );

  const updateProperty = useCallback(
    async (propertyId: string, input: UpdatePropertyInput) => {
      const response = await fetch(`/api/columns/${propertyId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });

      if (!response.ok) {
        return;
      }

      const updatedProperty = await response.json();

      setDatabasePage((current) => {
        if (!current) {
          return current;
        }

        const nextProperties = current.database.properties.map((property) =>
          property.id === propertyId ? updatedProperty : property
        );

        return {
          ...current,
          database: {
            ...current.database,
            properties: nextProperties,
            columns: nextProperties,
          },
        };
      });
    },
    []
  );

  const deleteProperty = useCallback(async (propertyId: string) => {
    const response = await fetch(`/api/columns/${propertyId}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      return;
    }

    setDatabasePage((current) => {
      if (!current) {
        return current;
      }

      const nextProperties = current.database.properties.filter(
        (property) => property.id !== propertyId
      );

      return {
        ...current,
        database: {
          ...current.database,
          properties: nextProperties,
          columns: nextProperties,
        },
      };
    });
  }, []);

  const updateRowTitle = useCallback(async (rowId: string, title: string) => {
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
  }, []);

  const updatePropertyValue = useCallback(
    async (rowId: string, propertyId: string, value: PropertyValueData) => {
      const response = await fetch("/api/property-values", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pageId: rowId,
          columnId: propertyId,
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
                (propertyValue) =>
                  propertyValue.propertyId === propertyId ||
                  propertyValue.columnId === propertyId
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
    },
    []
  );

  return {
    databasePage,
    isLoading,
    loadDatabasePage,
    setDatabasePage,
    updateDatabaseTitle,
    createRow,
    createProperty,
    updateProperty,
    deleteProperty,
    updateRowTitle,
    updatePropertyValue,
  };
}
