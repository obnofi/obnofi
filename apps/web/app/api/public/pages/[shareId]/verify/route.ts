import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@obnofi/db";
import { PAGE_INCLUDE, toPage } from "@/lib/prisma-transforms";
import { sanitizePublicContent } from "@/lib/public-content";

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
      include: PAGE_INCLUDE,
    });

    if (!page) {
      return NextResponse.json({ error: "Page not found" }, { status: 404 });
    }

    // Fetch all pages in the same workspace for sanitization
    const allPrismaPages = await prisma.page.findMany({
      where: { workspaceId: page.workspaceId },
      include: PAGE_INCLUDE,
    });

    const allPages = allPrismaPages.map(toPage);

    if (!page.sharePassword) {
      return NextResponse.json({
        id: page.id,
        title: page.title,
        content: sanitizePublicContent(page.content as object | null, allPages),
        isPasswordProtected: false,
        createdAt: page.createdAt.toISOString(),
        updatedAt: page.updatedAt.toISOString(),
      });
    }

    const isValid = await bcrypt.compare(password, page.sharePassword);

    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid password" },
        { status: 401 }
      );
    }

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
      { error: "Failed to verify password" },
      { status: 500 }
    );
  }
}
