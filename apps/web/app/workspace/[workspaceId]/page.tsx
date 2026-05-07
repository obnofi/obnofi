import { redirect } from "next/navigation";
import { WorkspacePage } from "./WorkspacePage";
import { prisma } from "@obnofi/db";
import { toPage, PAGE_SELECT } from "@/lib/prisma-transforms";
import { isPrismaDatabaseUnavailable } from "@/lib/prisma-errors";
import { DatabaseUnavailableState } from "@/components/workspace/DatabaseUnavailableState";

interface WorkspacePageRouteProps {
  params: Promise<{ workspaceId: string }>;
}

// searchParams를 의도적으로 받지 않는다 — 받으면 dynamic이 되어 페이지 클릭마다
// SSR이 재실행되며 사이드바 페이지 목록까지 매번 다시 fetch된다. 활성 페이지 본문은
// 클라이언트의 fetchPage가 처리하고, 사이드바 목록은 이 SSR에서 한 번만 가져온다.
export default async function WorkspacePageRoute({
  params,
}: WorkspacePageRouteProps) {
  const { workspaceId } = await params;

  let workspace;
  let prismaPages;

  try {
    [workspace, prismaPages] = await Promise.all([
      prisma.workspace.findUnique({
        where: { id: workspaceId },
        select: { id: true },
      }),
      prisma.page.findMany({
        where: { workspaceId, parentDatabaseId: null },
        select: PAGE_SELECT,
        orderBy: { updatedAt: "desc" },
      }),
    ]);
  } catch (error) {
    if (isPrismaDatabaseUnavailable(error)) {
      return <DatabaseUnavailableState detail={(error as Error).message} />;
    }

    throw error;
  }

  if (!workspace) {
    redirect("/workspace");
  }

  const initialPages = prismaPages.map(toPage);

  return (
    <WorkspacePage
      workspaceId={workspaceId}
      initialPages={initialPages}
    />
  );
}
