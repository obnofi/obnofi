import { WorkspacePage } from "./WorkspacePage";

interface WorkspacePageRouteProps {
  params: Promise<{ workspaceId: string }>;
  searchParams: Promise<{ page?: string }>;
}

export default async function WorkspacePageRoute({
  params,
  searchParams,
}: WorkspacePageRouteProps) {
  const { workspaceId } = await params;
  const { page: pageId } = await searchParams;

  return (
    <WorkspacePage
      workspaceId={workspaceId}
      pageId={pageId || "page-1"}
    />
  );
}
