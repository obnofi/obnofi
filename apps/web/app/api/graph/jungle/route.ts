import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@obnofi/db";
import {
  PAGE_GRAPH_SELECT,
  toPage,
  type PrismaPageRow,
} from "@/lib/prisma-transforms";
import { createGraphFromPages } from "@/lib/graph/graphDataUtils";
import { jsonWithPrivateReadCache } from "@/lib/httpCache";
import {
  getAuthenticatedUserId,
  resolveWorkspaceForUser,
} from "@/lib/workspace-resolution";
import { logError } from "@/lib/logger";

export async function GET(request: NextRequest) {
  try {
    const userId = await getAuthenticatedUserId(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const requestedWorkspaceId = request.nextUrl.searchParams.get("workspaceId");
    const workspace = await resolveWorkspaceForUser(userId, requestedWorkspaceId);
    if (!workspace) {
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
    }

    const prismaPages = await prisma.page.findMany({
      where: { workspaceId: workspace.id, parentDatabaseId: null },
      select: PAGE_GRAPH_SELECT,
      orderBy: [{ order: "asc" }, { updatedAt: "desc" }],
    });

    return jsonWithPrivateReadCache(
      createGraphFromPages(prismaPages.map((page) => toPage(page as PrismaPageRow)), null)
    );
  } catch (error) {
    logError("GET /api/graph/jungle", error);
    return NextResponse.json(
      { error: "Failed to fetch graph" },
      { status: 500 }
    );
  }
}
