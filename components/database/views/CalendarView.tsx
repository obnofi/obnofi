"use client";

import { useMemo } from "react";
import type { Task } from "@/types/database";
import {
  buildTasksByDate,
  formatTaskMonth,
  parseTaskDate,
  toTaskDateKey,
} from "@/lib/task-view-utils";

interface CalendarViewProps {
  tasks: Task[];
}

const weekdays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function CalendarView({ tasks }: CalendarViewProps) {
  const tasksByDate = useMemo(() => buildTasksByDate(tasks), [tasks]);

  const { monthLabel, cells } = useMemo(() => {
    const anchor = tasks[0]?.date ?? new Date().toISOString().slice(0, 10);
    const monthStart = parseTaskDate(anchor);
    monthStart.setDate(1);

    const year = monthStart.getFullYear();
    const month = monthStart.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOffset = (monthStart.getDay() + 6) % 7;
    const totalCells = Math.ceil((firstDayOffset + daysInMonth) / 7) * 7;

    return {
      monthLabel: formatTaskMonth(anchor),
      cells: Array.from({ length: totalCells }, (_, index) => {
        const day = index - firstDayOffset + 1;

        if (day < 1 || day > daysInMonth) {
          return null;
        }

        const date = toTaskDateKey(new Date(year, month, day));
        return { date, day };
      }),
    };
  }, [tasks]);

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-4">
      <h3 className="mb-4 text-sm font-semibold text-[#111110]">{monthLabel}</h3>
      <div className="grid grid-cols-7 gap-2 text-center text-xs font-medium text-zinc-500">
        {weekdays.map((day) => (
          <div key={day} className="py-2">
            {day}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-2">
        {cells.map((cell, index) => (
          <div
            key={cell?.date ?? `empty-${index}`}
            className="min-h-28 rounded-2xl border border-zinc-100 bg-zinc-50 p-2"
          >
            {cell ? (
              <>
                <div className="text-xs font-medium text-zinc-500">{cell.day}</div>
                <div className="mt-2 space-y-1.5">
                  {tasksByDate.get(cell.date)?.map((task) => (
                    <div
                      key={task.id}
                      className="truncate rounded-lg bg-white px-2 py-1 text-[11px] text-zinc-700 shadow-sm"
                    >
                      {task.name}
                    </div>
                  ))}
                </div>
              </>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}
