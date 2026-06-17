"use client";

import { Property, Page } from "@obnofi/types";
import { useDatabaseViewStore } from "@/store/useDatabaseViewStore";
import { useGroveTable } from "@/hooks/useGroveTable";
import { BoardView } from "@/components/database/views/BoardView";
import { CalendarView } from "@/components/database/views/CalendarView";
import { GalleryView } from "@/components/database/views/GalleryView";
import { ListView } from "@/components/database/views/ListView";
import { TimelineView } from "@/components/database/views/TimelineView";

interface DatabaseViewRendererProps {
  properties: Property[];
  rows: Page[];
}

export function DatabaseViewRenderer({
  properties,
  rows,
}: DatabaseViewRendererProps) {
  const activeView = useDatabaseViewStore((state) => state.activeView);
  const scopeId = `renderer:${properties[0]?.databaseId ?? "default"}`;
  const { table, queryState } = useGroveTable({
    scopeId,
    properties,
    rows,
  });

  switch (activeView) {
    case "board":
      return (
        <BoardView
          table={table}
          properties={properties}
          groupByPropertyId={queryState.grouping[0]}
        />
      );
    case "calendar":
      return <CalendarView table={table} properties={properties} />;
    case "gallery":
      return <GalleryView table={table} properties={properties} />;
    case "list":
      return (
        <ListView
          properties={properties}
          rows={table.getRowModel().rows.map((row) => row.original)}
        />
      );
    case "timeline":
      return (
        <TimelineView
          properties={properties}
          rows={table.getRowModel().rows.map((row) => row.original)}
        />
      );
    default:
      return null;
  }
}
