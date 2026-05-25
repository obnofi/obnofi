"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarDays, KanbanSquare, LayoutGrid, ListFilter, SlidersHorizontal, Table2 } from "lucide-react";
import type { PropertyType, ViewType, DatabasePage, PropertyValueData, SelectOption } from "@obnofi/types";
import { useGroveTable } from "@/hooks/useGroveTable";
import { TableView } from "@/components/database/TableView";
import { GalleryView } from "@/components/database/views/GalleryView";
import { BoardView } from "@/components/database/views/BoardView";
import { CalendarView } from "@/components/database/views/CalendarView";
import { DatabaseQueryPanel } from "@/components/database/DatabaseQueryPanel";

type GroveSurfaceView = Extract<ViewType, "table" | "gallery" | "board" | "calendar">;

interface GroveSurfaceSnapshot {
  columns: Array<{ id: string; name: string; type: PropertyType; width?: number }>;
  rows: string[];
  filters: Array<{ id: string; value: unknown }>;
  sorts: Array<{ id: string; desc: boolean }>;
}

interface DatabaseSurfaceProps {
  databasePage: DatabasePage;
  compact?: boolean;
  initialViewType?: GroveSurfaceView;
  onViewTypeChange?: (viewType: GroveSurfaceView) => void;
  onSurfaceStateChange?: (snapshot: GroveSurfaceSnapshot) => void;
  onCreateRow?: () => void;
  onCreateProperty?: (name: string, type: PropertyType) => void;
  onUpdateProperty?: (propertyId: string, updates: { name?: string; type?: PropertyType; options?: SelectOption[] }) => void;
  onDeleteProperty?: (propertyId: string) => void;
  onMoveProperty?: (propertyId: string, direction: "left" | "right") => void;
  onOpenRow?: (rowId: string) => void;
  onUpdatePropertyValue?: (
    rowId: string,
    propertyId: string,
    value: PropertyValueData
  ) => void;
}

const viewItems: Array<{
  id: GroveSurfaceView;
  label: string;
  icon: typeof Table2;
}> = [
  { id: "table", label: "Table", icon: Table2 },
  { id: "gallery", label: "Gallery", icon: LayoutGrid },
  { id: "board", label: "Kanban", icon: KanbanSquare },
  { id: "calendar", label: "Calendar", icon: CalendarDays },
];

export function DatabaseSurface({
  databasePage,
  compact = false,
  initialViewType = "table",
  onViewTypeChange,
  onSurfaceStateChange,
  onCreateRow,
  onCreateProperty,
  onUpdateProperty,
  onDeleteProperty,
  onMoveProperty,
  onOpenRow,
  onUpdatePropertyValue,
}: DatabaseSurfaceProps) {
  const properties = useMemo(
    () => [...databasePage.database.properties].sort((a, b) => a.order - b.order),
    [databasePage.database.properties]
  );
  const rows = databasePage.database.rows;
  const scopeId = `grove:${databasePage.database.id}`;
  const [viewType, setViewType] = useState<GroveSurfaceView>(initialViewType);
  const [isQueryPanelOpen, setIsQueryPanelOpen] = useState(false);

  const {
    table,
    queryState,
    activeFilterValue,
    setGlobalFilter,
    setSorting,
    setActiveFilterColumn,
    setActiveFilterValue,
    resetQuery,
  } = useGroveTable({
    scopeId,
    properties,
    rows,
    onOpenRow,
    onUpdatePropertyValue,
  });

  useEffect(() => {
    setViewType(initialViewType);
  }, [initialViewType]);

  useEffect(() => {
    onViewTypeChange?.(viewType);
  }, [onViewTypeChange, viewType]);

  useEffect(() => {
    onSurfaceStateChange?.({
      columns: properties.map((property) => ({
        id: property.id,
        name: property.name,
        type: property.type,
        width: queryState.columnSizing[property.id],
      })),
      rows: rows.map((row) => row.id),
      filters: queryState.columnFilters.map((filter) => ({
        id: String(filter.id),
        value: filter.value,
      })),
      sorts: queryState.sorting.map((sort) => ({
        id: sort.id,
        desc: sort.desc,
      })),
    });
  }, [
    onSurfaceStateChange,
    properties,
    queryState.columnFilters,
    queryState.columnSizing,
    queryState.sorting,
    rows,
  ]);

  const activeSort = queryState.sorting[0];

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="border-b border-[var(--color-border)] px-4 py-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1 rounded-xl bg-[var(--color-surface)] p-1">
            {viewItems.map((item) => {
              const Icon = item.icon;
              const isActive = item.id === viewType;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setViewType(item.id)}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm transition ${
                    isActive
                      ? "bg-[var(--color-background)] text-[var(--color-text-primary)] shadow-sm"
                      : "text-[var(--color-text-secondary)] hover:bg-[var(--color-hover)] hover:text-[var(--color-text-primary)]"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </button>
              );
            })}
          </div>
          <button
            type="button"
            onClick={() => setIsQueryPanelOpen((current) => !current)}
            className="inline-flex items-center gap-2 rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm text-[var(--color-text-secondary)] transition hover:bg-[var(--color-hover)] hover:text-[var(--color-text-primary)]"
          >
            {isQueryPanelOpen ? (
              <SlidersHorizontal className="h-4 w-4" />
            ) : (
              <ListFilter className="h-4 w-4" />
            )}
            Filter / Sort
          </button>
        </div>

        {isQueryPanelOpen ? (
          <DatabaseQueryPanel
            globalFilter={queryState.globalFilter}
            activeFilterColumnId={queryState.activeFilterColumnId ?? null}
            activeFilterValue={activeFilterValue}
            activeSortId={activeSort?.id}
            activeSortDesc={activeSort?.desc ?? false}
            columns={properties}
            onGlobalFilterChange={setGlobalFilter}
            onFilterColumnChange={setActiveFilterColumn}
            onFilterValueChange={setActiveFilterValue}
            onSortChange={(id, desc) => setSorting(id ? [{ id, desc }] : [])}
            onReset={resetQuery}
          />
        ) : null}
      </div>

      <div className="min-h-0 flex-1">
        {viewType === "table" ? (
          <TableView
            pageId={databasePage.id}
            table={table}
            properties={properties}
            onOpenRow={onOpenRow}
            onCreateRow={onCreateRow}
            onCreateProperty={onCreateProperty}
            onUpdateProperty={onUpdateProperty}
            onDeleteProperty={onDeleteProperty}
            onMoveProperty={onMoveProperty}
            compact={compact}
          />
        ) : null}
        {viewType === "gallery" ? (
          <GalleryView
            table={table}
            properties={properties}
            onCreateRow={onCreateRow}
            onOpenRow={onOpenRow}
          />
        ) : null}
        {viewType === "board" ? (
          <BoardView
            table={table}
            properties={properties}
            groupByPropertyId={queryState.grouping[0]}
            onCreateRow={onCreateRow}
            onOpenRow={onOpenRow}
            onUpdatePropertyValue={onUpdatePropertyValue}
          />
        ) : null}
        {viewType === "calendar" ? (
          <CalendarView
            table={table}
            properties={properties}
            onCreateRow={onCreateRow}
            onOpenRow={onOpenRow}
          />
        ) : null}
      </div>
    </div>
  );
}
