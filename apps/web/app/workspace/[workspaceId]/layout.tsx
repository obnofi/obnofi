import type { ReactNode } from "react";
import { WorkspaceShell } from "./WorkspaceShell";

interface WorkspaceLayoutProps {
  children: ReactNode;
  params: Promise<{ workspaceId: string }>;
}

export default async function WorkspaceWorkspaceIdLayout({
  children,
  params,
}: WorkspaceLayoutProps) {
  const { workspaceId } = await params;

  return <WorkspaceShell workspaceId={workspaceId}>{children}</WorkspaceShell>;
}
