"use client";

import type { Task } from "@/types/database";
import { formatTaskDay, getStatusClasses } from "@/lib/task-view-utils";

interface ListViewProps {
  tasks: Task[];
}

export function ListView({ tasks }: ListViewProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white">
      {tasks.map((task) => (
        <div
          key={task.id}
          className="flex items-center gap-4 border-b border-zinc-100 px-4 py-4 last:border-b-0"
        >
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-[#111110]">{task.name}</p>
            <p className="mt-1 text-xs text-zinc-500">
              {task.tags.join(" · ")} · {formatTaskDay(task.date)}
            </p>
          </div>
          <span
            className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${getStatusClasses(task.status)}`}
          >
            {task.status}
          </span>
        </div>
      ))}
    </div>
  );
}
