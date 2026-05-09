import type { ReactNode } from "react";
import dynamic from "next/dynamic";

const WorkspaceSidebar = dynamic(
  () =>
    import("@/components/workspace/WorkspaceSidebar").then((mod) => mod.WorkspaceSidebar),
  {
    ssr: false,
    loading: () => <WorkspaceSidebarSkeleton />,
  }
);

interface WorkspaceLayoutProps {
  children: ReactNode;
  params: Promise<{ workspaceId: string }>;
}

export default async function WorkspaceWorkspaceIdLayout({
  children,
  params,
}: WorkspaceLayoutProps) {
  const { workspaceId } = await params;

  return (
    <div className="flex h-screen bg-[var(--color-background)]">
      <WorkspaceSidebar workspaceId={workspaceId} />
      <main className="relative flex min-w-0 flex-1 flex-col overflow-hidden">
        {children}
      </main>
    </div>
  );
}

function WorkspaceSidebarSkeleton() {
  return (
    <aside
      aria-hidden="true"
      className="flex h-full w-[240px] shrink-0 flex-col border-r border-[var(--color-border)] bg-[var(--color-surface)]"
    >
      <div className="flex items-center gap-2 px-3 py-3">
        <div className="h-6 w-6 rounded-md bg-[var(--color-hover)]" />
        <div className="h-4 w-24 rounded bg-[var(--color-hover)]" />
      </div>
      <div className="flex flex-col gap-2 px-3 py-2">
        <div className="h-8 rounded-md bg-[var(--color-hover)]" />
        <div className="h-8 rounded-md bg-[var(--color-hover)]" />
        <div className="h-8 rounded-md bg-[var(--color-hover)]" />
      </div>
      <div className="flex-1 px-3 py-4">
        <div className="flex flex-col gap-2">
          <div className="h-3 w-12 rounded bg-[var(--color-hover)]" />
          <div className="h-7 rounded-md bg-[var(--color-hover)]" />
          <div className="h-7 w-[85%] rounded-md bg-[var(--color-hover)]" />
          <div className="h-7 w-[78%] rounded-md bg-[var(--color-hover)]" />
          <div className="h-7 rounded-md bg-[var(--color-hover)]" />
          <div className="h-7 w-[72%] rounded-md bg-[var(--color-hover)]" />
        </div>
      </div>
    </aside>
  );
}
