"use client";

import { useState, useRef, useEffect } from "react";
import { Calendar } from "lucide-react";

interface DateCellProps {
  value: string | null;
  endValue?: string | null;
  includeTime?: boolean;
  onChange: (value: string | null, endValue?: string | null) => void;
}

export function DateCell({
  value,
  endValue,
  onChange,
}: DateCellProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const formatDisplay = (dateStr: string | null): string => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return date.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: date.getFullYear() !== new Date().getFullYear() ? "numeric" : undefined,
    });
  };

  const displayValue = value ? formatDisplay(value) : "";
  const displayEndValue = endValue ? formatDisplay(endValue) : "";

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex w-full items-center gap-1.5 rounded-md border border-transparent px-2 py-1.5 text-left text-sm transition hover:bg-zinc-100 dark:hover:bg-zinc-800 ${
          value ? "text-[#111110] dark:text-zinc-100" : "text-zinc-400"
        }`}
      >
        <Calendar className="h-3.5 w-3.5 shrink-0" />
        <span className="truncate">
          {displayValue
            ? displayEndValue
              ? `${displayValue} → ${displayEndValue}`
              : displayValue
            : "Empty"}
        </span>
      </button>

      {isOpen && (
        <div className="absolute left-0 top-full z-[99999] mt-1 w-64 rounded-lg border border-zinc-200 bg-white p-3 shadow-lg dark:border-zinc-700 dark:bg-zinc-900">
          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-500">
                Start date
              </label>
              <input
                type="date"
                value={value ?? ""}
                onChange={(e) =>
                  onChange(e.target.value || null, endValue ?? undefined)
                }
                className="w-full rounded-md border border-zinc-200 bg-transparent px-2 py-1.5 text-sm text-[#111110] outline-none dark:border-zinc-700 dark:text-zinc-100"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-500">
                End date (optional)
              </label>
              <input
                type="date"
                value={endValue ?? ""}
                onChange={(e) =>
                  onChange(value, e.target.value || undefined)
                }
                className="w-full rounded-md border border-zinc-200 bg-transparent px-2 py-1.5 text-sm text-[#111110] outline-none dark:border-zinc-700 dark:text-zinc-100"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
              <button
                type="button"
                onClick={() => {
                  onChange(null, undefined);
                  setIsOpen(false);
                }}
                className="px-2 py-1 text-xs text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded-md bg-[#2E7D45] px-3 py-1 text-xs font-medium text-white"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
