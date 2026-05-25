"use client";

import React, { useEffect, useMemo } from "react";
import { flexRender, type Row, type Table } from "@tanstack/react-table";
import { Plus } from "lucide-react";
import { Property, Page, PropertyType, SelectOption } from "@obnofi/types";
import { useCollaboration } from "@/lib/collaboration/CollaborationContext";
import { useJungleCursor } from "@/lib/cursor/jungleCursor";
import { TableHead } from "./TableViewParts";

interface TableViewProps {
  pageId: string;
  table: Table<Page>;
  properties: Property[];
  onCreateRow?: () => void;
  onOpenRow?: (rowId: string) => void;
  onCreateProperty?: (name: string, type: PropertyType) => void;
  onUpdateProperty?: (propertyId: string, updates: { name?: string; type?: PropertyType; options?: SelectOption[] }) => void;
  onDeleteProperty?: (propertyId: string) => void;
  onMoveProperty?: (propertyId: string, direction: "left" | "right") => void;
  compact?: boolean;
}

export function TableView({
  pageId,
  table,
  properties: _properties,
  onCreateRow,
  onOpenRow,
  onCreateProperty,
  onUpdateProperty,
  onDeleteProperty,
  onMoveProperty,
  compact = false,
}: TableViewProps) {
  const collaboration = useCollaboration();
  const awarenessStates = useMemo(
    () => (Array.isArray(collaboration.awarenessStates) ? collaboration.awarenessStates : []),
    [collaboration.awarenessStates]
  );
  const updateCursor = collaboration.updateCursor;
  const localUserId = collaboration.localUserId ?? null;
  const jungleCursor = useJungleCursor();

  const occupiedCells = useMemo(() => {
    const occupied = new Map<string, Array<{ userId: string; userName: string; color: string }>>();

    awarenessStates.forEach((state) => {
      const databaseCell = state.userCursor?.databaseCell;
      if (
        state.userId === localUserId ||
        state.userCursor?.type !== "database" ||
        state.userCursor?.pageId !== pageId ||
        !databaseCell
      ) {
        return;
      }

      const key = `${databaseCell.rowId}:${databaseCell.colId}`;
      const current = occupied.get(key) ?? [];
      current.push({ userId: state.userId, userName: state.userName, color: state.color });
      occupied.set(key, current);
    });

    return occupied;
  }, [awarenessStates, localUserId, pageId]);

  useEffect(() => {
    if (!updateCursor) {
      return;
    }

    updateCursor({ type: "database", pageId, canvasPosition: null, databaseCell: null });
    return () => {
      updateCursor(null);
    };
  }, [pageId, updateCursor]);

  const handleRowClick = (event: React.MouseEvent<HTMLTableRowElement>, row: Row<Page>) => {
    if (!onOpenRow || row.getIsGrouped()) return;

    const target = event.target as HTMLElement;
    if (
      target.closest(
        "button, input, select, textarea, a, [contenteditable='true'], [data-grove-dropdown-portal='true']"
      )
    ) {
      return;
    }

    onOpenRow(row.original.id);
  };

  const handleCellEnter = (rowId: string, colId: string) => {
    if (!updateCursor) {
      return;
    }

    updateCursor({ type: "database", pageId, canvasPosition: null, databaseCell: { rowId, colId } });
  };

  const handleCellLeave = (event: React.FocusEvent<HTMLTableCellElement>) => {
    if (event.relatedTarget instanceof Node && event.currentTarget.contains(event.relatedTarget)) {
      return;
    }
    if (!updateCursor) {
      return;
    }
    updateCursor({ type: "database", pageId, canvasPosition: null, databaseCell: null });
  };

  return (
    <div className="flex h-full flex-col overflow-hidden" style={{ cursor: jungleCursor.cursorCss }}>
      <div className="flex-1 overflow-auto">
        <table className="w-full border-collapse">
          <TableHead
            headerGroups={table.getHeaderGroups()}
            properties={_properties}
            compact={compact}
            onCreateProperty={onCreateProperty}
            onUpdateProperty={onUpdateProperty}
            onDeleteProperty={onDeleteProperty}
            onMoveProperty={onMoveProperty}
          />

          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr
                key={row.id}
                onClick={(event) => handleRowClick(event, row)}
                className={`group border-b border-[var(--color-border)] transition-colors hover:bg-[var(--color-hover)] ${
                  onOpenRow && !row.getIsGrouped() ? "cursor-pointer" : ""
                }`}
              >
                {row.getVisibleCells().map((cell) => {
                  const isTitleColumn = cell.column.id === "title";
                  const occupancyKey = `${row.original.id}:${cell.column.id}`;
                  const occupyingUsers = occupiedCells.get(occupancyKey) ?? [];
                  const primaryOccupant = occupyingUsers[0];
                  return (
                    <td
                      key={cell.id}
                      data-testid={`db-cell-${row.original.id}-${cell.column.id}`}
                      onFocusCapture={() => handleCellEnter(row.original.id, cell.column.id)}
                      onClick={() => handleCellEnter(row.original.id, cell.column.id)}
                      onBlurCapture={handleCellLeave}
                      title={occupyingUsers.map((user) => user.userName).join(", ") || undefined}
                      className={`border-r border-[var(--color-border)] px-3 py-1.5 ${
                        isTitleColumn
                          ? "sticky left-0 z-10 bg-[var(--color-background)] px-4 py-2 transition-colors group-hover:bg-[var(--color-hover)]"
                          : ""
                      }`}
                      style={{
                        ...(row.depth > 0 && isTitleColumn
                          ? { paddingLeft: `${16 + row.depth * 20}px` }
                          : undefined),
                        ...(primaryOccupant
                          ? { boxShadow: `inset 0 0 0 2px ${primaryOccupant.color}` }
                          : undefined),
                      }}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  );
                })}
                <td />
              </tr>
            ))}

            {/* New row */}
            <tr>
              <td colSpan={table.getVisibleLeafColumns().length + 1} className="px-4 py-2">
                <button
                  type="button"
                  onClick={onCreateRow}
                  className="flex items-center gap-1.5 text-[13px] text-[var(--color-text-secondary)] transition hover:text-[var(--color-text-primary)]"
                >
                  <Plus className="h-3.5 w-3.5" />
                  New
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
