"use client";

import { useMemo } from "react";
import type { Task } from "@/types/database";
import {
  TASK_STATUSES,
  buildTasksByStatus,
  formatTaskDay,
  getStatusClasses,
} from "@/lib/task-view-utils";

interface BoardViewProps {
  tasks: Task[];
}

export function BoardView({ tasks }: BoardViewProps) {
  const groupedTasks = useMemo(() => buildTasksByStatus(tasks), [tasks]);

  return (
    <div className="flex gap-4 overflow-x-auto pb-2">
      {TASK_STATUSES.map((status) => (
        <section
          key={status}
          className="min-w-[280px] flex-1 rounded-2xl border border-zinc-200 bg-zinc-50 p-4"
        >
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-[#111110]">{status}</h3>
            <span
              className={`rounded-full px-2 py-1 text-xs font-medium ${getStatusClasses(status)}`}
            >
              {groupedTasks[status].length}
            </span>
          </div>
          <div className="space-y-3">
            {groupedTasks[status].map((task) => (
              <article
                key={task.id}
                className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm"
              >
                <p className="text-sm font-medium text-[#111110]">{task.name}</p>
                <p className="mt-2 text-xs text-zinc-500">{formatTaskDay(task.date)}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {task.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-zinc-100 px-2 py-1 text-[11px] text-zinc-600"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
