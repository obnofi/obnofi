"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Column, ColumnType, Page, PropertyValueData } from "@/types";
import { PropertyCell } from "@/components/database/PropertyCell";
import { DATABASE_COLUMN_TYPES, getColumnTypeLabel } from "@/lib/database-utils";

interface TableViewProps {
  columns: Column[];
  rows: Page[];
  onCreateRow: () => void;
  onCreateColumn: (input: { name: string; type: ColumnType }) => void;
  onOpenRow: (rowId: string) => void;
  onUpdateRowTitle: (rowId: string, title: string) => void;
  onUpdatePropertyValue: (
    rowId: string,
    columnId: string,
    value: PropertyValueData
  ) => void;
  compact?: boolean;
}

export function TableView({
  columns,
  rows,
  onCreateRow,
  onCreateColumn,
  onOpenRow,
  onUpdateRowTitle,
  onUpdatePropertyValue,
  compact = false,
}: TableViewProps) {
  const [isCreatingColumn, setIsCreatingColumn] = useState(false);
  const [newColumnName, setNewColumnName] = useState("");
  const [newColumnType, setNewColumnType] = useState<ColumnType>("text");

  const handleSubmitColumn = () => {
    const trimmedName = newColumnName.trim();
    if (!trimmedName) {
      return;
    }

    onCreateColumn({ name: trimmedName, type: newColumnType });
    setNewColumnName("");
    setNewColumnType("text");
    setIsCreatingColumn(false);
  };

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="flex-1 overflow-auto">
        <table className="min-w-full border-separate border-spacing-0">
          <thead
            className={`z-10 bg-white dark:bg-[#111110] ${
              compact ? "" : "sticky top-0"
            }`}
          >
            <tr>
              <th
                className={`border-b border-r border-zinc-200 px-3 py-2 text-left text-xs font-medium uppercase tracking-wide text-zinc-500 dark:border-zinc-800 dark:text-zinc-400 ${
                  compact ? "min-w-40" : "min-w-64"
                }`}
              >
                Title
              </th>
              {columns.map((column) => (
                <th
                  key={column.id}
                  className={`border-b border-r border-zinc-200 px-3 py-2 text-left text-xs font-medium uppercase tracking-wide text-zinc-500 dark:border-zinc-800 dark:text-zinc-400 ${
                    compact ? "min-w-32" : "min-w-48"
                  }`}
                >
                  <div className="flex flex-col gap-1">
                    <span>{column.name}</span>
                    <span className="text-[10px] font-medium normal-case tracking-normal text-zinc-400 dark:text-zinc-500">
                      {getColumnTypeLabel(column.type)}
                    </span>
                  </div>
                </th>
              ))}
              <th className="border-b border-zinc-200 px-2 py-2 dark:border-zinc-800">
                {isCreatingColumn ? (
                  <div className="flex min-w-56 items-center gap-2 rounded-lg border border-zinc-200 bg-white p-2 dark:border-zinc-800 dark:bg-zinc-950">
                    <input
                      value={newColumnName}
                      onChange={(event) => setNewColumnName(event.target.value)}
                      placeholder="Property name"
                      className="min-w-0 flex-1 rounded-md border border-zinc-200 bg-transparent px-2 py-1.5 text-xs text-[#111110] outline-none dark:border-zinc-800 dark:text-zinc-100"
                    />
                    <select
                      value={newColumnType}
                      onChange={(event) =>
                        setNewColumnType(event.target.value as ColumnType)
                      }
                      className="rounded-md border border-zinc-200 bg-transparent px-2 py-1.5 text-xs text-[#111110] outline-none dark:border-zinc-800 dark:text-zinc-100"
                    >
                      {DATABASE_COLUMN_TYPES.map((type) => (
                        <option key={type} value={type}>
                          {getColumnTypeLabel(type)}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={handleSubmitColumn}
                      className="rounded-md bg-[#2E7D45] px-2 py-1.5 text-xs font-medium text-white"
                    >
                      Add
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setIsCreatingColumn(true)}
                    className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-zinc-600 transition hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-900"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    {compact ? "Add" : "Column"}
                  </button>
                )}
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="bg-white dark:bg-[#111110]">
                <td className="border-b border-r border-zinc-200 px-2 py-1.5 align-middle dark:border-zinc-800">
                  <div className="flex items-center gap-2">
                    <input
                      value={row.title}
                      onChange={(event) =>
                        onUpdateRowTitle(row.id, event.target.value)
                      }
                      className="min-w-0 flex-1 rounded-md border border-transparent bg-transparent px-2 py-1.5 text-sm font-medium text-[#111110] outline-none transition focus:border-zinc-300 focus:bg-white dark:text-zinc-100 dark:focus:border-zinc-700 dark:focus:bg-zinc-900"
                    />
                    <button
                      onClick={() => onOpenRow(row.id)}
                      className="shrink-0 rounded-md px-2 py-1 text-xs font-medium text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-100"
                    >
                      {compact ? "View" : "Open"}
                    </button>
                  </div>
                </td>
                {columns.map((column) => {
                  const propertyValue = row.propertyValues?.find(
                    (value) => value.columnId === column.id
                  );

                  return (
                    <td
                      key={column.id}
                      className="border-b border-r border-zinc-200 px-1 py-1 align-middle dark:border-zinc-800"
                    >
                      <PropertyCell
                        column={column}
                        value={propertyValue?.value}
                        onChange={(value) =>
                          onUpdatePropertyValue(row.id, column.id, value)
                        }
                      />
                    </td>
                  );
                })}
                <td className="border-b border-zinc-200 dark:border-zinc-800" />
              </tr>
            ))}
            <tr className="bg-white dark:bg-[#111110]">
              <td
                colSpan={columns.length + 2}
                className="border-b border-zinc-200 px-2 py-1.5 dark:border-zinc-800"
              >
                <button
                  onClick={onCreateRow}
                  className="inline-flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-900"
                >
                  <Plus className="h-4 w-4" />
                  {compact ? "New row" : "Add a row"}
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

    </div>
  );
}
