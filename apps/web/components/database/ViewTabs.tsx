"use client";

import { DatabasePage, PropertyType, ViewType } from "@obnofi/types";
import { DatabaseSurface } from "@/components/database/DatabaseSurface";

type GroveSurfaceView = Extract<
  ViewType,
  "table" | "gallery" | "board" | "calendar" | "list" | "timeline"
>;

interface ViewTabsProps {
  databasePage: DatabasePage;
  onDatabaseChange: (databasePage: DatabasePage) => void;
  onOpenRow?: (rowId: string) => void;
  onCreateRow?: () => void | Promise<string | undefined>;
  onCreateProperty?: (name: string, type: PropertyType) => void;
  compact?: boolean;
}

export function ViewTabs({
  databasePage,
  onOpenRow,
  onCreateRow,
  onCreateProperty,
  compact = true,
}: ViewTabsProps) {
  return (
    <DatabaseSurface
      databasePage={databasePage}
      initialViewType={"table" as GroveSurfaceView}
      onOpenRow={onOpenRow}
      onCreateRow={onCreateRow}
      onCreateProperty={onCreateProperty}
      compact={compact}
    />
  );
}
