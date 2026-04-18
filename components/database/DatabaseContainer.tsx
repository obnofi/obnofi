"use client";

import type { Task } from "@/types/database";
import { DatabaseViewRenderer } from "@/components/database/DatabaseViewRenderer";
import { DatabaseViewTabs } from "@/components/database/DatabaseViewTabs";

interface DatabaseContainerProps {
  tasks: Task[];
}

export function DatabaseContainer({ tasks }: DatabaseContainerProps) {
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-3xl border border-zinc-200 bg-white">
      <DatabaseViewTabs />
      <div className="flex-1 overflow-auto p-6">
        <DatabaseViewRenderer tasks={tasks} />
      </div>
    </div>
  );
}
