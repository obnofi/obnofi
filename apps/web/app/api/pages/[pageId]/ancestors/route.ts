import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@obnofi/db";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ pageId: string }> }
) {
  try {
    const { pageId } = await params;

    const page = await prisma.page.findUnique({
      where: { id: pageId },
      select: { id: true },
    });

    if (!page) {
      return NextResponse.json({ error: "Page not found" }, { status: 404 });
    }

    const ancestors: Array<{ id: string; title: string; icon: string | null }> =
      [];

    let current = await prisma.page.findUnique({
      where: { id: pageId },
      select: { parentId: true },
    });

    while (current?.parentId) {
      const parent = await prisma.page.findUnique({
        where: { id: current.parentId },
        select: { id: true, title: true, icon: true, parentId: true },
      });

      if (!parent) break;

      ancestors.unshift({
        id: parent.id,
        title: parent.title,
        icon: parent.icon,
      });

      current = parent;
    }

    return NextResponse.json(ancestors);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch page ancestors" },
      { status: 500 }
    );
  }
}
