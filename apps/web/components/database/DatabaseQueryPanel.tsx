"use client";

import type { PropertyType } from "@obnofi/types";

interface QueryPanelColumn {
  id: string;
  name: string;
  type: PropertyType;
}

interface DatabaseQueryPanelProps {
  globalFilter: string;
  activeFilterColumnId: string | null;
  activeFilterValue: string;
  activeSortId: string | undefined;
  activeSortDesc: boolean;
  columns: QueryPanelColumn[];
  onGlobalFilterChange: (value: string) => void;
  onFilterColumnChange: (columnId: string | null) => void;
  onFilterValueChange: (value: string) => void;
  onSortChange: (columnId: string, desc: boolean) => void;
  onReset: () => void;
}

export function DatabaseQueryPanel({
  globalFilter,
  activeFilterColumnId,
  activeFilterValue,
  activeSortId,
  activeSortDesc,
  columns,
  onGlobalFilterChange,
  onFilterColumnChange,
  onFilterValueChange,
  onSortChange,
  onReset,
}: DatabaseQueryPanelProps) {
  return (
    <div className="mt-3 grid gap-2 md:grid-cols-5">
      <input
        name="global-filter"
        type="search"
        value={globalFilter}
        onChange={(event) => onGlobalFilterChange(event.target.value)}
        placeholder="Search Grove Catalog"
        className="rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm text-[var(--color-text-primary)] outline-none placeholder:text-[var(--color-text-placeholder)] focus:border-[var(--color-accent)]"
      />
      <select
        name="filter-column"
        value={activeFilterColumnId ?? ""}
        onChange={(event) => onFilterColumnChange(event.target.value || null)}
        className="rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm text-[var(--color-text-primary)] outline-none focus:border-[var(--color-accent)]"
      >
        <option value="">Filter column</option>
        <option value="title">Plant Seed</option>
        {columns.map((column) => (
          <option key={column.id} value={column.id}>
            {column.name}
          </option>
        ))}
      </select>
      <input
        name="filter-value"
        type="search"
        value={activeFilterValue}
        onChange={(event) => onFilterValueChange(event.target.value)}
        disabled={!activeFilterColumnId}
        placeholder="Contains..."
        className="rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm text-[var(--color-text-primary)] outline-none placeholder:text-[var(--color-text-placeholder)] disabled:cursor-not-allowed disabled:opacity-50 focus:border-[var(--color-accent)]"
      />
      <select
        name="sort-column"
        value={activeSortId ?? ""}
        onChange={(event) =>
          onSortChange(event.target.value, activeSortDesc)
        }
        className="rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm text-[var(--color-text-primary)] outline-none focus:border-[var(--color-accent)]"
      >
        <option value="">Sort column</option>
        <option value="title">Plant Seed</option>
        {columns.map((column) => (
          <option key={column.id} value={column.id}>
            {column.name}
          </option>
        ))}
      </select>
      <div className="flex gap-2">
        <select
          name="sort-direction"
          value={activeSortDesc ? "desc" : "asc"}
          onChange={(event) =>
            activeSortId
              ? onSortChange(activeSortId, event.target.value === "desc")
              : undefined
          }
          className="flex-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm text-[var(--color-text-primary)] outline-none focus:border-[var(--color-accent)]"
        >
          <option value="asc">Ascending</option>
          <option value="desc">Descending</option>
        </select>
        <button
          type="button"
          onClick={onReset}
          className="rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm text-[var(--color-text-secondary)] transition hover:bg-[var(--color-hover)] hover:text-[var(--color-text-primary)]"
        >
          Reset
        </button>
      </div>
    </div>
  );
}
