import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@obnofi/db";

import { logError } from "@/lib/logger";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ pageId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { pageId } = await params;

    const collaborators = await prisma.pageCollaborator.findMany({
      where: { pageId },
      include: {
        user: { select: { id: true, name: true, email: true, image: true } },
      },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json(
      collaborators.map((c) => ({
        id: c.id,
        pageId: c.pageId,
        userId: c.userId,
        role: c.role.toLowerCase(),
        invitedBy: c.invitedBy,
        createdAt: c.createdAt.toISOString(),
        user: c.user,
      }))
    );
  } catch (error) {
    logError("GET /api/pages/[pageId]/collaborators", error);
    return NextResponse.json({ error: "Failed to fetch collaborators" }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ pageId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { pageId } = await params;
    const body = await request.json();
    const { email, role = "editor" } = body as { email: string; role?: string };

    if (!email) {
      return NextResponse.json({ error: "email is required" }, { status: 400 });
    }

    const invitedUser = await prisma.user.findUnique({ where: { email } });
    if (!invitedUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const prismaRole = role.toUpperCase() as "EDITOR" | "VIEWER";

    const collaborator = await prisma.pageCollaborator.upsert({
      where: { pageId_userId: { pageId, userId: invitedUser.id } },
      create: {
        pageId,
        userId: invitedUser.id,
        role: prismaRole,
        invitedBy: session.user.id,
      },
      update: { role: prismaRole },
      include: {
        user: { select: { id: true, name: true, email: true, image: true } },
      },
    });

    return NextResponse.json({
      id: collaborator.id,
      pageId: collaborator.pageId,
      userId: collaborator.userId,
      role: collaborator.role.toLowerCase(),
      invitedBy: collaborator.invitedBy,
      createdAt: collaborator.createdAt.toISOString(),
      user: collaborator.user,
    });
  } catch (error) {
    logError("POST /api/pages/[pageId]/collaborators", error);
    return NextResponse.json({ error: "Failed to add collaborator" }, { status: 500 });
  }
}
