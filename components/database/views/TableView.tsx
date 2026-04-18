"use client";

import type { Task } from "@/types/database";
import { formatTaskDay, getStatusClasses } from "@/lib/task-view-utils";

interface TaskTableViewProps {
  tasks: Task[];
}

export function TaskTableView({ tasks }: TaskTableViewProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white">
      <div className="overflow-x-auto">
        <table className="min-w-full border-separate border-spacing-0 text-sm">
          <thead className="bg-zinc-50">
            <tr className="text-left text-xs uppercase tracking-[0.12em] text-zinc-500">
              <th className="border-b border-zinc-200 px-4 py-3 font-medium">Task</th>
              <th className="border-b border-zinc-200 px-4 py-3 font-medium">Status</th>
              <th className="border-b border-zinc-200 px-4 py-3 font-medium">Tags</th>
              <th className="border-b border-zinc-200 px-4 py-3 font-medium">Date</th>
              <th className="border-b border-zinc-200 px-4 py-3 font-medium">Timeline</th>
            </tr>
          </thead>
          <tbody>
            {tasks.map((task) => (
              <tr key={task.id} className="text-zinc-700">
                <td className="border-b border-zinc-100 px-4 py-3 font-medium text-[#111110]">
                  {task.name}
                </td>
                <td className="border-b border-zinc-100 px-4 py-3">
                  <span
                    className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${getStatusClasses(task.status)}`}
                  >
                    {task.status}
                  </span>
                </td>
                <td className="border-b border-zinc-100 px-4 py-3">
                  <div className="flex flex-wrap gap-2">
                    {task.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs text-zinc-600"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="border-b border-zinc-100 px-4 py-3 text-zinc-500">
                  {formatTaskDay(task.date)}
                </td>
                <td className="border-b border-zinc-100 px-4 py-3 text-zinc-500">
                  {formatTaskDay(task.startDate)} - {formatTaskDay(task.endDate)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
