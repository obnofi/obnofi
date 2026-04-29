import { NextResponse } from "next/server";
import { prisma } from "@obnofi/db";
import { PAGE_INCLUDE } from "@/lib/prisma-transforms";
import { sanitizePublicContent } from "@/lib/public-content";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ shareId: string }> }
) {
  try {
    const { shareId } = await params;

    const page = await prisma.page.findFirst({
      where: { shareId, isPublic: true },
      include: PAGE_INCLUDE,
    });

    if (!page) {
      return NextResponse.json({ error: "Page not found" }, { status: 404 });
    }

    if (page.sharePassword) {
      return NextResponse.json({
        id: page.id,
        title: page.title,
        content: null,
        isPasswordProtected: true,
        createdAt: page.createdAt.toISOString(),
        updatedAt: page.updatedAt.toISOString(),
      });
    }

    // Fetch only public pages — minimal fields needed for sanitization
    const publicPages = await prisma.page.findMany({
      where: { workspaceId: page.workspaceId, isPublic: true },
      select: { id: true, title: true },
    });

    return NextResponse.json({
      id: page.id,
      title: page.title,
      content: sanitizePublicContent(page.content as object | null, publicPages),
      isPasswordProtected: false,
      createdAt: page.createdAt.toISOString(),
      updatedAt: page.updatedAt.toISOString(),
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch page" },
      { status: 500 }
    );
  }
}
