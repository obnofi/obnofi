"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, X } from "lucide-react";
import { SelectOption } from "@/types/database";
import { getOptionBgColor, getOptionTextColor } from "@/lib/property-utils";

interface MultiSelectCellProps {
  value: string[];
  options: SelectOption[];
  onChange: (optionIds: string[]) => void;
}

export function MultiSelectCell({
  value,
  options,
  onChange,
}: MultiSelectCellProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOptions = options.filter((opt) => value.includes(opt.id));

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

  const toggleOption = (optionId: string) => {
    if (value.includes(optionId)) {
      onChange(value.filter((id) => id !== optionId));
    } else {
      onChange([...value, optionId]);
    }
  };

  const removeOption = (e: React.MouseEvent, optionId: string) => {
    e.stopPropagation();
    onChange(value.filter((id) => id !== optionId));
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full min-h-[36px] items-center gap-1 rounded-md border border-transparent px-2 py-1 text-left text-sm transition hover:bg-zinc-100 dark:hover:bg-zinc-800"
      >
        <div className="flex flex-wrap items-center gap-1 flex-1">
          {selectedOptions.length > 0 ? (
            selectedOptions.map((option) => (
              <span
                key={option.id}
                className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-xs font-medium"
                style={{
                  backgroundColor: getOptionBgColor(option.color),
                  color: getOptionTextColor(option.color),
                }}
              >
                {option.label}
                <span
                  onClick={(e) => removeOption(e, option.id)}
                  className="cursor-pointer rounded hover:bg-black/10"
                >
                  <X className="h-3 w-3" />
                </span>
              </span>
            ))
          ) : (
            <span className="text-zinc-400 py-0.5">Empty</span>
          )}
        </div>
        <ChevronDown className="h-3.5 w-3.5 shrink-0 text-zinc-400" />
      </button>

      {isOpen && (
        <div className="absolute left-0 top-full z-50 mt-1 min-w-full max-w-xs rounded-lg border border-zinc-200 bg-white py-1 shadow-lg dark:border-zinc-700 dark:bg-zinc-900">
          {options.length === 0 ? (
            <div className="px-3 py-2 text-sm text-zinc-400">
              No options available
            </div>
          ) : (
            options.map((option) => {
              const isSelected = value.includes(option.id);
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => toggleOption(option.id)}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800"
                >
                  <span
                    className="inline-flex items-center rounded px-2 py-0.5 text-xs font-medium"
                    style={{
                      backgroundColor: getOptionBgColor(option.color),
                      color: getOptionTextColor(option.color),
                    }}
                  >
                    {option.label}
                  </span>
                  {isSelected && (
                    <span className="ml-auto text-[#2E7D45]">✓</span>
                  )}
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
