"use client";

import { useRouter } from "next/navigation";
import { DatabasePageCard } from "@/components/database/DatabasePageCard";

interface DatabaseWorkspaceProps {
  pageId: string;
  workspaceId: string;
}

export function DatabaseWorkspace({ pageId, workspaceId }: DatabaseWorkspaceProps) {
  const router = useRouter();

  return (
    <div className="flex h-full flex-col overflow-hidden bg-white px-12 pb-6 pt-8">
      <div className="flex-1 overflow-hidden">
        <DatabasePageCard
          pageId={pageId}
          containerTestId="workspace-database"
          loadingTestId="workspace-database-loading"
          readyTestId="workspace-database-ready"
          emptyTestId="workspace-database-empty"
          onOpenRow={(rowId) => router.push(`/workspace/${workspaceId}?page=${rowId}`)}
          emptyMessage="Database not found"
          compact={true}
          maxContentHeightClass="h-full"
          editableTitle={true}
        />
      </div>
    </div>
  );
}
