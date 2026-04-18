"use client";

import type { Task } from "@/types/database";
import { useDatabaseViewStore } from "@/store/useDatabaseViewStore";
import { BoardView } from "@/components/database/views/BoardView";
import { CalendarView } from "@/components/database/views/CalendarView";
import { GalleryView } from "@/components/database/views/GalleryView";
import { ListView } from "@/components/database/views/ListView";
import { TaskTableView } from "@/components/database/views/TableView";
import { TimelineView } from "@/components/database/views/TimelineView";

interface DatabaseViewRendererProps {
  tasks: Task[];
}

export function DatabaseViewRenderer({
  tasks,
}: DatabaseViewRendererProps) {
  const activeView = useDatabaseViewStore((state) => state.activeView);

  switch (activeView) {
    case "board":
      return <BoardView tasks={tasks} />;
    case "calendar":
      return <CalendarView tasks={tasks} />;
    case "gallery":
      return <GalleryView tasks={tasks} />;
    case "list":
      return <ListView tasks={tasks} />;
    case "timeline":
      return <TimelineView tasks={tasks} />;
    case "table":
    default:
      return <TaskTableView tasks={tasks} />;
  }
}
