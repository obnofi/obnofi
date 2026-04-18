"use client";

import { useState } from "react";
import { Plus, X, GripVertical } from "lucide-react";
import { SelectOption, SelectOptionColor } from "@/types/database";
import {
  getOptionBgColor,
  getOptionTextColor,
  getRandomOptionColor,
} from "@/lib/property-utils";

interface PropertyOptionsEditorProps {
  options: SelectOption[];
  onChange: (options: SelectOption[]) => void;
}

const AVAILABLE_COLORS: SelectOptionColor[] = [
  "gray",
  "brown",
  "orange",
  "yellow",
  "green",
  "blue",
  "purple",
  "pink",
  "red",
];

export function PropertyOptionsEditor({
  options,
  onChange,
}: PropertyOptionsEditorProps) {
  const [editingOptionId, setEditingOptionId] = useState<string | null>(null);
  const [newOptionLabel, setNewOptionLabel] = useState("");

  const handleAddOption = () => {
    const trimmed = newOptionLabel.trim();
    if (!trimmed) return;

    const newOption: SelectOption = {
      id: `opt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      label: trimmed,
      color: getRandomOptionColor(),
    };

    onChange([...options, newOption]);
    setNewOptionLabel("");
  };

  const handleUpdateOption = (optionId: string, updates: Partial<SelectOption>) => {
    onChange(
      options.map((opt) =>
        opt.id === optionId ? { ...opt, ...updates } : opt
      )
    );
  };

  const handleRemoveOption = (optionId: string) => {
    onChange(options.filter((opt) => opt.id !== optionId));
  };

  const handleMoveOption = (optionId: string, direction: "up" | "down") => {
    const index = options.findIndex((opt) => opt.id === optionId);
    if (index === -1) return;

    if (direction === "up" && index > 0) {
      const newOptions = [...options];
      [newOptions[index - 1], newOptions[index]] = [
        newOptions[index],
        newOptions[index - 1],
      ];
      onChange(newOptions);
    } else if (direction === "down" && index < options.length - 1) {
      const newOptions = [...options];
      [newOptions[index], newOptions[index + 1]] = [
        newOptions[index + 1],
        newOptions[index],
      ];
      onChange(newOptions);
    }
  };

  return (
    <div className="space-y-2">
      <div className="space-y-1">
        {options.map((option, index) => (
          <div
            key={option.id}
            className="flex items-center gap-2 rounded-md bg-zinc-50 px-2 py-1.5 dark:bg-zinc-800"
          >
            <GripVertical className="h-4 w-4 cursor-grab text-zinc-400" />

            <div className="flex flex-1 items-center gap-2">
              {editingOptionId === option.id ? (
                <input
                  type="text"
                  value={option.label}
                  onChange={(e) =>
                    handleUpdateOption(option.id, { label: e.target.value })
                  }
                  onBlur={() => setEditingOptionId(null)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      setEditingOptionId(null);
                    }
                  }}
                  autoFocus
                  className="flex-1 rounded border border-zinc-300 bg-white px-2 py-1 text-sm text-[#111110] outline-none dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-100"
                />
              ) : (
                <button
                  onClick={() => setEditingOptionId(option.id)}
                  className="flex-1 text-left text-sm text-[#111110] dark:text-zinc-100"
                >
                  {option.label}
                </button>
              )}

              <div className="flex items-center gap-1">
                {AVAILABLE_COLORS.map((color) => (
                  <button
                    key={color}
                    onClick={() => handleUpdateOption(option.id, { color })}
                    className={`h-5 w-5 rounded-full transition ${
                      option.color === color
                        ? "ring-2 ring-offset-1 ring-zinc-400"
                        : ""
                    }`}
                    style={{ backgroundColor: getOptionBgColor(color) }}
                  />
                ))}
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => handleMoveOption(option.id, "up")}
                disabled={index === 0}
                className="rounded p-1 text-zinc-400 hover:bg-zinc-200 disabled:opacity-30 dark:hover:bg-zinc-700"
              >
                ↑
              </button>
              <button
                onClick={() => handleMoveOption(option.id, "down")}
                disabled={index === options.length - 1}
                className="rounded p-1 text-zinc-400 hover:bg-zinc-200 disabled:opacity-30 dark:hover:bg-zinc-700"
              >
                ↓
              </button>
              <button
                onClick={() => handleRemoveOption(option.id)}
                className="rounded p-1 text-zinc-400 hover:bg-zinc-200 hover:text-red-500 dark:hover:bg-zinc-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <input
          type="text"
          value={newOptionLabel}
          onChange={(e) => setNewOptionLabel(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              handleAddOption();
            }
          }}
          placeholder="Add an option..."
          className="flex-1 rounded-md border border-zinc-200 bg-transparent px-3 py-1.5 text-sm text-[#111110] outline-none placeholder:text-zinc-400 dark:border-zinc-700 dark:text-zinc-100"
        />
        <button
          onClick={handleAddOption}
          disabled={!newOptionLabel.trim()}
          className="flex items-center gap-1 rounded-md bg-[#2E7D45] px-3 py-1.5 text-sm font-medium text-white transition hover:bg-[#256a3a] disabled:opacity-50"
        >
          <Plus className="h-4 w-4" />
          Add
        </button>
      </div>
    </div>
  );
}
