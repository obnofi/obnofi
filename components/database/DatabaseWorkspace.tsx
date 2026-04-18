"use client";

import { useRouter } from "next/navigation";
import { DatabaseTableCard } from "@/components/database/DatabaseTableCard";
import { useDatabasePage } from "@/hooks/useDatabasePage";

interface DatabaseWorkspaceProps {
  pageId: string;
  workspaceId: string;
}

export function DatabaseWorkspace({ pageId, workspaceId }: DatabaseWorkspaceProps) {
  const router = useRouter();
  const {
    databasePage,
    isLoading,
    setDatabasePage,
    updateDatabaseTitle,
  } = useDatabasePage(pageId);

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-300 border-t-[#2E7D45]" />
      </div>
    );
  }

  if (!databasePage) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-zinc-500 dark:text-zinc-400">
        Database not found
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col overflow-hidden bg-white px-12 pb-6 pt-8">
      <div className="flex-1 overflow-hidden">
        <DatabaseTableCard
          containerTestId="workspace-database"
          loadingTestId="workspace-database-loading"
          readyTestId="workspace-database-ready"
          emptyTestId="workspace-database-empty"
          databasePage={databasePage}
          isLoading={false}
          onDatabaseChange={setDatabasePage}
          onOpenRow={(rowId) => router.push(`/workspace/${workspaceId}?page=${rowId}`)}
          onTitleChange={updateDatabaseTitle}
          emptyMessage="Database not found"
          compact={true}
          maxContentHeightClass="h-full"
        />
      </div>
    </div>
  );
}
