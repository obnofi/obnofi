import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@obnofi/db";
import { getAuthenticatedUserId } from "@/lib/workspace-resolution";
import { jsonWithPrivateReadCache } from "@/lib/httpCache";

export async function GET(request: NextRequest) {
  try {
    const userId = await getAuthenticatedUserId(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const memberships = await prisma.workspaceMember.findMany({
      where: { userId },
      orderBy: [
        { role: "asc" },
        { joinedAt: "asc" },
      ],
      select: {
        role: true,
        workspace: {
          select: {
            id: true,
            name: true,
            slug: true,
            icon: true,
            ownerId: true,
            owner: {
              select: {
                image: true,
              },
            },
            createdAt: true,
            updatedAt: true,
          },
        },
      },
    });

    return jsonWithPrivateReadCache(
      memberships.map(({ role, workspace }) => ({
        id: workspace.id,
        name: workspace.name,
        slug: workspace.slug,
        icon: workspace.icon,
        ownerId: workspace.ownerId,
        ownerImage: workspace.owner.image,
        role,
        createdAt: workspace.createdAt.toISOString(),
        updatedAt: workspace.updatedAt.toISOString(),
      }))
    );
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch workspaces" },
      { status: 500 }
    );
  }
}
