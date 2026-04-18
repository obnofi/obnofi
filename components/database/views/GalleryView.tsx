"use client";

import type { Task } from "@/types/database";
import {
  formatTaskDay,
  getStatusClasses,
  getTaskDurationInDays,
} from "@/lib/task-view-utils";

interface GalleryViewProps {
  tasks: Task[];
}

const accents = [
  "from-zinc-100 to-zinc-50",
  "from-emerald-100 to-lime-50",
  "from-amber-100 to-orange-50",
  "from-sky-100 to-cyan-50",
];

export function GalleryView({ tasks }: GalleryViewProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {tasks.map((task, index) => (
        <article
          key={task.id}
          className="overflow-hidden rounded-2xl border border-zinc-200 bg-white"
        >
          <div className={`h-28 bg-gradient-to-br ${accents[index % accents.length]}`} />
          <div className="space-y-3 p-4">
            <div className="flex items-start justify-between gap-3">
              <h3 className="text-sm font-semibold text-[#111110]">{task.name}</h3>
              <span
                className={`shrink-0 rounded-full px-2 py-1 text-[11px] font-medium ${getStatusClasses(task.status)}`}
              >
                {task.status}
              </span>
            </div>
            <p className="text-xs text-zinc-500">
              {formatTaskDay(task.startDate)} - {formatTaskDay(task.endDate)} ·{" "}
              {getTaskDurationInDays(task)}일
            </p>
            <div className="flex flex-wrap gap-2">
              {task.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-zinc-100 px-2 py-1 text-[11px] text-zinc-600"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
