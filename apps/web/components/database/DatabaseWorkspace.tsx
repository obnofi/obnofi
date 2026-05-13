"use client";

import { useRef, type Ref } from "react";
import { DatabasePageCard } from "@/components/database/DatabasePageCard";
import { useUIStore } from "@/store/useUIStore";
import { useCollaboration } from "@/lib/collaboration/CollaborationContext";
import { useDatabaseRealtime } from "@/hooks/useDatabaseRealtime";
import {
  MossNoteDock,
  type MossNoteDockHandle,
} from "@/components/workspace/MossNoteDock";

interface DatabaseWorkspaceProps {
  pageId: string;
  workspaceId: string;
  mossNoteDockRef?: Ref<MossNoteDockHandle>;
}

export function DatabaseWorkspace({
  pageId,
  workspaceId,
  mossNoteDockRef,
}: DatabaseWorkspaceProps) {
  const surfaceRef = useRef<HTMLDivElement | null>(null);
  const openGrovePageSideTab = useUIStore((state) => state.openGrovePageSideTab);
  const { provider } = useCollaboration();
  const realtimeEnabled = Boolean(provider);

  useDatabaseRealtime(pageId, realtimeEnabled);

  return (
    <div
      ref={surfaceRef}
      className="relative flex h-full flex-col overflow-hidden bg-[var(--color-background)] px-12 pb-6 pt-8"
    >
      <div className="flex-1 overflow-hidden">
        <DatabasePageCard
          pageId={pageId}
          containerTestId="workspace-database"
          loadingTestId="workspace-database-loading"
          readyTestId="workspace-database-ready"
          emptyTestId="workspace-database-empty"
          onOpenRow={(rowId) => openGrovePageSideTab(rowId, workspaceId)}
          emptyMessage="Database not found"
          compact={true}
          maxContentHeightClass="h-full"
          editableTitle={true}
        />
      </div>
      <MossNoteDock ref={mossNoteDockRef} pageId={pageId} surfaceRef={surfaceRef} />
    </div>
  );
}
