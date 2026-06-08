import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@obnofi/db";
import { fromPrismaPageType } from "@/lib/prisma-transforms";

// GET /api/databases/[databaseId]/page
// Returns the page info associated with this database
import { logError } from "@/lib/logger";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ databaseId: string }> }
) {
  try {
    const { databaseId } = await params;

    const database = await prisma.database.findUnique({
      where: { id: databaseId },
      include: {
        page: { select: { id: true, title: true, type: true } },
      },
    });

    if (!database) {
      return NextResponse.json({ error: "Database not found" }, { status: 404 });
    }

    return NextResponse.json({
      id: database.page.id,
      title: database.page.title,
      type: fromPrismaPageType(database.page.type),
    });
  } catch (error) {
    logError("GET /api/databases/[databaseId]/page", error);
    return NextResponse.json(
      { error: "Failed to fetch page" },
      { status: 500 }
    );
  }
}
