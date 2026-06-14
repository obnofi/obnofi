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

// 부모 문서의 일부로 함께 게시되어야 하는 inline 임베드 노드 타입.
// (canvas=Clearing, databaseNode=Undergrowth, mindMapEmbed=MindGrove)
// linkedDatabaseEmbed/subPageEmbed 은 standalone 참조이므로 제외 — 각자 isPublic 존중.
const INLINE_EMBED_TYPES = new Set(["canvasEmbed", "databaseNode", "mindMapEmbed"]);

/**
 * shared 페이지 content를 순회하며 inline 임베드 자식 pageId를 수집한다.
 */
function collectInlineEmbedPageIds(content: object | null): string[] {
  const ids = new Set<string>();

  const walk = (node: unknown) => {
    if (Array.isArray(node)) {
      node.forEach(walk);
      return;
    }
    if (!node || typeof node !== "object") return;

    const record = node as Record<string, unknown>;
    if (typeof record.type === "string" && INLINE_EMBED_TYPES.has(record.type)) {
      const attrs =
        record.attrs && typeof record.attrs === "object"
          ? (record.attrs as Record<string, unknown>)
          : null;
      if (attrs && typeof attrs.pageId === "string") {
        ids.add(attrs.pageId);
      }
    }

    for (const value of Object.values(record)) {
      walk(value);
    }
  };

  walk(content);
  return [...ids];
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

  // inline 임베드 자식 페이지는 isPublic 플래그가 없어도 부모 문서와 함께 공개한다.
  // parentId === page.id 로 스코프하여 임의 페이지 노출을 막는다.
  const inlineEmbedIds = collectInlineEmbedPageIds(latestContent);
  const inlineEmbedPages = inlineEmbedIds.length
    ? await prisma.page.findMany({
        where: {
          id: { in: inlineEmbedIds },
          workspaceId: page.workspaceId,
          parentId: page.id,
        },
        select: { id: true, title: true },
      })
    : [];

  const knownPageIds = new Set(publicPages.map((p) => p.id));
  const allowedPages = [
    ...publicPages,
    ...inlineEmbedPages.filter((p) => !knownPageIds.has(p.id)),
  ];
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
    content: sanitizePublicContent(latestContent, allowedPages),
    updatedAt: latestUpdatedAt.toISOString(),
    isPasswordProtected: false,
  };
}
