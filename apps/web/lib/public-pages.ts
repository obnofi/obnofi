import { prisma } from "@obnofi/db";
import { sanitizePublicContent } from "@/lib/public-content";
import { resolvePersistedYjsContent } from "@/lib/yjsContent";

export interface PublicPageResponse {
  id: string;
  workspaceId: string;
  title: string;
  icon: string | null;
  coverImage: string | null;
  content: object | null;
  updatedAt: string;
  isPasswordProtected: boolean;
}

export async function getSharedPageRecord(shareId: string) {
  return prisma.page.findFirst({
    where: { shareId, isPublic: true },
    select: {
      id: true,
      title: true,
      icon: true,
      coverImage: true,
      content: true,
      workspaceId: true,
      updatedAt: true,
      sharePassword: true,
      yjsDocument: {
        select: {
          state: true,
          updatedAt: true,
        },
      },
    },
  });
}

export async function buildPublicPageResponse(
  shareId: string,
  options?: { includeProtectedContent?: boolean }
): Promise<PublicPageResponse | null> {
  const page = await getSharedPageRecord(shareId);

  if (!page) {
    return null;
  }

  const isPasswordProtected = Boolean(page.sharePassword);
  if (isPasswordProtected && !options?.includeProtectedContent) {
    return {
      id: page.id,
      workspaceId: page.workspaceId,
      title: page.title,
      icon: page.icon,
      coverImage: page.coverImage,
      content: null,
      updatedAt: page.updatedAt.toISOString(),
      isPasswordProtected: true,
    };
  }

  const publicPages = await prisma.page.findMany({
    where: { workspaceId: page.workspaceId, isPublic: true },
    select: { id: true, title: true },
  });

  const latestContent =
    resolvePersistedYjsContent(page.yjsDocument?.state) ??
    (page.content as object | null);
  const latestUpdatedAt =
    page.yjsDocument?.updatedAt &&
    page.yjsDocument.updatedAt.getTime() > page.updatedAt.getTime()
      ? page.yjsDocument.updatedAt
      : page.updatedAt;

  return {
    id: page.id,
    workspaceId: page.workspaceId,
    title: page.title,
    icon: page.icon,
    coverImage: page.coverImage,
    content: sanitizePublicContent(latestContent, publicPages),
    updatedAt: latestUpdatedAt.toISOString(),
    isPasswordProtected: false,
  };
}
