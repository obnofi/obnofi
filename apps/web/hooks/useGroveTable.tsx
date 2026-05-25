"use client";

import { useMemo } from "react";
import {
  flexRender,
  functionalUpdate,
  getCoreRowModel,
  getExpandedRowModel,
  getFilteredRowModel,
  getGroupedRowModel,
  getSortedRowModel,
  useReactTable,
  type CellContext,
  type ColumnDef,
  type FilterFn,
  type GroupingState,
  type SortingState,
  type ColumnSizingState,
} from "@tanstack/react-table";
import type { Page, Property, PropertyValueData } from "@obnofi/types";
import { PropertyCell } from "@/components/database/PropertyCell";
import { useDatabaseStore, type GroveQueryState } from "@/store/useDatabaseStore";
import {
  getPropertyValueData,
  getPropertyAccessorValue,
  normalizeForSearch,
} from "@/lib/database/tableAccessors";

export { getPropertyValueData, getPropertyAccessorValue };

const EMPTY_QUERY_STATE: GroveQueryState = {
  globalFilter: "",
  sorting: [],
  grouping: [],
  columnFilters: [],
  columnSizing: {},
  activeFilterColumnId: null,
};

function renderGroupedValue<TValue>(
  cell: CellContext<Page, TValue>["cell"],
  fallback: string
) {
  return (
    <button
      type="button"
      onClick={cell.row.getToggleExpandedHandler()}
      className="inline-flex items-center gap-2 text-[13px] font-medium text-[var(--color-text-primary)]"
    >
      <span className="text-[var(--color-text-secondary)]">
        {cell.row.getIsExpanded() ? "▾" : "▸"}
      </span>
      <span>{fallback}</span>
      <span className="rounded-full bg-[var(--color-hover)] px-2 py-0.5 text-[11px] text-[var(--color-text-secondary)]">
        {cell.row.subRows.length}
      </span>
    </button>
  );
}

interface UseGroveTableOptions {
  scopeId: string;
  properties: Property[];
  rows: Page[];
  onOpenRow?: (rowId: string) => void;
  onUpdatePropertyValue?: (
    rowId: string,
    propertyId: string,
    value: PropertyValueData
  ) => void;
}

export function useGroveTable({
  scopeId,
  properties,
  rows,
  onOpenRow,
  onUpdatePropertyValue,
}: UseGroveTableOptions) {
  const queryState = useDatabaseStore(
    (state) => state.groveQueries[scopeId] ?? EMPTY_QUERY_STATE
  );
  const setGlobalFilter = useDatabaseStore((state) => state.setGlobalFilter);
  const setSorting = useDatabaseStore((state) => state.setSorting);
  const setGrouping = useDatabaseStore((state) => state.setGrouping);
  const setColumnSizing = useDatabaseStore((state) => state.setColumnSizing);
  const setActiveFilterColumn = useDatabaseStore(
    (state) => state.setActiveFilterColumn
  );
  const setActiveFilterValue = useDatabaseStore(
    (state) => state.setActiveFilterValue
  );
  const resetQuery = useDatabaseStore((state) => state.resetQuery);

  const propertyFilterFn = useMemo<FilterFn<Page>>(
    () => (row, columnId, filterValue) => {
      const query = String(filterValue ?? "").trim().toLowerCase();
      if (!query) {
        return true;
      }

      return normalizeForSearch(row.getValue(columnId)).includes(query);
    },
    []
  );

  const globalFilterFn = useMemo<FilterFn<Page>>(
    () => (row, _columnId, filterValue) => {
      const query = String(filterValue ?? "").trim().toLowerCase();
      if (!query) {
        return true;
      }

      const haystack = [
        row.original.title,
        ...properties.map((property) =>
          normalizeForSearch(getPropertyAccessorValue(row.original, property))
        ),
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(query);
    },
    [properties]
  );

  const columns = useMemo<ColumnDef<Page>[]>(
    () => [
      {
        id: "title",
        accessorFn: (row) => row.title,
        header: "Plant Seed",
        cell: ({ cell, row, getValue }) => {
          if (cell.getIsPlaceholder()) {
            return null;
          }

          if (cell.getIsGrouped()) {
            return renderGroupedValue(cell, String(getValue() || "Untitled"));
          }

          if (cell.getIsAggregated()) {
            return (
              <span className="text-[13px] text-[var(--color-text-secondary)]">
                {row.subRows.length} seeds
              </span>
            );
          }

          const title = String(getValue() || "Untitled");
          return (
            <button
              type="button"
              onClick={() => onOpenRow?.(row.original.id)}
              className="text-left text-[13px] font-medium text-[var(--color-text-primary)] hover:underline"
            >
              {title}
            </button>
          );
        },
        filterFn: propertyFilterFn,
      },
      ...properties.map<ColumnDef<Page>>((property) => ({
        id: property.id,
        accessorFn: (row) => getPropertyAccessorValue(row, property),
        header: property.name,
        filterFn: propertyFilterFn,
        cell: ({ cell, row, getValue }) => {
          if (cell.getIsPlaceholder()) {
            return null;
          }

          if (cell.getIsGrouped()) {
            const rawValue = getValue();
            const groupedLabel =
              normalizeForSearch(rawValue) || `${property.name} empty`;
            return renderGroupedValue(cell, groupedLabel);
          }

          if (cell.getIsAggregated()) {
            return (
              <span className="text-[12px] text-[var(--color-text-secondary)]">
                {row.subRows.length} rows
              </span>
            );
          }

          const value = getPropertyValueData(row.original, property.id);

          return (
            <PropertyCell
              property={property}
              value={value}
              options={property.options}
              onChange={(nextValue) =>
                onUpdatePropertyValue?.(row.original.id, property.id, nextValue)
              }
            />
          );
        },
      })),
    ],
    [onOpenRow, onUpdatePropertyValue, properties, propertyFilterFn]
  );

  const table = useReactTable({
    data: rows,
    columns,
    state: {
      sorting: queryState.sorting,
      grouping: queryState.grouping,
      globalFilter: queryState.globalFilter,
      columnFilters: queryState.columnFilters,
      columnSizing: queryState.columnSizing,
    },
    onSortingChange: (updater) =>
      setSorting(
        scopeId,
        functionalUpdate(updater, queryState.sorting) as SortingState
      ),
    onGroupingChange: (updater) =>
      setGrouping(
        scopeId,
        functionalUpdate(updater, queryState.grouping) as GroupingState
      ),
    onColumnSizingChange: (updater) =>
      setColumnSizing(
        scopeId,
        functionalUpdate(updater, queryState.columnSizing) as ColumnSizingState
      ),
    globalFilterFn,
    enableColumnResizing: true,
    columnResizeMode: "onChange",
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getGroupedRowModel: getGroupedRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
  });

  const activeFilterValue =
    queryState.activeFilterColumnId
      ? String(
          queryState.columnFilters.find(
            (filter) => filter.id === queryState.activeFilterColumnId
          )?.value ?? ""
        )
      : "";

  return {
    table,
    queryState,
    activeFilterValue,
    setGlobalFilter: (value: string) => setGlobalFilter(scopeId, value),
    setGrouping: (columnId: string | null) =>
      setGrouping(scopeId, columnId ? [columnId] : []),
    setSorting: (sorting: SortingState) => setSorting(scopeId, sorting),
    setActiveFilterColumn: (columnId: string | null) =>
      setActiveFilterColumn(scopeId, columnId),
    setActiveFilterValue: (value: string) => setActiveFilterValue(scopeId, value),
    resetQuery: () => resetQuery(scopeId),
    flexRender,
  };
}
