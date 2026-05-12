"use client";

import { GraphView } from "@/components/graph/GraphView";

interface WorkspaceGraphPageProps {
  workspaceId: string;
}

export function WorkspaceGraphPage({ workspaceId }: WorkspaceGraphPageProps) {
  return <GraphView workspaceId={workspaceId} />;
}
