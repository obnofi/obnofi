import { prisma } from '@obnofi/db'

function resolveWebAppUrl(): string {
  const configuredUrl =
    process.env.NEXTAUTH_URL ??
    process.env.NEXT_PUBLIC_APP_URL ??
    process.env.APP_URL

  return (configuredUrl?.trim() || 'http://localhost:3000').replace(/\/+$/, '')
}

async function getUserIdFromSessionCookie(cookieHeader: string): Promise<string | null> {
  try {
    const response = await fetch(`${resolveWebAppUrl()}/api/profile`, {
      headers: {
        cookie: cookieHeader,
      },
    })

    if (!response.ok) return null

    const profile = await response.json() as { id?: unknown }
    return typeof profile.id === 'string' ? profile.id : null
  } catch {
    return null
  }
}

export async function checkPageAccess(
  pageId: string,
  cookieHeader: string | null,
  explicitUserId: string | null
): Promise<boolean> {
  // 페이지 조회 (collaborationEnabled + 워크스페이스 오너/멤버 확인용)
  const page = await prisma.page.findUnique({
    where: { id: pageId },
    select: {
      collaborationEnabled: true,
      workspaceId: true,
      workspace: { select: { ownerId: true } },
    },
  }).catch(() => null)

  if (!page) return false
  if (!page.collaborationEnabled) return false

  const cookieUserId = cookieHeader
    ? await getUserIdFromSessionCookie(cookieHeader)
    : null

  const candidateUserIds = [...new Set([explicitUserId, cookieUserId].filter(Boolean))] as string[]
  if (candidateUserIds.length === 0) return false

  for (const userId of candidateUserIds) {
    // 워크스페이스 오너는 항상 허용
    if (page.workspace.ownerId === userId) return true

    // 워크스페이스 멤버는 페이지 협업이 켜진 문서에 기본 접근 가능
    const membership = await prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId: page.workspaceId,
          userId,
        },
      },
      select: { id: true },
    }).catch(() => null)

    if (membership) return true

    // 개별 초대 collaborator도 허용
    const collaborator = await prisma.pageCollaborator.findUnique({
      where: { pageId_userId: { pageId, userId } },
      select: { id: true },
    }).catch(() => null)

    if (collaborator) return true
  }

  return false
}
