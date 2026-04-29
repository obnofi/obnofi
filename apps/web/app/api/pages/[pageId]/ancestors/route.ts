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

    // Single recursive CTE replaces the N+1 loop
    const ancestors = await prisma.$queryRaw<
      Array<{ id: string; title: string; icon: string | null }>
    >`
      WITH RECURSIVE ancestor_chain AS (
        SELECT id, title, icon, "parentId", 0 AS depth
        FROM "Page"
        WHERE id = ${pageId}

        UNION ALL

        SELECT p.id, p.title, p.icon, p."parentId", a.depth + 1
        FROM "Page" p
        INNER JOIN ancestor_chain a ON p.id = a."parentId"
      )
      SELECT id, title, icon
      FROM ancestor_chain
      WHERE id != ${pageId}
      ORDER BY depth DESC
    `;

    return NextResponse.json(ancestors);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch page ancestors" },
      { status: 500 }
    );
  }
}
