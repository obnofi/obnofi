import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { authenticateRequest } from "../lib/auth.js";
import { prisma } from "../lib/prisma.js";

interface QueryParams {
  source?: string;
  limit?: string;
}

export async function feedRoutes(server: FastifyInstance) {
  // 인증 미들웨어 적용
  server.addHook("preHandler", async (request: FastifyRequest, reply: FastifyReply) => {
    const isAuthenticated = await authenticateRequest(request, reply);
    if (!isAuthenticated) return;
  });

  // GET /feed?source=&limit= - 피드 아이템 조회
  server.get("/", async (request: FastifyRequest<{ Querystring: QueryParams }>, reply: FastifyReply) => {
    const userId = request.user!.id;
    const limit = Math.min(parseInt(request.query.limit || "10"), 50);
    const sourceFilter = request.query.source;

    // 사용자가 접근할 수 있는 워크스페이스 ID 목록 조회
    const memberships = await prisma.workspaceMember.findMany({
      where: { userId },
      select: { workspaceId: true },
    });
    const ownedWorkspaces = await prisma.workspace.findMany({
      where: { ownerId: userId },
      select: { id: true },
    });

    const workspaceIds = [
      ...memberships.map((m) => m.workspaceId),
      ...ownedWorkspaces.map((w) => w.id),
    ];

    // 구독 소스 조회
    const where: any = {
      workspaceId: { in: workspaceIds },
    };

    if (sourceFilter) {
      where.source = sourceFilter.toUpperCase();
    }

    const subscriptions = await prisma.subscription.findMany({
      where,
      select: {
        id: true,
        source: true,
        displayName: true,
        identifier: true,
      },
    });

    const subscriptionIds = subscriptions.map((s) => s.id);

    if (subscriptionIds.length === 0) {
      return reply.send({
        feeds: [],
        sources: [],
      });
    }

    // 피드 아이템 조회
    const feedItems = await prisma.feedItem.findMany({
      where: {
        subscriptionId: { in: subscriptionIds },
      },
      orderBy: { publishedAt: "desc" },
      take: limit,
      include: {
        subscription: {
          select: {
            source: true,
            displayName: true,
          },
        },
      },
    });

    // 소스 목록 조회
    const sources = await prisma.subscription.findMany({
      where: { workspaceId: { in: workspaceIds } },
      select: {
        source: true,
        displayName: true,
        identifier: true,
        enabled: true,
      },
      distinct: ["source"],
    });

    const formattedFeeds = feedItems.map((item) => ({
      id: item.id,
      title: item.title,
      url: item.url,
      summary: item.summary,
      thumbnail: item.thumbnail,
      publishedAt: item.publishedAt,
      fetchedAt: item.fetchedAt,
      source: item.subscription.displayName || item.subscription.source,
      sourceType: item.subscription.source,
    }));

    return reply.send({
      feeds: formattedFeeds,
      sources: sources.map((s) => ({
        name: s.source,
        displayName: s.displayName || s.source,
        identifier: s.identifier,
        enabled: s.enabled,
      })),
    });
  });
}
