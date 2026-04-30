import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@obnofi/db";
import { sanitizePublicContent } from "@/lib/public-content";
import { resolvePersistedYjsContent } from "@/lib/yjsContent";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ shareId: string }> }
) {
  try {
    const { shareId } = await params;
    const body = await request.json();
    const { password } = body;

    const page = await prisma.page.findFirst({
      where: { shareId, isPublic: true },
      select: {
        id: true,
        title: true,
        icon: true,
        coverImage: true,
        content: true,
        workspaceId: true,
        createdAt: true,
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

    if (!page) {
      return NextResponse.json({ error: "Page not found" }, { status: 404 });
    }

    if (page.sharePassword) {
      const isValid = await bcrypt.compare(password, page.sharePassword);
      if (!isValid) {
        return NextResponse.json({ error: "Invalid password" }, { status: 401 });
      }
    }

    // Fetch only public pages — minimal fields needed for sanitization
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

    return NextResponse.json({
      id: page.id,
      title: page.title,
      icon: page.icon,
      coverImage: page.coverImage,
      content: sanitizePublicContent(latestContent, publicPages),
      isPasswordProtected: false,
      createdAt: page.createdAt.toISOString(),
      updatedAt: latestUpdatedAt.toISOString(),
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to verify password" },
      { status: 500 }
    );
  }
}
