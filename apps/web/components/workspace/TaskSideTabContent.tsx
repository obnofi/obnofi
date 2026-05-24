"use client";

import { useEffect, useState } from "react";
import { CalendarDays, Tag } from "lucide-react";

export interface SideTabTask {
  id: string;
  name: string;
  status: string;
  tags?: string[];
  date?: string;
  startDate?: string;
  endDate?: string;
  description?: string;
  coverUrl?: string;
}

export function TaskSideTabContent({ task }: { task: SideTabTask }) {
  const [draftTask, setDraftTask] = useState(task);

  useEffect(() => {
    setDraftTask(task);
  }, [task]);

  return (
    <div className="mx-auto max-w-3xl">
      {draftTask.coverUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={draftTask.coverUrl}
          alt={draftTask.name}
          className="mb-6 h-48 w-full rounded-2xl object-cover"
        />
      ) : null}
      <input
        name="task-name"
        type="text"
        value={draftTask.name}
        onChange={(event) =>
          setDraftTask((current) => ({ ...current, name: event.target.value }))
        }
        className="mb-6 w-full border-none bg-transparent text-[34px] font-bold text-[var(--color-text-primary)] outline-none"
      />
      <div className="grid gap-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 text-sm">
        <div className="flex items-center justify-between gap-3">
          <span className="text-[var(--color-text-secondary)]">Status</span>
          <select
            name="task-status"
            value={draftTask.status}
            onChange={(event) =>
              setDraftTask((current) => ({
                ...current,
                status: event.target.value,
              }))
            }
            className="rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] px-2.5 py-1 text-xs font-medium text-[var(--color-text-primary)] outline-none"
          >
            <option>To Do</option>
            <option>In Progress</option>
            <option>Done</option>
          </select>
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className="inline-flex items-center gap-2 text-[var(--color-text-secondary)]">
            <CalendarDays className="h-4 w-4" />
            Date
          </span>
          <input
            name="task-date"
            type="date"
            value={draftTask.date ?? ""}
            onChange={(event) =>
              setDraftTask((current) => ({
                ...current,
                date: event.target.value,
                startDate: event.target.value,
                endDate: event.target.value,
              }))
            }
            className="rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] px-2.5 py-1 text-xs text-[var(--color-text-primary)] outline-none"
          />
        </div>
        <div className="flex items-start justify-between gap-3">
          <span className="inline-flex items-center gap-2 text-[var(--color-text-secondary)]">
            <Tag className="h-4 w-4" />
            Tags
          </span>
          <div className="flex flex-wrap justify-end gap-1.5">
            {(draftTask.tags ?? []).map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-[var(--color-hover)] px-2 py-0.5 text-xs text-[var(--color-text-secondary)]"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>
      <textarea
        name="task-description"
        value={draftTask.description ?? ""}
        onChange={(event) =>
          setDraftTask((current) => ({
            ...current,
            description: event.target.value,
          }))
        }
        placeholder="Task 상세 내용을 입력하세요..."
        className="mt-6 min-h-48 w-full resize-none rounded-2xl border border-[var(--color-border)] bg-[var(--color-background)] p-4 text-sm leading-6 text-[var(--color-text-primary)] outline-none placeholder:text-[var(--color-text-placeholder)]"
      />
    </div>
  );
}
