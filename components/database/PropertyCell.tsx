"use client";

import { ChangeEvent } from "react";
import { Column, PropertyValueData, SelectOption } from "@/types";

interface PropertyCellProps {
  column: Column;
  value?: PropertyValueData;
  onChange: (value: PropertyValueData) => void;
}

function getOptionLabel(optionId: string | null, options?: SelectOption[]) {
  if (!optionId || !options) {
    return "";
  }

  return options.find((option) => option.id === optionId)?.label ?? "";
}

export function PropertyCell({ column, value, onChange }: PropertyCellProps) {
  const commonClassName =
    "w-full rounded-md border border-transparent bg-transparent px-2 py-1.5 text-sm text-[#111110] outline-none transition focus:border-zinc-300 focus:bg-white dark:text-zinc-100 dark:focus:border-zinc-700 dark:focus:bg-zinc-900";

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const nextValue = event.target.value;

    switch (column.type) {
      case "number":
        onChange({
          type: "number",
          value: nextValue === "" ? null : Number(nextValue),
        });
        return;
      case "date":
        onChange({ type: "date", value: nextValue || null });
        return;
      case "url":
        onChange({ type: "url", value: nextValue });
        return;
      case "email":
        onChange({ type: "email", value: nextValue });
        return;
      case "person":
        onChange({ type: "person", userId: nextValue || null });
        return;
      case "multi_select":
        onChange({
          type: "multi_select",
          optionIds: nextValue
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean),
        });
        return;
      default:
        onChange({ type: "text", value: nextValue });
    }
  };

  if (column.type === "select") {
    return (
      <select
        className={commonClassName}
        value={value?.type === "select" ? value.optionId ?? "" : ""}
        onChange={(event) =>
          onChange({
            type: "select",
            optionId: event.target.value || null,
          })
        }
      >
        <option value="">Empty</option>
        {column.options?.map((option) => (
          <option key={option.id} value={option.id}>
            {option.label}
          </option>
        ))}
      </select>
    );
  }

  if (column.type === "checkbox") {
    return (
      <label className="flex h-full items-center px-2">
        <input
          type="checkbox"
          checked={value?.type === "checkbox" ? value.value : false}
          onChange={(event) =>
            onChange({
              type: "checkbox",
              value: event.target.checked,
            })
          }
          className="h-4 w-4 rounded border-zinc-300 text-[#2E7D45] focus:ring-[#2E7D45]"
        />
      </label>
    );
  }

  return (
    <input
      type={
        column.type === "number"
          ? "number"
          : column.type === "date"
          ? "date"
          : column.type === "email"
          ? "email"
          : column.type === "url"
          ? "url"
          : "text"
      }
      className={commonClassName}
      value={
        value?.type === "number"
          ? value.value ?? ""
          : value?.type === "date"
          ? value.value ?? ""
          : value?.type === "email"
          ? value.value
          : value?.type === "url"
          ? value.value
          : value?.type === "person"
          ? value.userId ?? ""
          : value?.type === "multi_select"
          ? value.optionIds.join(", ")
          : value?.type === "text"
          ? value.value
          : value?.type === "select"
          ? getOptionLabel(value.optionId, column.options)
          : ""
      }
      onChange={handleInputChange}
      placeholder={column.name}
    />
  );
}
