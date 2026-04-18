"use client";

import { useMemo } from "react";
import type { Task } from "@/types/database";
import {
  differenceInDays,
  formatTaskDay,
  getStatusClasses,
  getTimelineBounds,
} from "@/lib/task-view-utils";

interface TimelineViewProps {
  tasks: Task[];
}

export function TimelineView({ tasks }: TimelineViewProps) {
  const { bounds, totalDays } = useMemo(() => {
    const timelineBounds = getTimelineBounds(tasks);
    const days = timelineBounds.start && timelineBounds.end
      ? differenceInDays(timelineBounds.start, timelineBounds.end) + 1
      : 1;

    return {
      bounds: timelineBounds,
      totalDays: Math.max(days, 1),
    };
  }, [tasks]);

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-4">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-[#111110]">Project Timeline</h3>
        <p className="text-xs text-zinc-500">
          {formatTaskDay(bounds.start)} - {formatTaskDay(bounds.end)}
        </p>
      </div>
      <div className="space-y-4">
        {tasks.map((task) => {
          const offset = differenceInDays(bounds.start, task.startDate);
          const width = differenceInDays(task.startDate, task.endDate) + 1;

          return (
            <div key={task.id} className="grid gap-3 md:grid-cols-[220px_minmax(0,1fr)]">
              <div>
                <p className="truncate text-sm font-medium text-[#111110]">{task.name}</p>
                <p className="mt-1 text-xs text-zinc-500">
                  {formatTaskDay(task.startDate)} - {formatTaskDay(task.endDate)}
                </p>
              </div>
              <div className="relative h-10 rounded-full bg-zinc-100">
                <div
                  className={`absolute top-1/2 h-6 -translate-y-1/2 rounded-full px-3 text-xs font-medium leading-6 ${getStatusClasses(task.status)}`}
                  style={{
                    left: `${(offset / totalDays) * 100}%`,
                    width: `${(width / totalDays) * 100}%`,
                  }}
                >
                  <span className="truncate">{task.status}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
