"use client";

import { CollaborationProvider } from "@/lib/collaboration/CollaborationContext";
import { WorkspaceSidebar } from "@/components/workspace/WorkspaceSidebar";
import { usePageStore } from "@/store/pageStore";

const COLLABORATION_GLOBALLY_DISABLED =
  process.env.NEXT_PUBLIC_ENABLE_COLLABORATION === "false";

export function WorkspaceShell({
  workspaceId,
  children,
}: {
  workspaceId: string;
  children: React.ReactNode;
}) {
  const currentPage = usePageStore((state) => state.currentPage);
  const shouldActivateShellCollaboration =
    !COLLABORATION_GLOBALLY_DISABLED &&
    Boolean(currentPage?.collaborationEnabled) &&
    currentPage?.type !== "document";

  return (
    <CollaborationProvider
      key={currentPage?.id ?? "workspace-shell"}
      pageId={currentPage?.id ?? "workspace-shell"}
      active={shouldActivateShellCollaboration}
      pageType={currentPage?.type ?? null}
    >
      <div className="flex h-screen bg-[var(--color-background)]">
        <div
          id="toolbar-tooltip-root"
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 z-[100000]"
        />
        <WorkspaceSidebar workspaceId={workspaceId} />
        <main className="relative flex min-w-0 flex-1 flex-col overflow-hidden">
          {children}
        </main>
      </div>
    </CollaborationProvider>
  );
}
