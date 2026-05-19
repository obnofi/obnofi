"use client";

import { GraphView } from "@/components/graph/GraphView";

interface WorkspaceGraphPageProps {
  workspaceId: string;
}

export function WorkspaceGraphPage({ workspaceId }: WorkspaceGraphPageProps) {
  return (
    <div data-testid="workspace-graph-page" className="flex h-full flex-col">
      <GraphView workspaceId={workspaceId} />
    </div>
  );
}
