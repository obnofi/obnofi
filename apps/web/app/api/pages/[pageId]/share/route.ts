import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";
import bcrypt from "bcryptjs";
import { prisma } from "@obnofi/db";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ pageId: string }> }
) {
  try {
    const { pageId } = await params;
    const body = await request.json();
    const { isPublic, password } = body;

    const page = await prisma.page.findUnique({
      where: { id: pageId },
      select: { id: true, shareId: true, isPublic: true },
    });

    if (!page) {
      return NextResponse.json({ error: "Page not found" }, { status: 404 });
    }

    const updateData: {
      isPublic: boolean;
      shareId?: string | null;
      sharePassword?: string | null;
    } = { isPublic };

    if (isPublic) {
      if (!page.shareId) {
        updateData.shareId = nanoid(12);
      }
      if (password) {
        updateData.sharePassword = await bcrypt.hash(password, 10);
      }
    } else {
      updateData.shareId = null;
      updateData.sharePassword = null;
    }

    const updatedPage = await prisma.page.update({
      where: { id: pageId },
      data: updateData,
      select: { shareId: true, isPublic: true },
    });

    return NextResponse.json({
      success: true,
      shareId: updatedPage.shareId,
      isPublic: updatedPage.isPublic,
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to update share settings" },
      { status: 500 }
    );
  }
}
