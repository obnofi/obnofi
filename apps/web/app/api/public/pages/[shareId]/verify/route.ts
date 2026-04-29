import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@obnofi/db";
import { PAGE_INCLUDE } from "@/lib/prisma-transforms";
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
      { error: "Failed to verify password" },
      { status: 500 }
    );
  }
}
