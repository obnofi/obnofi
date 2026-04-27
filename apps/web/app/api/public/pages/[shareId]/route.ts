import { NextResponse } from "next/server";
import { prisma } from "@obnofi/db";
import { PAGE_INCLUDE, toPage } from "@/lib/prisma-transforms";
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

    // Fetch all pages in the same workspace for sanitization
    const allPrismaPages = await prisma.page.findMany({
      where: { workspaceId: page.workspaceId },
      include: PAGE_INCLUDE,
    });

    const allPages = allPrismaPages.map(toPage);

    return NextResponse.json({
      id: page.id,
      title: page.title,
      content: sanitizePublicContent(page.content as object | null, allPages),
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
