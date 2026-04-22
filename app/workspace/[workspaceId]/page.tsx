import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { WorkspacePage } from "./WorkspacePage";
import { authOptions } from "@/lib/auth";

interface WorkspacePageRouteProps {
  params: Promise<{ workspaceId: string }>;
  searchParams: Promise<{ page?: string }>;
}

export default async function WorkspacePageRoute({
  params,
  searchParams,
}: WorkspacePageRouteProps) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/auth/signin");
  }

  const { workspaceId } = await params;
  const { page: pageId } = await searchParams;

  return (
    <WorkspacePage
      workspaceId={workspaceId}
      pageId={pageId || "page-1"}
    />
  );
}
