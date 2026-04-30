import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { WorkspacePage } from "./WorkspacePage";
import { authOptions } from "@/lib/auth";
import { prisma } from "@obnofi/db";
import { toPage, PAGE_SELECT, PAGE_INCLUDE } from "@/lib/prisma-transforms";

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

  // 워크스페이스 존재 확인 + 페이지 목록 + (URL에 pageId가 있으면) 활성 페이지 본문을 모두 병렬로.
  // 목록은 PAGE_SELECT로 content 제외 — 사이드바에 본문은 불필요.
  const [workspace, prismaPages, urlActivePage] = await Promise.all([
    prisma.workspace.findUnique({
      where: { id: workspaceId },
      select: { id: true },
    }),
    prisma.page.findMany({
      where: { workspaceId, parentDatabaseId: null },
      select: PAGE_SELECT,
      orderBy: { updatedAt: "desc" },
    }),
    pageId
      ? prisma.page.findUnique({
          where: { id: pageId },
          include: PAGE_INCLUDE,
        })
      : Promise.resolve(null),
  ]);

  if (!workspace) {
    redirect("/workspace");
  }

  const initialPages = prismaPages.map(toPage);
  const actualPageId = pageId ?? initialPages[0]?.id;

  if (!actualPageId) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 bg-[var(--color-background)] text-[var(--color-text-secondary)]">
        <span className="text-[15px]">페이지가 없습니다</span>
        <span className="text-[13px]">사이드바에서 새 페이지를 만들어 시작하세요</span>
      </div>
    );
  }

  // URL에 pageId가 있으면 위에서 병렬로 가져온 결과 사용,
  // 없으면 첫 페이지(목록의 0번)를 별도 fetch.
  const activePage =
    urlActivePage ??
    (actualPageId !== pageId
      ? await prisma.page.findUnique({
          where: { id: actualPageId },
          include: PAGE_INCLUDE,
        })
      : null);

  const initialPage = activePage ? toPage(activePage) : undefined;

  return (
    <WorkspacePage
      workspaceId={workspaceId}
      pageId={actualPageId}
      initialPage={initialPage}
      initialPages={initialPages}
    />
  );
}
