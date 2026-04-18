"use client";

import { useState, useCallback, useEffect } from "react";
import {
  Table,
  LayoutGrid,
  Calendar,
  GalleryHorizontal,
  List,
  Clock3,
  Plus,
  X,
} from "lucide-react";
import {
  DatabasePage,
  PropertyType,
  PropertyValueData,
} from "@/types";
import { View, ViewType } from "@/types/database";
import { TableView } from "./TableView";

interface ViewTabsProps {
  databasePage: DatabasePage;
  onDatabaseChange: (databasePage: DatabasePage) => void;
  onOpenRow?: (rowId: string) => void;
  compact?: boolean;
}

const viewIcons: Record<ViewType, typeof Table> = {
  table: Table,
  board: LayoutGrid,
  calendar: Calendar,
  gallery: GalleryHorizontal,
  list: List,
  timeline: Clock3,
};

const viewLabels: Record<ViewType, string> = {
  table: "Table",
  board: "Board",
  calendar: "Calendar",
  gallery: "Gallery",
  list: "List",
  timeline: "Timeline",
};

export function ViewTabs({
  databasePage,
  onDatabaseChange,
  onOpenRow,
  compact = true,
}: ViewTabsProps) {
  const [activeViewId, setActiveViewId] = useState<string | null>(null);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const views: View[] = databasePage.database.views || [];

  // Set first view as active if none selected
  useEffect(() => {
    if (views.length > 0 && !activeViewId) {
      setActiveViewId(views[0].id);
    }
  }, [views, activeViewId]);

  const activeView = views.find((v) => v.id === activeViewId);

  const handleCreateView = async (type: ViewType) => {
    if (isCreating) return;

    setIsCreating(true);
    try {
      const response = await fetch(
        `/api/databases/${databasePage.database.id}/views`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: `New ${viewLabels[type]}`,
            type,
          }),
        }
      );

      if (!response.ok) throw new Error("Failed to create view");

      const newView = (await response.json()) as View;

      // Update local state
      onDatabaseChange({
        ...databasePage,
        database: {
          ...databasePage.database,
          views: [...views, newView],
        },
      });

      setActiveViewId(newView.id);
      setShowAddMenu(false);
    } catch (error) {
      console.error("Failed to create view:", error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleCreateRow = async () => {
    const response = await fetch(
      `/api/databases/${databasePage.database.id}/rows`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "Untitled" }),
      }
    );

    if (!response.ok) return;

    const newRow = await response.json();

    onDatabaseChange({
      ...databasePage,
      database: {
        ...databasePage.database,
        rows: [...databasePage.database.rows, newRow],
      },
    });
  };

  const handleCreateProperty = async ({
    name,
    type,
  }: {
    name: string;
    type: PropertyType;
  }) => {
    const response = await fetch(
      `/api/databases/${databasePage.database.id}/columns`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, type }),
      }
    );

    if (!response.ok) return;

    const newProperty = await response.json();

    onDatabaseChange({
      ...databasePage,
      database: {
        ...databasePage.database,
        properties: [...databasePage.database.properties, newProperty],
      },
    });
  };

  const handleUpdateProperty = async (
    propertyId: string,
    input: { name?: string; type?: PropertyType }
  ) => {
    const response = await fetch(`/api/columns/${propertyId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });

    if (!response.ok) return;

    const updatedProperty = await response.json();

    onDatabaseChange({
      ...databasePage,
      database: {
        ...databasePage.database,
        properties: databasePage.database.properties.map((p) =>
          p.id === propertyId ? updatedProperty : p
        ),
      },
    });
  };

  const handleDeleteProperty = async (propertyId: string) => {
    const response = await fetch(`/api/columns/${propertyId}`, {
      method: "DELETE",
    });

    if (!response.ok) return;

    onDatabaseChange({
      ...databasePage,
      database: {
        ...databasePage.database,
        properties: databasePage.database.properties.filter(
          (p) => p.id !== propertyId
        ),
      },
    });
  };

  const handleUpdateRowTitle = async (rowId: string, title: string) => {
    const response = await fetch(`/api/pages/${rowId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title }),
    });

    if (!response.ok) return;

    onDatabaseChange({
      ...databasePage,
      database: {
        ...databasePage.database,
        rows: databasePage.database.rows.map((row) =>
          row.id === rowId ? { ...row, title } : row
        ),
      },
    });
  };

  const handleUpdatePropertyValue = async (
    rowId: string,
    propertyId: string,
    value: PropertyValueData
  ) => {
    const response = await fetch("/api/property-values", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        pageId: rowId,
        columnId: propertyId,
        value,
      }),
    });

    if (!response.ok) return;

    const updatedPropertyValue = await response.json();

    onDatabaseChange({
      ...databasePage,
      database: {
        ...databasePage.database,
        rows: databasePage.database.rows.map((row) => {
          if (row.id !== rowId) return row;

          const propertyValues = row.propertyValues || [];
          const existingIndex = propertyValues.findIndex(
            (pv) => pv.propertyId === propertyId || pv.columnId === propertyId
          );

          if (existingIndex === -1) {
            return {
              ...row,
              propertyValues: [...propertyValues, updatedPropertyValue],
            };
          }

          return {
            ...row,
            propertyValues: propertyValues.map((pv, index) =>
              index === existingIndex ? updatedPropertyValue : pv
            ),
          };
        }),
      },
    });
  };

  const handleOpenRow = useCallback((rowId: string) => {
    if (onOpenRow) {
      onOpenRow(rowId);
      return;
    }

    window.open(`/workspace/${databasePage.workspaceId}?page=${rowId}`, "_blank");
  }, [databasePage.workspaceId, onOpenRow]);

  // Create default view if none exists
  useEffect(() => {
    if (views.length === 0 && !isCreating) {
      handleCreateView("table");
    }
  }, [views.length, isCreating]);

  return (
    <div className="flex h-full flex-col">
      {/* View Tabs */}
      <div className="flex items-center gap-1 border-b border-zinc-200 px-4 dark:border-zinc-800">
        {views.map((view) => {
          const Icon = viewIcons[view.type];
          const isActive = activeViewId === view.id;

          return (
            <button
              key={view.id}
              onClick={() => setActiveViewId(view.id)}
              className={`flex items-center gap-1.5 px-3 py-2.5 text-[13px] font-medium transition-colors ${
                isActive
                  ? "border-b-2 border-[#2E7D45] text-[#2E7D45]"
                  : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200"
              }`}
            >
              <Icon className="h-4 w-4" />
              {view.name}
            </button>
          );
        })}

        {/* Add View Button */}
        <div className="relative">
          <button
            onClick={() => setShowAddMenu(!showAddMenu)}
            disabled={isCreating}
            className="ml-2 flex items-center gap-1 rounded-md p-1.5 text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-700 disabled:opacity-50 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
          >
            <Plus className="h-4 w-4" />
          </button>

          {showAddMenu && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowAddMenu(false)}
              />
              <div className="absolute left-0 top-full z-50 mt-1 w-48 rounded-lg border border-zinc-200 bg-white py-1 shadow-lg dark:border-zinc-800 dark:bg-zinc-900">
                <div className="px-3 py-2 text-xs font-medium text-zinc-500 dark:text-zinc-400">
                  Add a view
                </div>
                {(Object.keys(viewIcons) as ViewType[]).map((type) => {
                  const Icon = viewIcons[type];
                  return (
                    <button
                      key={type}
                      onClick={() => handleCreateView(type)}
                      disabled={isCreating}
                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-zinc-700 transition hover:bg-zinc-100 disabled:opacity-50 dark:text-zinc-300 dark:hover:bg-zinc-800"
                    >
                      <Icon className="h-4 w-4" />
                      {viewLabels[type]}
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>

      {/* View Content */}
      <div className="flex-1 overflow-hidden">
        {!activeView ? (
          <div className="flex h-full items-center justify-center text-zinc-500 dark:text-zinc-400">
            Select or create a view
          </div>
        ) : activeView.type === "table" ? (
          <TableView
            properties={databasePage.database.properties}
            rows={databasePage.database.rows}
            onCreateRow={handleCreateRow}
            onCreateProperty={handleCreateProperty}
            onUpdateProperty={handleUpdateProperty}
            onDeleteProperty={handleDeleteProperty}
            onOpenRow={handleOpenRow}
            onUpdateRowTitle={handleUpdateRowTitle}
            onUpdatePropertyValue={handleUpdatePropertyValue}
            compact={compact}
          />
        ) : (
          <div className="flex h-full items-center justify-center text-zinc-500 dark:text-zinc-400">
            <div className="text-center">
              <p className="text-lg font-medium">
                {viewLabels[activeView.type]} View
              </p>
              <p className="text-sm text-zinc-400">
                Coming soon in P1
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
