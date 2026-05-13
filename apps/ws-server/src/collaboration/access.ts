import { prisma } from '@obnofi/db'

export async function checkPageAccess(pageId: string, sessionToken: string | null): Promise<boolean> {
  // 세션 토큰 없으면 거부
  if (!sessionToken) return false

  // 세션으로 userId 조회
  const session = await prisma.session.findUnique({
    where: { sessionToken },
    select: { userId: true, expires: true },
  }).catch(() => null)

  if (!session || session.expires < new Date()) return false
  const userId = session.userId

  // 페이지 조회 (collaborationEnabled + 워크스페이스 오너)
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

  // 워크스페이스 오너는 항상 허용
  if (page.workspace.ownerId === userId) return true

  // PageCollaborator 여부 확인
  const collaborator = await prisma.pageCollaborator.findUnique({
    where: { pageId_userId: { pageId, userId } },
    select: { id: true },
  }).catch(() => null)

  return Boolean(collaborator)
}
