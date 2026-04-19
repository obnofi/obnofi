"use client";

import type { Page } from "@/types";
import { DatabaseTableCard } from "@/components/database/DatabaseTableCard";
import { useDatabasePage } from "@/hooks/useDatabasePage";

interface DatabaseSelectionProps {
  pages: Page[];
  selectedValue: string;
  onChange: (pageId: string) => void;
  onCreate?: () => void;
}

interface DatabasePageCardProps {
  pageId: string | null | undefined;
  onOpenRow: (rowId: string) => void;
  onOpenDatabase?: () => void;
  selection?: DatabaseSelectionProps;
  headerLabel?: string;
  emptyMessage: string;
  loadingTestId: string;
  readyTestId: string;
  emptyTestId: string;
  containerTestId: string;
  compact?: boolean;
  maxContentHeightClass?: string;
  state?: "loading" | "ready" | "creating" | "empty";
  editableTitle?: boolean;
}

export function DatabasePageCard({
  pageId,
  onOpenRow,
  onOpenDatabase,
  selection,
  headerLabel,
  emptyMessage,
  loadingTestId,
  readyTestId,
  emptyTestId,
  containerTestId,
  compact = true,
  maxContentHeightClass,
  state,
  editableTitle = false,
}: DatabasePageCardProps) {
  const {
    databasePage,
    isLoading,
    setDatabasePage,
    updateDatabaseTitle,
  } = useDatabasePage(pageId);

  return (
    <DatabaseTableCard
      containerTestId={containerTestId}
      loadingTestId={loadingTestId}
      readyTestId={readyTestId}
      emptyTestId={emptyTestId}
      databasePage={databasePage}
      isLoading={isLoading}
      onDatabaseChange={setDatabasePage}
      onOpenRow={onOpenRow}
      onTitleChange={editableTitle ? updateDatabaseTitle : undefined}
      selection={selection}
      headerLabel={headerLabel}
      onOpenDatabase={onOpenDatabase}
      emptyMessage={emptyMessage}
      compact={compact}
      maxContentHeightClass={maxContentHeightClass}
      state={state}
    />
  );
}
