"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import { SelectOption } from "@/types/database";
import { getOptionBgColor, getOptionTextColor } from "@/lib/property-utils";

interface SelectCellProps {
  value: string | null;
  options: SelectOption[];
  onChange: (optionId: string | null) => void;
  allowEmpty?: boolean;
}

export function SelectCell({
  value,
  options,
  onChange,
  allowEmpty = true,
}: SelectCellProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.id === value);

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

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between gap-1 rounded-md border border-transparent px-2 py-1.5 text-left text-sm transition hover:bg-zinc-100 dark:hover:bg-zinc-800"
      >
        {selectedOption ? (
          <span
            className="inline-flex items-center rounded px-2 py-0.5 text-xs font-medium"
            style={{
              backgroundColor: getOptionBgColor(selectedOption.color),
              color: getOptionTextColor(selectedOption.color),
            }}
          >
            {selectedOption.label}
          </span>
        ) : (
          <span className="text-zinc-400">Empty</span>
        )}
        <ChevronDown className="h-3.5 w-3.5 shrink-0 text-zinc-400" />
      </button>

      {isOpen && (
        <div className="absolute left-0 top-full z-[99999] mt-1 min-w-full max-w-xs rounded-lg border border-zinc-200 bg-white py-1 shadow-lg dark:border-zinc-700 dark:bg-zinc-900">
          {allowEmpty && (
            <button
              type="button"
              onClick={() => {
                onChange(null);
                setIsOpen(false);
              }}
              className="w-full px-3 py-2 text-left text-sm text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
              Empty
            </button>
          )}
          {options.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => {
                onChange(option.id);
                setIsOpen(false);
              }}
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
              {value === option.id && (
                <span className="ml-auto text-[#2E7D45]">✓</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
