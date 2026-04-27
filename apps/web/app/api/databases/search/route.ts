import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@obnofi/db";
import { PAGE_INCLUDE } from "@/lib/prisma-transforms";
import {
  getAuthenticatedUserId,
  resolveWorkspaceForUser,
} from "@/lib/workspace-resolution";

export async function GET(request: NextRequest) {
  try {
    const userId = await getAuthenticatedUserId(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const requestedWorkspaceId = searchParams.get("workspaceId");
    const query = searchParams.get("q")?.trim() || "";

    const workspace = await resolveWorkspaceForUser(userId, requestedWorkspaceId);
    if (!workspace) {
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
    }

    const pages = await prisma.page.findMany({
      where: {
        workspaceId: workspace.id,
        type: "DATABASE",
        parentDatabaseId: null,
        ...(query
          ? { title: { contains: query, mode: "insensitive" } }
          : {}),
      },
      include: PAGE_INCLUDE,
    });

    const results = pages
      .map((page) => ({
        id: page.id,
        title: page.title,
        icon: page.icon ?? null,
        databaseId: page.database?.id ?? null,
      }))
      .filter((item) => item.databaseId !== null);

    return NextResponse.json(results);
  } catch {
    return NextResponse.json(
      { error: "Failed to search databases" },
      { status: 500 }
    );
  }
}
