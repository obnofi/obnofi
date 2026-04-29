import { NextRequest } from "next/server";
import { prisma } from "@obnofi/db";
import { getRequestUserId, getSessionUserId } from "@/lib/request-auth";

/**
 * request가 주어지면 Bearer 토큰 → 세션 순으로 userId를 resolve.
 * request 없이 호출하면 세션만 확인 (기존 동작 유지).
 */
export async function getAuthenticatedUserId(request?: NextRequest): Promise<string | null> {
  if (request) {
    return getRequestUserId(request);
  }
  return getSessionUserId();
}

export async function resolveWorkspaceForUser(
  userId: string,
  requestedWorkspaceId?: string | null
) {
  if (requestedWorkspaceId) {
    return prisma.workspace.findFirst({
      where: {
        id: requestedWorkspaceId,
        members: {
          some: { userId },
        },
      },
      select: { id: true },
    });
  }

  // Run both queries in parallel; prefer owned workspace if found
  const [ownedWorkspace, anyMembership] = await Promise.all([
    prisma.workspace.findFirst({
      where: { members: { some: { userId, role: "OWNER" } } },
      orderBy: { createdAt: "asc" },
      select: { id: true },
    }),
    prisma.workspaceMember.findFirst({
      where: { userId },
      orderBy: { joinedAt: "asc" },
      select: { workspaceId: true },
    }),
  ]);

  if (ownedWorkspace) return ownedWorkspace;
  if (!anyMembership) return null;
  return { id: anyMembership.workspaceId };
}
